const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    console.log('Initializing database schema from init.sql...');
    const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await client.query(initSql);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

initializeDatabase();