// Middleware
app.use(cors({
  origin: [process.env.CORS_ORIGIN, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json()); 

// CSV Import endpoint
app.post('/api/import-csv', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    const results = [];
    const filePath = path.join(req.file.path);
    let successCount = 0;
    let errorCount = 0;
    
    // Read and parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        console.log(`Parsed ${results.length} records from CSV`);
        
        const connection = await pool.getConnection();
        try {
          await connection.beginTransaction();
          
          for (const record of results) {
            try {
              // Generate a unique ID for each feedback
              const feedbackId = 'fb_csv_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
              
              // Map CSV fields to database fields - handle various column name possibilities
              const customer_name = record.customer_name || record.name || record.customer || '';
              
              // Handle different service type formats
              let service_type = record.service_type || record.service || 'ATM';
              // Normalize service type values
              if (service_type.toLowerCase().includes('online') || 
                  service_type.toLowerCase().includes('internet') || 
                  service_type.toLowerCase().includes('mobile') || 
                  service_type.toLowerCase().includes('digital')) {
                service_type = 'OnlineBanking';
              } else if (service_type.toLowerCase().includes('core') || 
                         service_type.toLowerCase().includes('branch')) {
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
              
              // Calculate sentiment flags
              const positive_flag = review_rating >= 4;
              const negative_flag = review_rating <= 3 && review_rating > 0;
              const sentiment = positive_flag ? 'positive' : (negative_flag ? 'negative' : 'neutral');
              
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
              console.log(`Inserted record ${successCount}: ${customer_name}`);
            } catch (err) {
              console.error('Error inserting record:', err, record);
              errorCount++;
            }
          }
          
          await connection.commit();
          
          // Clean up the uploaded file
          fs.unlinkSync(filePath);
          
          res.json({
            success: true,
            message: `CSV import completed. Imported ${successCount} records. Failed: ${errorCount}`,
            imported: successCount,
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
    res.status(500).json({ 
      error: 'Failed to import CSV data', 
      details: error.message 
    });
  }
}); 

// GET rejected issues
app.get('/api/rejected-issues', async (req, res) => {
  try {
    // Check if the rejected_issues table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'rejected_issues'"
    );
    
    // If table doesn't exist, create it
    if (tables.length === 0) {
      console.log('Creating rejected_issues table as it does not exist');
      await pool.execute(`
        CREATE TABLE rejected_issues (
          id VARCHAR(100) PRIMARY KEY,
          original_title VARCHAR(255) NOT NULL,
          original_description TEXT,
          category VARCHAR(100),
          rejection_reason TEXT,
          rejected_by VARCHAR(100),
          original_pending_issue_id VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      // Return empty array since table was just created
      return res.json([]);
    }
    
    // Table exists, so fetch the data
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
// ... existing code ... 