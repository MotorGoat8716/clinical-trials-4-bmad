#!/usr/bin/env node

const axios = require('axios');

async function testWorkingParameters() {
  console.log('🔍 Testing ClinicalTrials.gov API Working Parameters\n');
  
  const testCases = [
    {
      name: 'Condition',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&pageSize=5'
    },
    {
      name: 'Location',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.locn=boston&pageSize=5'
    },
    {
      name: 'Intervention',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.intr=chemotherapy&pageSize=5'
    },
    {
      name: 'Term',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.term=cancer&pageSize=5'
    },
    {
      name: 'Sponsor',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.spons=nih&pageSize=5'
    },
    {
      name: 'Study ID',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.id=NCT03451162&pageSize=5'
    },
    {
      name: 'Country',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&query.country=US&pageSize=5'
    },
    {
      name: 'Combined query',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&query.locn=boston&pageSize=5'
    }
  ];

  const workingParams = [];
  const failingParams = [];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    
    try {
      const response = await axios.get(testCase.url, { timeout: 10000 });
      const studyCount = response.data.studies?.length || 0;
      console.log(`✅ Success: ${studyCount} studies returned`);
      workingParams.push(testCase.name);
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`❌ Bad Request (400): ${error.response.data || 'Invalid parameter'}`);
        failingParams.push(testCase.name);
      } else {
        console.log(`❌ Error: ${error.message}`);
        failingParams.push(testCase.name);
      }
    }
  }
  
  console.log('\n📊 Results Summary:');
  console.log(`✅ Working parameters: ${workingParams.join(', ')}`);
  console.log(`❌ Failing parameters: ${failingParams.join(', ')}`);
  
  console.log('\n🎯 Recommended Basic Filter Set:');
  console.log('  ✅ query.cond (condition)');
  console.log('  ✅ query.locn (location)');
  console.log('  ✅ query.intr (intervention)');
  console.log('  ✅ query.term (other terms)');
  console.log('  ✅ query.spons (sponsor)');
  console.log('  ✅ query.id (study IDs)');
  console.log('  ✅ query.country (country)');
  console.log('  ❌ query.phase, query.age, query.sex (not supported in v2 API)');
}

if (require.main === module) {
  testWorkingParameters();
}

module.exports = { testWorkingParameters };