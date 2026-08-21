require('dotenv').config();
const pool = require('./src/db');

async function alterTable() {
  try {
    const query = `
      ALTER TABLE Person 
      ADD COLUMN district VARCHAR(191) DEFAULT NULL,
      ADD COLUMN state VARCHAR(191) DEFAULT NULL,
      ADD COLUMN pincode VARCHAR(191) DEFAULT NULL;
    `;
    await pool.query(query);
    console.log('Columns added successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Error altering table:', err);
    }
  } finally {
    pool.end();
  }
}
alterTable();
