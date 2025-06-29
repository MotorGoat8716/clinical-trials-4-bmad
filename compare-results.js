#!/usr/bin/env node

// Tool to compare our results with ClinicalTrials.gov results
const axios = require('axios');
require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function compareResults() {
  console.log('🔍 Comparing Results: Obesity + Orlando + Phase 4\n');
  
  try {
    // Get our results
    console.log('1️⃣ Our App Results:');
    const ourResponse = await axios.get('http://localhost:3000/api/trials/search', {
      params: { condition: 'obesity', location: 'orlando', phase: '4' }
    });
    
    const ourTrials = ourResponse.data.trials || [];
    console.log(`   Count: ${ourResponse.data.count}`);
    ourTrials.forEach((trial, i) => {
      console.log(`   ${i+1}. ${trial.trial_id}`);
    });
    
    // Get ClinicalTrials.gov API results
    console.log('\n2️⃣ ClinicalTrials.gov API Results:');
    const ctGovResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'obesity AND Orlando AND Florida AND phase:4',
        pageSize: 50
      }
    });
    
    const ctGovTrials = ctGovResponse.data.studies || [];
    console.log(`   Count: ${ctGovTrials.length}`);
    ctGovTrials.slice(0, 10).forEach((study, i) => {
      const nctId = study.protocolSection?.identificationModule?.nctId;
      console.log(`   ${i+1}. ${nctId}`);
    });
    if (ctGovTrials.length > 10) {
      console.log(`   ... and ${ctGovTrials.length - 10} more`);
    }
    
    // Compare
    console.log('\n3️⃣ Comparison Analysis:');
    const ourIds = ourTrials.map(t => t.trial_id);
    const ctGovIds = ctGovTrials.map(s => s.protocolSection?.identificationModule?.nctId).filter(Boolean);
    
    const inOurNotInCtGov = ourIds.filter(id => !ctGovIds.includes(id));
    const inCtGovNotInOur = ctGovIds.filter(id => !ourIds.includes(id));
    const inBoth = ourIds.filter(id => ctGovIds.includes(id));
    
    console.log(`   Trials in both: ${inBoth.length}`);
    inBoth.forEach(id => console.log(`     ✅ ${id}`));
    
    console.log(`   In our app only: ${inOurNotInCtGov.length}`);
    inOurNotInCtGov.forEach(id => console.log(`     🟨 ${id}`));
    
    console.log(`   In ClinicalTrials.gov only: ${inCtGovNotInOur.length}`);
    inCtGovNotInOur.forEach(id => console.log(`     🟦 ${id}`));
    
    // Detailed analysis
    if (inOurNotInCtGov.length > 0) {
      console.log('\n4️⃣ Why are these in our app but not ClinicalTrials.gov API?');
      for (const trialId of inOurNotInCtGov) {
        const dbResult = await pool.query('SELECT "TrialID", "Condition", "Location", "Phase" FROM "ClinicalTrials" WHERE "TrialID" = $1', [trialId]);
        if (dbResult.rows.length > 0) {
          const trial = dbResult.rows[0];
          console.log(`   ${trialId}:`);
          console.log(`     Condition: ${trial.Condition}`);
          console.log(`     Location: ${trial.Location?.includes('Orlando') ? 'Contains Orlando ✅' : 'No Orlando ❌'}`);
          console.log(`     Phase: ${trial.Phase}`);
        }
      }
    }
    
    console.log('\n5️⃣ Expected ClinicalTrials.gov Web Results:');
    console.log('   According to user: 4 different trials than what we found');
    console.log('   URL: https://clinicaltrials.gov/search?locStr=Orlando,%20Florida&country=United%20States&state=Florida&cond=Obesity&city=Orlando&aggFilters=phase:4');
    console.log('   Action needed: Manual verification of exact trial IDs from web interface');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  compareResults();
}

module.exports = { compareResults };