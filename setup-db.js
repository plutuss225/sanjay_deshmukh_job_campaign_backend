require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');

async function setup() {
  try {
    const pool = mysql.createPool(process.env.DATABASE_URL);
    const sql = fs.readFileSync('./database_schema_blogs.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim().length > 0);
    
    for (let stmt of statements) {
      await pool.query(stmt);
      console.log('Executed statement successfully.');
    }
    
    console.log('Database setup complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error setting up database:', err);
    process.exit(1);
  }
}

setup();
