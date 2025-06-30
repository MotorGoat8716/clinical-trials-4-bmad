const axios = require('axios');

async function testStatusParameters() {
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  console.log('Testing different status parameter names...');
  
  const statusParams = [
    'query.status',
    'query.overall_status', 
    'query.overallStatus',
    'aggFilters',
    'filter.overallStatus',
    'filter.status'
  ];
  
  for (const param of statusParams) {
    try {
      console.log(`\nTesting parameter: ${param}`);
      const params = {
        'query.cond': 'cancer',
        pageSize: 5,
        format: 'json'
      };
      
      if (param === 'aggFilters') {
        params[param] = 'overallStatus:RECRUITING';
      } else {
        params[param] = 'RECRUITING';
      }
      
      console.log('Parameters:', params);
      const response = await axios.get(baseUrl, { params, timeout: 10000 });
      console.log(`✅ SUCCESS with ${param}: Found ${response.data.totalCount || response.data.studies?.length} studies`);
      
    } catch (error) {
      console.log(`❌ FAILED with ${param}: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }
}

testStatusParameters();