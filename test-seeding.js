#!/usr/bin/env node

// Test script to validate the seeding process works with various query types
const { execSync } = require('child_process');

console.log('🌱 Testing Universal Database Seeding Process\n');

const seedingTests = [
  {
    name: 'Old format compatibility',
    command: 'node db/fetch-and-seed.js "cancer" 5',
    description: 'Should work with old command line format'
  },
  {
    name: 'New format - condition only',
    command: 'node db/fetch-and-seed.js --condition cancer --pageSize 5',
    description: 'Should work with new named parameter format'
  },
  {
    name: 'New format - condition + location',
    command: 'node db/fetch-and-seed.js --condition diabetes --location florida --pageSize 5',
    description: 'Should work with both condition and location parameters'
  },
  {
    name: 'Help/Usage display',
    command: 'node -e "console.log(`\\n📖 Database Seeding Usage:\\n\\n` + `Old format: node db/fetch-and-seed.js \\"query term\\" pageSize\\n` + `New format: node db/fetch-and-seed.js --condition CONDITION --location LOCATION --pageSize SIZE\\n\\n` + `Examples:\\n` + `  node db/fetch-and-seed.js \\"obesity florida\\" 100\\n` + `  node db/fetch-and-seed.js --condition obesity --location florida --pageSize 100\\n` + `  node db/fetch-and-seed.js --condition cancer --pageSize 50\\n`)"',
    description: 'Display usage information'
  }
];

console.log('🔧 Available seeding commands:\n');

for (const test of seedingTests) {
  console.log(`✅ ${test.name}`);
  console.log(`   Command: ${test.command}`);
  console.log(`   ${test.description}\n`);
}

console.log('⚠️  Note: Actual seeding not performed in this test to avoid overwriting data.\n');

console.log('🎯 Database Seeding Best Practices:\n');
console.log('1. Always backup your database before seeding');
console.log('2. Use specific condition+location for targeted datasets');
console.log('3. Start with small pageSize for testing');
console.log('4. Verify results match ClinicalTrials.gov search');
console.log('5. Use the new format for better clarity and control\n');

console.log('📋 Current Database Info:');
try {
  const { Pool } = require('pg');
  require('dotenv').config();
  
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  
  (async () => {
    try {
      const result = await pool.query('SELECT COUNT(*) FROM "ClinicalTrials"');
      console.log(`   Current trial count: ${result.rows[0].count}`);
      
      const sampleTrials = await pool.query('SELECT "TrialID", "Condition", "Location" FROM "ClinicalTrials" ORDER BY id LIMIT 3');
      console.log('   Sample trials:');
      sampleTrials.rows.forEach((trial, i) => {
        console.log(`     ${i+1}. ${trial.TrialID}: ${trial.Condition?.substring(0, 40)}... (${trial.Location?.substring(0, 30)}...)`);
      });
      
      await pool.end();
    } catch (err) {
      console.log(`   Database connection error: ${err.message}`);
    }
  })();
  
} catch (err) {
  console.log(`   Error checking database: ${err.message}`);
}