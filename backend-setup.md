
# MySQL Backend Setup Instructions

## Prerequisites
- Node.js installed (v16 or higher)
- MySQL server running locally
- Your MySQL database with feedback data

## Step 1: Create Backend API Server

Create a new directory for your backend:
```bash
mkdir feedback-backend
cd feedback-backend
npm init -y
```

## Step 2: Install Dependencies
```bash
npm install express mysql2 cors dotenv
npm install -D nodemon @types/node typescript
```

## Step 3: Create server.js
```javascript
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Vardaa@123',
  database: process.env.DB_NAME || 'feedback_db'
};

// Test connection endpoint
app.get('/api/test-connection', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    await connection.end();
    res.json({ status: 'Connected to MySQL successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('MySQL connection error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to MySQL', 
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
    const connection = await mysql.createConnection(dbConfig);
    
    let query = 'SELECT * FROM feedback WHERE 1=1';
    const params = [];
    
    // Apply filters
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
        case 'last_week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'last_month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'last_quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'last_year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
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
    
    console.log('Executing query:', query);
    console.log('With parameters:', params);
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    
    console.log(`Returned ${rows.length} records`);
    res.json(rows);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch feedback data', 
      details: error.message,
      query: req.query
    });
  }
});

// Get metrics summary
app.get('/api/metrics', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    let query = 'SELECT COUNT(*) as total, SUM(positive_flag) as positive, SUM(negative_flag) as negative, AVG(review_rating) as avg_rating FROM feedback WHERE 1=1';
    const params = [];
    
    // Apply same filters as feedback endpoint
    if (req.query.service && req.query.service !== 'all') {
      query += ' AND service_type = ?';
      params.push(req.query.service);
    }
    
    if (req.query.location && req.query.location !== 'all') {
      query += ' AND issue_location = ?';
      params.push(req.query.location);
    }
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    
    const metrics = rows[0];
    res.json({
      total: parseInt(metrics.total),
      positive: parseInt(metrics.positive) || 0,
      negative: parseInt(metrics.negative) || 0,
      avgRating: parseFloat(metrics.avg_rating) || 0
    });
  } catch (error) {
    console.error('Metrics query error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Test connection at: http://localhost:${PORT}/api/test-connection`);
});
```

## Step 4: Create .env file
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
PORT=3001
```

## Step 5: Update package.json
Add these scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Step 6: Expected MySQL Table Structure
Your feedback table should have these columns:
- id (varchar/int) - Primary key
- customer_name (varchar) - Customer name
- service_type (enum: 'ATM', 'OnlineBanking', 'CoreBanking') - Service type
- review_text (text) - Review content
- review_rating (int 1-5) - Rating score
- sentiment (enum: 'positive', 'negative', 'neutral') - Sentiment
- status (enum: 'new', 'in_progress', 'resolved', 'escalated') - Status
- created_at (datetime) - Creation timestamp
- issue_location (varchar) - Location (optional)
- positive_flag (boolean) - Positive sentiment flag
- negative_flag (boolean) - Negative sentiment flag

## Step 7: Test Your Setup

1. Start the backend server:
```bash
npm run dev
```

2. Test the connection:
```bash
curl http://localhost:3001/api/test-connection
```

3. Test data fetching:
```bash
curl http://localhost:3001/api/feedback
```

## Step 8: Configure Frontend
The frontend is already configured to connect to `http://localhost:3001/api`. Just make sure your backend server is running!

## Troubleshooting
- Make sure MySQL server is running
- Check database credentials in .env file
- Verify table structure matches expected format
- Check console logs for detailed error messages
- Ensure CORS is properly configured for your frontend URL
