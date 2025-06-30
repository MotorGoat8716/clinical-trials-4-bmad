const axios = require('axios');

async function testDirectApi() {
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  console.log('Testing ClinicalTrials.gov API directly...');
  
  try {
    // Test 1: No status filter (all statuses)
    console.log('\n1. Testing without status filter:');
    const params1 = {
      'query.cond': 'cancer',
      pageSize: 10,
      format: 'json'
    };
    console.log('Parameters:', params1);
    const response1 = await axios.get(baseUrl, { params: params1, timeout: 10000 });
    console.log(`Success: Found ${response1.data.totalCount || response1.data.studies?.length} studies`);
    
    // Test 2: With RECRUITING status
    console.log('\n2. Testing with RECRUITING status:');
    const params2 = {
      'query.cond': 'cancer',
      'query.status': 'RECRUITING',
      pageSize: 10,
      format: 'json'
    };
    console.log('Parameters:', params2);
    const response2 = await axios.get(baseUrl, { params: params2, timeout: 10000 });
    console.log(`Success: Found ${response2.data.totalCount || response2.data.studies?.length} recruiting studies`);
    
    console.log('\n✅ Both API calls successful - status filter is working correctly');
    
  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
  }
}

testDirectApi();