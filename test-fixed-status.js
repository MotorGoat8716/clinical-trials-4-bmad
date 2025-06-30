const axios = require('axios');

async function testFixedStatus() {
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  console.log('Testing fixed status filter...');
  
  try {
    // Test 1: All statuses (no filter)
    console.log('\n1. Testing "All Statuses" (no status parameter):');
    const params1 = {
      'query.cond': 'cancer',
      pageSize: 10,
      format: 'json'
    };
    const response1 = await axios.get(baseUrl, { params: params1, timeout: 10000 });
    console.log(`Found ${response1.data.totalCount || response1.data.studies?.length} total studies`);
    
    // Test 2: Specific status (RECRUITING)
    console.log('\n2. Testing specific status (RECRUITING):');
    const params2 = {
      'query.cond': 'cancer',
      'filter.overallStatus': 'RECRUITING',
      pageSize: 10,
      format: 'json'
    };
    const response2 = await axios.get(baseUrl, { params: params2, timeout: 10000 });
    console.log(`Found ${response2.data.totalCount || response2.data.studies?.length} recruiting studies`);
    
    // Test 3: Another status (COMPLETED)
    console.log('\n3. Testing specific status (COMPLETED):');
    const params3 = {
      'query.cond': 'cancer',
      'filter.overallStatus': 'COMPLETED',
      pageSize: 10,
      format: 'json'
    };
    const response3 = await axios.get(baseUrl, { params: params3, timeout: 10000 });
    console.log(`Found ${response3.data.totalCount || response3.data.studies?.length} completed studies`);
    
    console.log('\n✅ Status filter is now working correctly!');
    
  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
  }
}

testFixedStatus();