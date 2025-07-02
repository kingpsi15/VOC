const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Hariom13##',
  database: 'feedback_db',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool;
