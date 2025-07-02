const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  // host: process.env.DB_HOST || '192.168.10.1',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Vardaa@123',
};

const DATABASE_NAME = process.env.DB_NAME || 'feedback_db';

async function tableExists(connection, tableName) {
  const [rows] = await connection.execute(
    `SELECT COUNT(*) as count 
     FROM information_schema.tables 
     WHERE table_schema = ? AND table_name = ?`,
    [DATABASE_NAME, tableName]
  );
  return rows[0].count > 0;
}

async function initializeDatabase() {
  let connection;

  try {
    console.log('Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);

    // Check if the database exists
    const [dbRows] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM information_schema.schemata 
       WHERE schema_name = ?`,
      [DATABASE_NAME]
    );

    if (dbRows[0].count > 0) {
      console.log(`Database '${DATABASE_NAME}' already exists.`);
    } else {
      console.log(`Database '${DATABASE_NAME}' does not exist. Creating it now...`);
      await connection.query(`CREATE DATABASE ${DATABASE_NAME}`);
    }

    // Close the initial connection and reconnect to the database
    await connection.end();
    connection = await mysql.createConnection({ ...dbConfig, database: DATABASE_NAME });

    // Define tables and their creation logic
    const tables = {
      feedback: `
        CREATE TABLE IF NOT EXISTS feedback (
          id VARCHAR(255) PRIMARY KEY,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(50),
          customer_email VARCHAR(255),
          customer_id VARCHAR(100),
          service_type ENUM('ATM', 'OnlineBanking', 'CoreBanking') NOT NULL,
          review_text TEXT NOT NULL,
          review_rating INT CHECK (review_rating >= 1 AND review_rating <= 5),
          sentiment ENUM('positive', 'negative', 'neutral') DEFAULT 'neutral',
          status ENUM('new', 'in_progress', 'resolved', 'escalated') DEFAULT 'new',
          issue_location VARCHAR(255),
          contacted_bank_person VARCHAR(255),
          positive_flag BOOLEAN DEFAULT FALSE,
          negative_flag BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `,
      bank_employees: `
        CREATE TABLE IF NOT EXISTS bank_employees (
          id VARCHAR(255) PRIMARY KEY,
          employee_id VARCHAR(100) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          department VARCHAR(100),
          branch_location VARCHAR(255),
          role VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
      issues: `
        CREATE TABLE IF NOT EXISTS issues (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          resolution TEXT NOT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          confidence_score DECIMAL(3,2),
          feedback_count INT DEFAULT 0,
          approved_by VARCHAR(255),
          approved_date TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `,
      pending_issues: `
        CREATE TABLE IF NOT EXISTS pending_issues (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(500) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          confidence_score DECIMAL(3,2),
          feedback_count INT DEFAULT 1,
          detected_from_feedback_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (detected_from_feedback_id) REFERENCES feedback(id) ON DELETE SET NULL
        )
      `,
      pending_resolutions: `
        CREATE TABLE IF NOT EXISTS pending_resolutions (
          id VARCHAR(255) PRIMARY KEY,
          pending_issue_id VARCHAR(255) NOT NULL,
          resolution_text TEXT NOT NULL,
          confidence_score DECIMAL(3,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (pending_issue_id) REFERENCES pending_issues(id) ON DELETE CASCADE
        )
      `,
      rejected_issues: `
        CREATE TABLE IF NOT EXISTS rejected_issues (
          id VARCHAR(255) PRIMARY KEY,
          original_title VARCHAR(500) NOT NULL,
          original_description TEXT NOT NULL,
          category VARCHAR(100) NOT NULL,
          rejection_reason TEXT,
          rejected_by VARCHAR(255),
          rejected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          original_pending_issue_id VARCHAR(255)
        )
      `,
      feedback_resolutions: `
        CREATE TABLE IF NOT EXISTS feedback_resolutions (
          id VARCHAR(255) PRIMARY KEY,
          feedback_id VARCHAR(255) NOT NULL,
          resolution_text TEXT NOT NULL,
          assigned_to VARCHAR(255),
          resolution_status ENUM('pending', 'in_progress', 'completed', 'escalated') DEFAULT 'pending',
          implementation_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          completed_at TIMESTAMP NULL,
          FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
          FOREIGN KEY (assigned_to) REFERENCES bank_employees(id) ON DELETE SET NULL
        )
      `,
      employee_feedback_interactions: `
        CREATE TABLE IF NOT EXISTS employee_feedback_interactions (
          id VARCHAR(255) PRIMARY KEY,
          employee_id VARCHAR(255) NOT NULL,
          feedback_id VARCHAR(255) NOT NULL,
          interaction_type ENUM('contacted', 'resolved', 'escalated') NOT NULL,
          interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (employee_id) REFERENCES bank_employees(id) ON DELETE CASCADE,
          FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
        )
      `,
      feedback_issues: `
        CREATE TABLE IF NOT EXISTS feedback_issues (
          id VARCHAR(255) PRIMARY KEY,
          feedback_id VARCHAR(255) NOT NULL,
          issue_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE,
          FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
        )
      `,
    };

    // Check and create tables
    for (const [tableName, createQuery] of Object.entries(tables)) {
      const exists = await tableExists(connection, tableName);
      if (exists) {
        console.log(`Table '${tableName}' already exists.`);
      } else {
        console.log(`Table '${tableName}' does not exist. Creating it now...`);
        await connection.execute(createQuery);
      }
    }

    console.log('Database initialization completed successfully!');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeDatabase();
