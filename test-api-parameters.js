#!/usr/bin/env node

const axios = require('axios');

async function testApiParameters() {
  console.log('🔍 Testing ClinicalTrials.gov API Parameters\n');
  
  const testCases = [
    {
      name: 'Basic condition',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&pageSize=5'
    },
    {
      name: 'Overall status',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&query.overallStatus=recruiting&pageSize=5'
    },
    {
      name: 'Phase filter',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&query.phase=2&pageSize=5'
    },
    {
      name: 'Age filter',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&query.age=adult&pageSize=5'
    },
    {
      name: 'Sex filter',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&query.sex=female&pageSize=5'
    },
    {
      name: 'Study type',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=cancer&query.studyType=interventional&pageSize=5'
    },
    {
      name: 'Wrong parameter (should fail)',
      url: 'https://clinicaltrials.gov/api/v2/studies?query.cond=diabetes&query.wrongParam=test&pageSize=5'
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`URL: ${testCase.url}`);
    
    try {
      const response = await axios.get(testCase.url, { timeout: 10000 });
      const studyCount = response.data.studies?.length || 0;
      console.log(`✅ Success: ${studyCount} studies returned`);
      
      if (studyCount > 0) {
        const firstStudy = response.data.studies[0];
        const nctId = firstStudy.protocolSection?.identificationModule?.nctId;
        console.log(`   First study: ${nctId}`);
      }
      
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(`❌ Bad Request (400): ${error.response.data || 'Invalid parameter'}`);
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log('');
  }
}

if (require.main === module) {
  testApiParameters();
}

module.exports = { testApiParameters };