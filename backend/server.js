const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const summariesRoute = require('./routes/summaries'); // ✅
const { spawn } = require('child_process');
const ollamaService = require('./services/ollamaService');

const app = express();
const PORT = process.env.PORT || 3001;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware
app.use(cors({
  origin: [process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081','http://15.206.187.164:8080','http://192.168.159.1:8080'],
  credentials: true
}));

app.use(express.json());
app.use('/api', summariesRoute); // ✅ Mount the /api/summaries route

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Hariom13##',
  database: process.env.DB_NAME || 'feedback_db'
};

// Create connection pool
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Database configuration:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

// Test DB connection on startup
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM feedback');
    console.log(`Feedback table has ${rows[0].count} records`);
    connection.release();
  } catch (error) {
    console.error('Error connecting to database on startup:', error);
  }
})();

// Test Ollama microservice connection on startup
(async () => {
  try {
    console.log('Validating Ollama microservice connection...');
    const health = await ollamaService.healthCheck();
    console.log('Ollama microservice is ready:', health);
  } catch (error) {
    console.error('Error validating Ollama microservice connection:', error.message);
    console.warn('⚠️ Issue detection might not work properly due to Ollama microservice connection issues!');
    console.warn('⚠️ Ensure Ollama microservice is running on port 3002.');
  }
})();

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ 
      status: 'Connected to MySQL feedback_db successfully', 
      timestamp: new Date().toISOString(),
      database: dbConfig.database
    });
  } catch (error) {
    console.error('MySQL connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to MySQL feedback_db', 
      details: error.message,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
      }
    });
  }
});

// Get feedback data with filters
app.get('/api/feedback', async (req, res) => {
  try {
    let query = 'SELECT * FROM feedback WHERE 1=1';
    const params = [];

    if (req.query.service && req.query.service !== 'all') {
      query += ' AND service_type = ?';
      params.push(req.query.service);
    }

    if (req.query.location && req.query.location !== 'all') {
      query += ' AND issue_location = ?';
      params.push(req.query.location);
    }

    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (req.query.dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    if (req.query.customDateFrom) {
      query += ' AND created_at >= ?';
      params.push(new Date(req.query.customDateFrom).toISOString().slice(0, 19).replace('T', ' '));
    }

    if (req.query.customDateTo) {
      query += ' AND created_at <= ?';
      params.push(new Date(req.query.customDateTo).toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' ORDER BY created_at DESC';

    console.log('Final SQL Query:', query);
    console.log('Query Params:', params);

    const [rows] = await pool.execute(query, params);

    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback data from feedback_db', 
      details: error.message,
      query: req.query
    });
  }
});

// Ollama functionality is now handled by the microservice at http://localhost:3002
// See services/ollamaService.js for the client implementation

// Add this helper function at the top or in your utils file
function safeParseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    if (text && !text.trim().endsWith('}')) {
      try {
        console.warn('[DEBUG] Appending missing closing brace to Ollama output');
        return JSON.parse(text.trim() + '}');
      } catch (err2) {
        console.warn('[WARN] Fallback JSON parse still failed');
        return null;
      }
    }
    console.warn('[WARN] JSON parse failed completely');
    return null;
  }
}

async function detectIssuesFromFeedback(connection, feedback) {
  try {
    console.log(`[DEBUG] Processing feedback: ${feedback.id}, Rating: ${feedback.review_rating}, Sentiment: ${feedback.sentiment}`);
    console.log(`[DEBUG] Review text: ${feedback.review_text}`);

    if (feedback.review_rating >= 4) {
      console.log('[DEBUG] Skipping positive feedback (rating ≥ 4)');
      return null;
    }

    const { id, review_text, service_type, review_rating } = feedback;

    if (!review_text || review_text.trim().length < 10) {
      console.log('[DEBUG] Skipping feedback with insufficient text');
      return null;
    }

    console.log('[DEBUG] Using Ollama Microservice for issue detection');
    try {
      const response = await ollamaService.detectIssues({
        review_text,
        service_type,
        review_rating
      });

      console.log('[DEBUG] Raw microservice response:', response);

      if (!response.success) {
        throw new Error('Microservice returned error: ' + response.error);
      }

      const rawResult = response.result;
      const result = typeof rawResult === 'string' ? safeParseJSON(rawResult) : rawResult;

      console.log('[DEBUG] Parsed microservice response:', result);

      if (result === null) {
        console.log('[DEBUG] No issue detected in the feedback or JSON parsing failed');
        return null;
      }

      await connection.execute(
        'UPDATE feedback SET detected_issues = ? WHERE id = ?',
        [JSON.stringify(result), id]
      );
      console.log(`[DEBUG] Stored parsed result into feedback table for ID: ${id}`);

      const { title, description, category, confidence_score, resolution } = result;
      const issueTitles = title.split(',').map(t => t.trim());
      const insertedIssueIds = [];

      console.log(`[DEBUG] Extracted issue titles: ${JSON.stringify(issueTitles)}`);

      for (const individualTitle of issueTitles) {
        console.log(`[DEBUG] Checking for existing issues matching: "${individualTitle}"`);

        const [existingSimilarIssues] = await connection.execute(
          'SELECT * FROM pending_issues WHERE category = ? AND (title LIKE ? OR description LIKE ?) LIMIT 5',
          [category, `%${individualTitle.substring(0, 50)}%`, `%${description.substring(0, 50)}%`]
        );

        if (existingSimilarIssues.length > 0) {
          const existingIssue = existingSimilarIssues[0];
          await connection.execute(
            'UPDATE pending_issues SET feedback_count = feedback_count + 1 WHERE id = ?',
            [existingIssue.id]
          );
          console.log(`[DEBUG] Found similar existing issue: ${existingIssue.id}, incrementing count`);
          insertedIssueIds.push(existingIssue.id);
          continue;
        }

        const issueId = 'pending_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        console.log(`[DEBUG] Creating new pending issue: ${issueId}`);

        await connection.execute(
          `INSERT INTO pending_issues 
           (id, title, description, category, confidence_score, feedback_count, detected_from_feedback_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [issueId, individualTitle, description, category, confidence_score, 1, id]
        );

        const resolutionId = 'resolution_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        console.log(`[DEBUG] Creating new pending resolution: ${resolutionId}`);

        await connection.execute(
          `INSERT INTO pending_resolutions 
           (id, pending_issue_id, resolution_text, confidence_score, created_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [resolutionId, issueId, resolution || '', confidence_score]
        );

        console.log(`[DEBUG] Created new issue and resolution: ${issueId}, ${resolutionId}`);
        insertedIssueIds.push(issueId);
      }

      console.log('[DEBUG] Final inserted issue IDs:', insertedIssueIds);
      return insertedIssueIds.length === 1 ? insertedIssueIds[0] : insertedIssueIds;

    } catch (error) {
      console.error('[DEBUG] Error calling Ollama Microservice:', error.message);

      // Keyword fallback for ATM
      if (service_type === 'ATM') {
        const keywords = ['receipt', 'transaction', 'not working', 'card', 'cash', 'money', 'stuck'];
        for (const keyword of keywords) {
          if (review_text.toLowerCase().includes(keyword)) {
            console.log(`[DEBUG] Triggering fallback issue creation for keyword: ${keyword}`);

            const fallbackResult = {
              title: `ATM ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} Issue`,
              description: `Customer reported an issue related to ${keyword} at the ATM.`,
              category: "ATM",
              confidence_score: 0.75,
              resolution: `Check ATM for issues related to ${keyword}. Verify transaction status. Contact customer. Schedule maintenance if required.`
            };

            await connection.execute(
              'UPDATE feedback SET detected_issues = ? WHERE id = ?',
              [JSON.stringify(fallbackResult), id]
            );

            const issueId = 'pending_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            await connection.execute(
              `INSERT INTO pending_issues 
               (id, title, description, category, confidence_score, feedback_count, detected_from_feedback_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
              [
                issueId,
                fallbackResult.title,
                fallbackResult.description,
                fallbackResult.category,
                fallbackResult.confidence_score,
                1,
                id
              ]
            );

            const resolutionId = 'resolution_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            await connection.execute(
              `INSERT INTO pending_resolutions 
               (id, pending_issue_id, resolution_text, confidence_score, created_at)
               VALUES (?, ?, ?, ?, NOW())`,
              [
                resolutionId,
                issueId,
                fallbackResult.resolution,
                fallbackResult.confidence_score
              ]
            );

            console.log(`[DEBUG] Fallback issue created: ${issueId}`);
            return issueId;
          }
        }
      }

      return null;
    }

  } catch (err) {
    console.error('[DEBUG] Unexpected error in issue detection:', err.message);
    return null;
  }
}

async function detectPositiveAspectsFromFeedback(connection, feedback) {
  try {
    console.log(`[DEBUG] Processing feedback for positives: ${feedback.id}, Rating: ${feedback.review_rating}, Sentiment: ${feedback.sentiment}`);
    console.log(`[DEBUG] Review text: ${feedback.review_text}`);

    const { id, review_text, service_type, review_rating } = feedback;

    if (!review_text || review_text.trim().length < 10) {
      console.log('[DEBUG] Skipping feedback with insufficient text');
      return null;
    }

    console.log('[DEBUG] Using Ollama Microservice for positive aspect detection');
    try {
      const response = await ollamaService.detectPositiveAspects({
        review_text,
        service_type,
        review_rating
      });

      console.log('[DEBUG] Raw microservice response:', response);

      if (!response.success) {
        throw new Error('Microservice returned error: ' + response.error);
      }

      const rawResult = response.result;
      const result = typeof rawResult === 'string' ? safeParseJSON(rawResult) : rawResult;

      console.log('[DEBUG] Parsed microservice response:', result);

      if (result === null) {
        console.log('[DEBUG] No positive aspect detected in the feedback');
        return null;
      }

      await connection.execute(
        'UPDATE feedback SET detected_positive_aspects = ? WHERE id = ?',
        [JSON.stringify(result), id]
      );
      console.log(`[DEBUG] Stored parsed result into feedback table for ID: ${id}`);

      const { title, description, category, confidence_score } = result;
      const aspectTitles = title.split(',').map(t => t.trim());
      const insertedAspectIds = [];

      console.log(`[DEBUG] Extracted aspect titles: ${JSON.stringify(aspectTitles)}`);

      for (const individualTitle of aspectTitles) {
        console.log(`[DEBUG] Checking for existing positive aspects matching: "${individualTitle}"`);

        const [existingSimilarAspects] = await connection.execute(
          'SELECT * FROM positive_aspects WHERE category = ? AND (title LIKE ? OR description LIKE ?) LIMIT 5',
          [category, `%${individualTitle.substring(0, 50)}%`, `%${description.substring(0, 50)}%`]
        );

        if (existingSimilarAspects.length > 0) {
          const existingAspect = existingSimilarAspects[0];
          await connection.execute(
            'UPDATE positive_aspects SET feedback_count = feedback_count + 1 WHERE id = ?',
            [existingAspect.id]
          );
          console.log(`[DEBUG] Found similar existing aspect: ${existingAspect.id}, incrementing count`);
          insertedAspectIds.push(existingAspect.id);
          continue;
        }

        const aspectId = 'positive_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        console.log(`[DEBUG] Creating new positive aspect: ${aspectId}`);

        await connection.execute(
          `INSERT INTO positive_aspects 
           (id, title, description, category, confidence_score, feedback_count, detected_from_feedback_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [aspectId, individualTitle, description, category, confidence_score, 1, id]
        );

        console.log(`[DEBUG] Created positive aspect: ${aspectId}`);
        insertedAspectIds.push(aspectId);
      }

      console.log('[DEBUG] Final inserted positive aspect IDs:', insertedAspectIds);
      return insertedAspectIds.length === 1 ? insertedAspectIds[0] : insertedAspectIds;

    } catch (error) {
      console.error('[DEBUG] Error calling Ollama Microservice for positive detection:', error.message);
      return null;
    }

  } catch (err) {
    console.error('[DEBUG] Unexpected error in positive detection:', err.message);
    return null;
  }
}

app.post('/api/feedback', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const {
      customer_name, customer_phone, customer_email, customer_id,
      service_type, review_text, review_rating, issue_location,
      contacted_bank_person, status = 'new'
    } = req.body;

    console.log(`[INFO] Creating new feedback from ${customer_name}, Rating: ${review_rating}, Service: ${service_type}`);

    const feedbackId = 'fb_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const positive_flag = review_rating >= 4;
    const negative_flag = review_rating <= 3;
    const sentiment = positive_flag ? 'positive' : 'negative';

    const query = `
      INSERT INTO feedback (
        id, customer_name, customer_phone, customer_email, customer_id,
        service_type, review_text, review_rating, issue_location,
        contacted_bank_person, status, sentiment, positive_flag, negative_flag,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      feedbackId, customer_name, customer_phone, customer_email, customer_id,
      service_type, review_text, review_rating, issue_location,
      contacted_bank_person, status, sentiment, positive_flag, negative_flag
    ];

    await connection.execute(query, params);
    console.log(`[INFO] Feedback created with ID: ${feedbackId}`);

    let issueId = null;

    // 🔍 Detect issues (only for negative feedback)
    if (negative_flag) {
      console.log(`[INFO] Negative feedback detected (rating ${review_rating}), detecting issues...`);
      try {
        issueId = await detectIssuesFromFeedback(connection, {
          id: feedbackId, review_text, service_type, review_rating, sentiment, positive_flag, negative_flag
        });

        const issueIds = Array.isArray(issueId) ? issueId : issueId ? [issueId] : [];

        if (issueIds.length > 0) {
          issueIds.forEach(id => console.log(`[INFO] Issue detected and created with ID: ${id}`));
        } else {
          console.log(`[WARN] No issues detected for negative feedback ID: ${feedbackId}`);
        }

        // ⚠️ Fallback issue for ATM receipt
        if (issueIds.length === 0 && service_type === 'ATM' && review_text.toLowerCase().includes('receipt')) {
          console.log('[INFO] Fallback: Creating ATM receipt issue');
          const fallbackId = 'pending_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

          await connection.execute(
            `INSERT INTO pending_issues 
              (id, title, description, category, confidence_score, feedback_count, detected_from_feedback_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              fallbackId,
              "ATM Receipt Issue",
              "Customer reported issues with ATM receipts or transaction confirmation.",
              "ATM",
              0.9,
              1,
              feedbackId
            ]
          );

          const resolutionId = 'resolution_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          await connection.execute(
            `INSERT INTO pending_resolutions 
              (id, pending_issue_id, resolution_text, confidence_score, created_at)
              VALUES (?, ?, ?, ?, NOW())`,
            [
              resolutionId,
              fallbackId,
              "1. Verify if the transaction was completed successfully in the system. 2. Inform the customer about their transaction status. 3. Check the ATM's receipt printer functionality. 4. Schedule maintenance if needed.",
              0.9
            ]
          );

          const fallbackIssue = {
            title: "ATM Receipt Issue",
            description: "Customer reported issues with ATM receipts or transaction confirmation.",
            category: "ATM",
            confidence_score: 0.9,
            resolution: "1. Verify if the transaction was completed successfully in the system. 2. Inform the customer about their transaction status. 3. Check the ATM's receipt printer functionality. 4. Schedule maintenance if needed."
          };

          await connection.execute(
            'UPDATE feedback SET detected_issues = ? WHERE id = ?',
            [JSON.stringify(fallbackIssue), feedbackId]
          );

          console.log(`[INFO] Created fallback issue with ID: ${fallbackId}`);
          issueId = [fallbackId];
        }

      } catch (issueError) {
        console.error('[ERROR] Issue detection failed:', issueError);
      }

    } else {
      console.log(`[INFO] Positive feedback (rating ${review_rating}), skipping issue detection`);
    }

    // Detect positive aspects (for ALL feedbacks)
    try {
      await detectPositiveAspectsFromFeedback(connection, {
        id: feedbackId, review_text, service_type, review_rating, sentiment, positive_flag, negative_flag
      });
      console.log(`[INFO] Positive aspect detection completed for feedback ID: ${feedbackId}`);
    } catch (positiveErr) {
      console.error('[ERROR] Positive aspect detection failed:', positiveErr);
    }

    await connection.commit();

    const issueIds = Array.isArray(issueId) ? issueId : issueId ? [issueId] : [];

    res.json({
      success: true,
      id: feedbackId,
      issue_detected: issueIds.length > 0,
      issue_ids: issueIds,
      message: 'Feedback created successfully'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[ERROR] Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to create feedback record', details: error.message });
  } finally {
    if (connection) connection.release();
  }
});

// Update feedback
app.put('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    updateFields.push('updated_at = NOW()');
    params.push(id);

    const query = `UPDATE feedback SET ${updateFields.join(', ')} WHERE id = ?`;

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Feedback record not found' });

    res.json({ success: true, message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback record', details: error.message });
  }
});

// Delete feedback
app.delete('/api/feedback/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM feedback WHERE id = ?';
    const [result] = await pool.execute(query, [id]);

    if (result.affectedRows === 0) return res.status(404).json({ error: 'Feedback record not found' });

    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback record', details: error.message });
  }
});

// Metrics summary
app.get('/api/metrics', async (req, res) => {
  try {
    let query = 'SELECT COUNT(*) as total, SUM(positive_flag) as positive, SUM(negative_flag) as negative, AVG(review_rating) as avg_rating FROM feedback WHERE 1=1';
    const params = [];

    if (req.query.service && req.query.service !== 'all') {
      query += ' AND service_type = ?';
      params.push(req.query.service);
    }

    if (req.query.location && req.query.location !== 'all') {
      query += ' AND issue_location = ?';
      params.push(req.query.location);
    }

    const [rows] = await pool.execute(query, params);
    const metrics = rows[0];

    res.json({
      total: parseInt(metrics.total) || 0,
      positive: parseInt(metrics.positive) || 0,
      negative: parseInt(metrics.negative) || 0,
      avgRating: parseFloat(metrics.avg_rating) || 0
    });
  } catch (error) {
    console.error('Metrics query error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
});

function runNlpSummaryScript() {
  const scriptPath = path.join(__dirname, 'scripts', 'nlp_summary_generator.py');
  console.log(`[DEBUG] Running NLP summary script at path: ${scriptPath}`);

  const pythonProcess = spawn('python', [scriptPath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[PYTHON OUT]: ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[PYTHON ERR]: ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`[PYTHON EXITED]: with code ${code}`);
  });

  pythonProcess.on('error', (err) => {
    console.error(`[PYTHON ERROR]: Failed to start process`, err);
  });
}

// ⏱️ Call it immediately on server start (optional)
runNlpSummaryScript();

// ⏲️ Set interval to 24 hours (24 * 60 * 60 * 1000 ms)
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
setInterval(runNlpSummaryScript, TWENTY_FOUR_HOURS);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), database: 'feedback_db', message: 'Backend connected to MySQL' });
});

// CSV import with issue detection
app.post('/api/import-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No CSV file uploaded' });

    const results = [];
    const filePath = path.join(req.file.path);
    let successCount = 0;
    let errorCount = 0;
    let issuesDetected = 0;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', data => results.push(data))
      .on('end', async () => {
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();

          for (const record of results) {
            try {
              const feedbackId = 'fb_csv_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

              const customer_name = record.customer_name || record.name || record.customer || '';
              let service_type = record.service_type || record.service || 'ATM';

              // Normalize service type
              if (service_type.toLowerCase().includes('online') || service_type.toLowerCase().includes('internet') || service_type.toLowerCase().includes('mobile') || service_type.toLowerCase().includes('digital')) {
                service_type = 'OnlineBanking';
              } else if (service_type.toLowerCase().includes('core') || service_type.toLowerCase().includes('branch')) {
                service_type = 'CoreBanking';
              } else {
                service_type = 'ATM';
              }

              const review_text = record.review_text || record.review || record.feedback || record.comment || '';
              const review_rating = parseInt(record.review_rating || record.rating || '3');
              const customer_phone = record.customer_phone || record.phone || '';
              const customer_email = record.customer_email || record.email || '';
              const customer_id = record.customer_id || record.id || '';
              const issue_location = record.issue_location || record.location || '';

              const positive_flag = review_rating >= 4;
              const negative_flag = review_rating <= 3;

              const sentiment = positive_flag ? 'positive' : 'negative';

              const query = `
                INSERT INTO feedback (
                  id, customer_name, customer_phone, customer_email, customer_id,
                  service_type, review_text, review_rating, issue_location,
                  sentiment, status, positive_flag, negative_flag, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
              `;

              const params = [
                feedbackId,
                customer_name,
                customer_phone,
                customer_email,
                customer_id,
                service_type,
                review_text,
                review_rating,
                issue_location,
                sentiment,
                'new',
                positive_flag,
                negative_flag
              ];

              await connection.execute(query, params);
              successCount++;

              if (negative_flag) {
                const feedback = {
                  id: feedbackId,
                  review_text,
                  service_type,
                  review_rating,
                  sentiment,
                  positive_flag,
                  negative_flag
                };
                const issueId = await detectIssuesFromFeedback(connection, feedback);
                if (issueId) issuesDetected++;
              }
            } catch (err) {
              console.error('Error inserting record:', err, record);
              errorCount++;
            }
          }

          await connection.commit();
          fs.unlinkSync(filePath);

          res.json({
            success: true,
            message: `CSV import completed. Imported ${successCount} records, detected ${issuesDetected} issues. Failed: ${errorCount}`,
            imported: successCount,
            issues_detected: issuesDetected,
            failed: errorCount
          });
        } catch (error) {
          await connection.rollback();
          throw error;
        } finally {
          connection.release();
        }
      });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Failed to import CSV data', details: error.message });
  }
});

// Retrieve pending issues
app.get('/api/pending-issues', async (req, res) => {
  try {
    // Get all pending issues
    const [pendingIssues] = await pool.execute(
      'SELECT * FROM pending_issues ORDER BY created_at DESC'
    );

    // For each pending issue, get its resolutions and feedback data
    const result = await Promise.all(pendingIssues.map(async (issue) => {
      // Get resolutions for this issue
      const [resolutions] = await pool.execute(
        'SELECT id, resolution_text, confidence_score FROM pending_resolutions WHERE pending_issue_id = ?',
        [issue.id]
      );

      // Get feedback data if it exists
      let feedback = null;
      if (issue.detected_from_feedback_id) {
        const [feedbackRows] = await pool.execute(
          'SELECT customer_name, review_text, issue_location FROM feedback WHERE id = ?',
          [issue.detected_from_feedback_id]
        );
        if (feedbackRows.length > 0) {
          feedback = feedbackRows[0];
        }
      }

      return {
        ...issue,
        pending_resolutions: resolutions,
        feedback
      };
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching pending issues:', error);
    res.status(500).json({ error: 'Failed to fetch pending issues', details: error.message });
  }
});

// GET issues with optional status filter
app.get('/api/issues', async (req, res) => {
  try {
    let query = 'SELECT id, title, category, description, feedback_count FROM issues';
    const params = [];

    if (req.query.status) {
      query += ' WHERE status = ?';
      params.push(req.query.status);
    }

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({ error: 'Failed to fetch issues', details: error.message });
  }
});

// POST new issue
app.post('/api/issues', async (req, res) => {
  try {
    const {
      title, description, category, resolution, status,
      confidence_score, feedback_count, approved_by, approved_date
    } = req.body;

    const issueId = 'issue_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    // Convert ISO date to MySQL datetime format if approved_date is provided
    const formattedApprovedDate = approved_date
      ? new Date(approved_date).toISOString().slice(0, 19).replace('T', ' ')
      : null;

    await pool.execute(
      `INSERT INTO issues (
        id, title, description, category, resolution, status,
        confidence_score, feedback_count, approved_by, approved_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        issueId, title, description, category, resolution, status,
        confidence_score, feedback_count, approved_by, formattedApprovedDate
      ]
    );

    res.json({ success: true, id: issueId });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Failed to create issue', details: error.message });
  }
});

// DELETE pending issue
app.delete('/api/pending-issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated resolutions first
    await pool.execute(
      'DELETE FROM pending_resolutions WHERE pending_issue_id = ?',
      [id]
    );
    
    // Then delete the pending issue
    const [result] = await pool.execute(
      'DELETE FROM pending_issues WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending issue not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pending issue:', error);
    res.status(500).json({ error: 'Failed to delete pending issue', details: error.message });
  }
});

// PUT update existing issue
app.put('/api/issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        let value = updates[key];

        // Format any datetime fields
        if ((key === 'updated_at' || key === 'approved_date') && value) {
          value = new Date(value).toISOString().slice(0, 19).replace('T', ' ');
        }

        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE issues SET ${updateFields.join(', ')} WHERE id = ?`;

    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: 'Failed to update issue', details: error.message });
  }
});

// POST rejected issue
app.post('/api/rejected-issues', async (req, res) => {
  try {
    const {
      original_title, original_description, category,
      rejection_reason, rejected_by, original_pending_issue_id
    } = req.body;

    const rejectedId = 'rejected_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    await pool.execute(
      `INSERT INTO rejected_issues (
        id, original_title, original_description, category,
        rejection_reason, rejected_by, original_pending_issue_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        rejectedId, original_title, original_description, category,
        rejection_reason, rejected_by, original_pending_issue_id
      ]
    );

    res.json({ success: true, id: rejectedId });
  } catch (error) {
    console.error('Error creating rejected issue:', error);
    res.status(500).json({ error: 'Failed to create rejected issue', details: error.message });
  }
});

// GET rejected issues
app.get('/api/rejected-issues', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM rejected_issues ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching rejected issues:', error);
    res.status(500).json({ error: 'Failed to fetch rejected issues', details: error.message });
  }
});

// PUT update pending issue
app.put('/api/pending-issues/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updateFields = [];
    const params = [];

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const query = `UPDATE pending_issues SET ${updateFields.join(', ')} WHERE id = ?`;
    
    const [result] = await pool.execute(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending issue not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating pending issue:', error);
    res.status(500).json({ error: 'Failed to update pending issue', details: error.message });
  }
});

// PUT update resolution
app.put('/api/pending-resolutions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_text } = req.body;
    
    const [result] = await pool.execute(
      'UPDATE pending_resolutions SET resolution_text = ? WHERE id = ?',
      [resolution_text, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Resolution not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating resolution:', error);
    res.status(500).json({ error: 'Failed to update resolution', details: error.message });
  }
});

// POST new resolution
app.post('/api/pending-resolutions', async (req, res) => {
  try {
    const { pending_issue_id, resolution_text, confidence_score } = req.body;

    const resolutionId = 'resolution_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    await pool.execute(
      `INSERT INTO pending_resolutions (
        id, pending_issue_id, resolution_text, confidence_score, created_at
      ) VALUES (?, ?, ?, ?, NOW())`,
      [resolutionId, pending_issue_id, resolution_text, confidence_score]
    );

    res.json({ success: true, id: resolutionId });
  } catch (error) {
    console.error('Error creating resolution:', error);
    res.status(500).json({ error: 'Failed to create resolution', details: error.message });
  }
});

// GET approved issues for dashboard
app.get('/api/approved-issues', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT *
       FROM issues 
       WHERE status = 'approved'
       ORDER BY feedback_count DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching approved issues:', err.message);
    res.status(500).json({ error: 'Failed to fetch approved issues' });
  }
});

// GET employee performance based on feedback interactions
app.get('/api/employee-performance', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        be.employee_id,
        be.name,
        be.department,
        be.branch_location,
        be.role,
        COUNT(efi.id) AS interactions_handled,
        SUM(CASE WHEN efi.interaction_type = 'resolved' THEN 1 ELSE 0 END) AS resolved_count,
        SUM(CASE WHEN efi.interaction_type = 'contacted' THEN 1 ELSE 0 END) AS contacted_count,
        ROUND(AVG(f.review_rating), 1) AS avg_rating,
        SUM(CASE WHEN f.sentiment = 'positive' THEN 1 ELSE 0 END) AS positive_feedback_handled,
        SUM(CASE WHEN f.sentiment = 'negative' THEN 1 ELSE 0 END) AS negative_feedback_handled
      FROM bank_employees be
      LEFT JOIN employee_feedback_interactions efi ON be.id = efi.employee_id
      LEFT JOIN feedback f ON efi.feedback_id = f.id
      GROUP BY be.employee_id, be.name, be.department, be.branch_location, be.role
    `);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({ error: 'Failed to fetch employee performance data', details: error.message });
  }
});

// User Authentication Endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if we have a users table, if not create it
    const connection = await pool.getConnection();
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'users'
    `, [dbConfig.database]);
    
    // Create users table if it doesn't exist
    if (tables.length === 0) {
      await connection.query(`
        CREATE TABLE users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          contact_number VARCHAR(50) NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'employee'
        )
      `);
      
      // Insert default users
      await connection.query(`
        INSERT INTO users (id, username, email, password, role) VALUES 
        (UUID(), 'admin', 'admin@maubank.my', 'admin123', 'admin'),
        (UUID(), 'employee1', 'employee1@maubank.my', 'employee1', 'employee')
      `);
    }
    
    // Query for the user
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    connection.release();
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // In a real app, you would use bcrypt.compare() to compare hashed passwords
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Return user info without password
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      success: true,
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// Verify user authentication status
app.get('/api/auth/verify', async (req, res) => {
  try {
    // In a real production app, you would use JWT or session tokens for authentication
    // This is a simplified implementation for the demo
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        authenticated: false, 
        message: 'Authentication required' 
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // In a real app, you would verify the token with JWT or similar
    // For now, just check if the token represents a user ID
    if (token) {
      const connection = await pool.getConnection();
      const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [token]);
      connection.release();
      
      if (users.length > 0) {
        const user = users[0];
        const { password: _, ...userWithoutPassword } = user;
        
        return res.json({
          authenticated: true,
          user: userWithoutPassword
        });
      }
    }
    
    res.status(401).json({ 
      authenticated: false, 
      message: 'Invalid or expired token' 
    });
    
  } catch (error) {
    console.error('Authentication verification error:', error);
    res.status(500).json({ 
      authenticated: false, 
      error: 'Authentication verification failed', 
      details: error.message 
    });
  }
});

// Get sentiment analysis data with filters (using positive_flag and negative_flag)
app.get('/api/sentiment-analysis', async (req, res) => {
  try {
    let query = `
      SELECT 
        SUM(positive_flag) as positive_count,
        SUM(negative_flag) as negative_count,
        COUNT(*) as total,
        AVG(review_rating) as avg_rating
      FROM feedback
      WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (req.query.service_type && req.query.service_type !== 'all') {
      query += ' AND service_type = ?';
      params.push(req.query.service_type);
    }
    if (req.query.location && req.query.location !== 'all') {
      query += ' AND issue_location = ?';
      params.push(req.query.location);
    }
    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (req.query.dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    const [rows] = await pool.execute(query, params);
    const row = rows[0];

    const sentimentData = [
      { name: 'Positive', value: Number(row.positive_count) || 0, color: '#4CAF50' },
      { name: 'Negative', value: Number(row.negative_count) || 0, color: '#FF5252' }
    ];

    res.json({
      sentimentData,
      total: Number(row.total) || 0,
      avgRating: Number(row.avg_rating) || 0
    });
  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment analysis data', details: error.message });
  }
});

// Get recent feedback summary with filters
app.get('/api/feedback-summary', async (req, res) => {
  try {
    let query = `
      SELECT 
        id,
        customer_name,
        review_text,
        review_rating,
        sentiment,
        service_type,
        issue_location,
        created_at
      FROM feedback 
      WHERE 1=1
    `;
    const params = [];

    // Add filters
    if (req.query.service_type && req.query.service_type !== 'all') {
      query += ' AND service_type = ?';
      params.push(req.query.service_type);
    }

    if (req.query.location && req.query.location !== 'all') {
      query += ' AND issue_location = ?';
      params.push(req.query.location);
    }

    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (req.query.dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' ORDER BY created_at DESC LIMIT 5';

    const [rows] = await pool.execute(query, params);

    // Format the feedback data
    const feedbackSummary = rows.map(row => ({
      id: row.id,
      sentiment: row.sentiment.charAt(0).toUpperCase() + row.sentiment.slice(1),
      summary: row.review_text.length > 100 
        ? row.review_text.substring(0, 100) + '...' 
        : row.review_text,
      rating: row.review_rating,
      service_type: row.service_type,
      location: row.issue_location,
      created_at: row.created_at
    }));

    res.json(feedbackSummary);
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    res.status(500).json({ error: 'Failed to fetch feedback summary', details: error.message });
  }
});

// Get unique locations for filter dropdown
app.get('/api/locations', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT DISTINCT issue_location FROM feedback WHERE issue_location IS NOT NULL AND issue_location != ""'
    );
    res.json(rows.map(row => row.issue_location));
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations', details: error.message });
  }
});

// Analyze feedback using LLM
app.post('/api/analyze-feedback', async (req, res) => {
  try {
    const { feedback_text, rating, service_type } = req.body;

    if (!feedback_text) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // Skip LLM analysis for very short feedback
    if (feedback_text.trim().length < 10) {
      return res.json({
        positive_comments: null,
        issue_description: null,
        resolution: null
      });
    }

    const response = await ollamaService.analyzeFeedback({
      feedback_text,
      rating,
      service_type
    });

    if (!response.success) {
      throw new Error('Microservice returned error: ' + response.error);
    }

    res.json(response.result);
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ 
      error: 'Failed to analyze feedback', 
      details: error.message 
    });
  }
});

// Enhanced feedback analysis endpoint
app.post('/api/enhanced-feedback-analysis', async (req, res) => {
  try {
    const { feedback_text, rating, service_type, location } = req.body;

    if (!feedback_text) {
      return res.status(400).json({ error: 'Feedback text is required' });
    }

    // Skip LLM analysis for very short feedback
    if (feedback_text.trim().length < 10) {
      return res.json({
        analysis: null,
        suggested_resolution: null,
        transaction_type: service_type,
        sentiment_score: rating >= 4 ? 'positive' : 'negative'
      });
    }

    const response = await ollamaService.enhancedFeedbackAnalysis({
      feedback_text,
      rating,
      service_type,
      location
    });

    if (!response.success) {
      throw new Error('Microservice returned error: ' + response.error);
    }

    res.json(response.result);
  } catch (error) {
    console.error('Error in enhanced feedback analysis:', error);
    res.status(500).json({ error: 'Failed to analyze feedback', details: error.message });
  }
});

// Get location-based feedback trends
app.get('/api/location-trends', async (req, res) => {
  try {
    const { location, dateRange } = req.query;
    let query = `
      SELECT 
        sentiment,
        COUNT(*) as count,
        AVG(review_rating) as avg_rating,
        GROUP_CONCAT(review_text SEPARATOR '|||') as feedback_texts
      FROM feedback
      WHERE issue_location = ?
    `;
    const params = [location];

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' GROUP BY sentiment';

    const [rows] = await pool.execute(query, params);
    
    // Process feedback texts to find common themes
    const processedData = rows.map(row => ({
      sentiment: row.sentiment,
      count: row.count,
      avg_rating: Number(row.avg_rating).toFixed(1),
      feedback_texts: row.feedback_texts.split('|||').slice(0, 5) // Get top 5 feedback texts
    }));

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching location trends:', error);
    res.status(500).json({ error: 'Failed to fetch location trends', details: error.message });
  }
});

// Get transaction type analysis
app.get('/api/transaction-analysis', async (req, res) => {
  try {
    const { dateRange } = req.query;
    let query = `
      SELECT 
        service_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        AVG(review_rating) as avg_rating
      FROM feedback
      WHERE 1=1
    `;
    const params = [];

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' GROUP BY service_type';

    const [rows] = await pool.execute(query, params);
    
    const analysis = rows.map(row => ({
      service_type: row.service_type,
      total_count: row.total_count,
      positive_count: row.positive_count,
      negative_count: row.negative_count,
      avg_rating: Number(row.avg_rating).toFixed(1),
      positive_percentage: ((row.positive_count / row.total_count) * 100).toFixed(1),
      negative_percentage: ((row.negative_count / row.total_count) * 100).toFixed(1)
    }));

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching transaction analysis:', error);
    res.status(500).json({ error: 'Failed to fetch transaction analysis', details: error.message });
  }
});

// Get sentiment trends over time
app.get('/api/sentiment-trends', async (req, res) => {
  try {
    const { dateRange } = req.query;
    let query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_count,
        SUM(CASE WHEN sentiment = 'positive' THEN 1 ELSE 0 END) as positive_count,
        SUM(CASE WHEN sentiment = 'negative' THEN 1 ELSE 0 END) as negative_count,
        AVG(review_rating) as avg_rating
      FROM feedback
      WHERE 1=1
    `;
    const params = [];

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' GROUP BY DATE(created_at) ORDER BY date';

    const [rows] = await pool.execute(query, params);
    
    const trends = rows.map(row => ({
      date: row.date,
      total_count: row.total_count,
      positive_count: row.positive_count,
      negative_count: row.negative_count,
      avg_rating: Number(row.avg_rating).toFixed(1),
      positive_percentage: ((row.positive_count / row.total_count) * 100).toFixed(1),
      negative_percentage: ((row.negative_count / row.total_count) * 100).toFixed(1)
    }));

    res.json(trends);
  } catch (error) {
    console.error('Error fetching sentiment trends:', error);
    res.status(500).json({ error: 'Failed to fetch sentiment trends', details: error.message });
  }
});

// Get location-based feedback analysis
app.get('/api/location-feedback-analysis', async (req, res) => {
  try {
    const { dateRange } = req.query;
    let query = `
      SELECT 
        issue_location,
        SUM(positive_flag) as positive_count,
        SUM(negative_flag) as negative_count,
        COUNT(*) as feedback_count,
        AVG(review_rating) as avg_rating,
        MONTH(created_at) as month,
        YEAR(created_at) as year
      FROM feedback
      WHERE issue_location IS NOT NULL AND issue_location != ''
    `;
    const params = [];

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' GROUP BY issue_location, MONTH(created_at), YEAR(created_at) ORDER BY year, month';

    const [rows] = await pool.execute(query, params);
    
    // Process the data for frontend consumption
    const locationAnalysis = {};
    const monthlyTrends = {};

    rows.forEach(row => {
      const location = row.issue_location;
      const monthYear = `${row.year}-${String(row.month).padStart(2, '0')}`;
      
      // Initialize location data if not exists
      if (!locationAnalysis[location]) {
        locationAnalysis[location] = {
          total_feedback: 0,
          avg_rating: 0,
          sentiment_distribution: {
            positive: 0,
            negative: 0,
            neutral: 0
          }
        };
      }

      // Initialize monthly trends if not exists
      if (!monthlyTrends[monthYear]) {
        monthlyTrends[monthYear] = {
          positive: 0,
          negative: 0,
          neutral: 0
        };
      }

      // Update location analysis
      locationAnalysis[location].total_feedback += row.feedback_count;
      locationAnalysis[location].avg_rating = 
        (locationAnalysis[location].avg_rating * (locationAnalysis[location].total_feedback - row.feedback_count) + 
         row.avg_rating * row.feedback_count) / locationAnalysis[location].total_feedback;

      // Update sentiment distribution using flags
      locationAnalysis[location].sentiment_distribution.positive += Number(row.positive_count);
      locationAnalysis[location].sentiment_distribution.negative += Number(row.negative_count);
      locationAnalysis[location].sentiment_distribution.neutral += (row.feedback_count - row.positive_count - row.negative_count);

      // Update monthly trends
      monthlyTrends[monthYear].positive += Number(row.positive_count);
      monthlyTrends[monthYear].negative += Number(row.negative_count);
      monthlyTrends[monthYear].neutral += (row.feedback_count - row.positive_count - row.negative_count);
    });

    // Get top issues for each location
    const locationIssues = {};
    for (const location in locationAnalysis) {
      const issuesQuery = `
        SELECT 
          review_text,
          service_type,
          review_rating,
          COUNT(*) as occurrence
        FROM feedback
        WHERE issue_location = ? AND negative_flag = 1
        GROUP BY review_text, service_type, review_rating
        ORDER BY occurrence DESC
        LIMIT 5
      `;
      const [issues] = await pool.execute(issuesQuery, [location]);
      locationIssues[location] = issues;
    }

    res.json({
      location_analysis: locationAnalysis || {},
      monthly_trends: monthlyTrends || {},
      location_issues: locationIssues || {}
    });
  } catch (error) {
    console.error('Error fetching location feedback analysis:', error);
    res.status(500).json({ error: 'Failed to fetch location feedback analysis', details: error.message });
  }
});

// Get location-specific feedback details
app.get('/api/location-feedback-details', async (req, res) => {
  try {
    const { location, dateRange } = req.query;
    let query = `
      SELECT 
        f.*,
        DATE_FORMAT(created_at, '%Y-%m') as month_year
      FROM feedback f
      WHERE issue_location = ?
    `;
    const params = [location];

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching location feedback details:', error);
    res.status(500).json({ error: 'Failed to fetch location feedback details', details: error.message });
  }
});

// Post location analytics description
app.post('/api/location-analytics-description', async (req, res) => {
  try {
    const { location, dateRange } = req.body;
    if (!location) return res.status(400).json({ error: 'Location is required' });
    let query = 'SELECT service_type, review_text, review_rating FROM feedback WHERE issue_location = ?';
    const params = [location];
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateRange) {
        case 'last_week': startDate.setDate(now.getDate() - 7); break;
        case 'last_month': startDate.setMonth(now.getMonth() - 1); break;
        case 'last_quarter': startDate.setMonth(now.getMonth() - 3); break;
        case 'last_year': startDate.setFullYear(now.getFullYear() - 1); break;
      }
      query += ' AND created_at >= ?';
      params.push(startDate.toISOString().slice(0, 19).replace('T', ' '));
    }
    const [rows] = await pool.execute(query, params);
    const feedbacks = rows.map(r => `Service: ${r.service_type}, Rating: ${r.review_rating}, Feedback: ${r.review_text}`).join('\n');
    
    const response = await ollamaService.locationAnalyticsDescription({
      location,
      feedbacks
    });

    if (!response.success) {
      throw new Error('Microservice returned error: ' + response.error);
    }

    res.json({ description: response.result.description });
  } catch (error) {
    console.error('Error generating location analytics description:', error);
    res.status(500).json({ error: 'Failed to generate analytics description', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Connected to MySQL database: ${dbConfig.database}`);
  // console.log(`Test connection at: http://3.110.194.210:${PORT}/api/test-connection`);
  // console.log(`Health check at: http://3.110.194.210:${PORT}/api/health`);
  console.log(`Test connection at: http://localhost:${PORT}/api/test-connection`);
  console.log(`Health check at: http://localhost:${PORT}/api/health`);
});
