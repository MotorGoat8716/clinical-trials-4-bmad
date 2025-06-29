const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'clinical_trials',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

const API_URL = 'https://clinicaltrials.gov/api/v2/studies';

async function validateData() {
  console.log('Starting data validation...');

  // 1. Accuracy Check
  console.log('\n--- Accuracy Check ---');
  // Select a random trial from the DB to validate against the live API
  const { rows } = await pool.query('SELECT * FROM "ClinicalTrials" ORDER BY RANDOM() LIMIT 1');
  const dbTrial = rows[0];

  if (dbTrial) {
    const nctIdToCheck = dbTrial.TrialID;
    console.log(`Checking accuracy for a random trial: ${nctIdToCheck}`);
    const response = await axios.get(`${API_URL}/${nctIdToCheck}`);
    const liveTrial = response.data;
    const liveProtocol = liveTrial.protocolSection;

    console.log(`Comparing data for ${nctIdToCheck}...`);
    console.log(`  DB Title: ${dbTrial.Title}`);
    console.log(`  Live Title: ${liveProtocol.identificationModule.officialTitle}`);
    // Add more comparisons for other fields as needed...
    if (dbTrial.Title === liveProtocol.identificationModule.officialTitle) {
      console.log('  ✅ Title matches.');
    } else {
      console.log('  ❌ Title does NOT match.');
    }
  } else {
    console.log(`  Could not find trial ${nctIdToCheck} in the database.`);
  }

  // 2. Completeness Check
  console.log('\n--- Completeness Check ---');
  const searchTerm = 'cancer';
  const response = await axios.get(API_URL, { params: { 'query.term': searchTerm, 'pageSize': 1000 } });
  const liveCount = response.data.studies.length; // Note: API max pageSize is 1000
  
  const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM "ClinicalTrials"');
  const dbCount = parseInt(countRows[0].count, 10);
  
  console.log(`Comparing total counts for query: "${searchTerm}"`);
  console.log(`  DB Count: ${dbCount}`);
  console.log(`  Live Count (up to 1000): ${liveCount}`);
  if (dbCount >= liveCount) {
      console.log('  ✅ DB count is consistent with live count (or greater).');
  } else {
      console.log('  ❌ DB count is less than live count.');
  }

  // 3. Speed Check (as part of the seed script)
  console.log('\n--- Speed Check ---');
  console.log('To perform a speed check, run the seed script with a large page size, e.g.:');
  console.log('`npm run db:seed:custom -- cancer 1000`');
  console.log('The execution time will be printed by the shell.');

  pool.end();
}

validateData();