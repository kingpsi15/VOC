const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'feedback_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
