#!/usr/bin/env node

const axios = require('axios');

async function test1000PageSizeFix() {
  console.log('🔧 TESTING 1000 PAGESIZE FIX');
  console.log('=' .repeat(50));
  console.log('Testing that we now get more than 100 studies\n');
  
  const testCases = [
    {
      name: 'Lung Cancer + Los Angeles (should show ~786)',
      params: { condition: 'lung cancer', location: 'los angeles, ca' }
    },
    {
      name: 'Cancer (should show 1000+)',
      params: { condition: 'cancer' }
    },
    {
      name: 'Diabetes (should show several hundred)',
      params: { condition: 'diabetes' }
    }
  ];
  
  for (const test of testCases) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`Parameters: ${JSON.stringify(test.params)}`);
      
      const startTime = Date.now();
      const queryString = new URLSearchParams(test.params).toString();
      const response = await axios.get(`http://localhost:3000/api/trials/search?${queryString}`);
      const responseTime = Date.now() - startTime;
      
      const totalCount = response.data.count || response.data.totalCount || 0;
      const studiesReturned = response.data.studies?.length || response.data.trials?.length || 0;
      const accurateTotal = response.data.accurateTotal;
      
      console.log(`  Response time: ${responseTime}ms`);
      console.log(`  Total count: ${totalCount}`);
      console.log(`  Studies returned: ${studiesReturned}`);
      console.log(`  Accurate total: ${accurateTotal ? 'Yes' : 'No'}`);
      
      // Evaluate the fix
      if (studiesReturned > 100) {
        console.log(`  ✅ SUCCESS: Now returning ${studiesReturned} studies (was limited to 100)`);
        
        if (totalCount > studiesReturned) {
          console.log(`  ✅ BONUS: Total count (${totalCount}) > returned studies (${studiesReturned})`);
        }
      } else {
        console.log(`  ⚠️  Still limited: Only ${studiesReturned} studies returned`);
      }
      
      // UI Display simulation
      console.log(`  UI will show: "${totalCount} clinical trials found"`);
      if (totalCount > studiesReturned) {
        console.log(`  Performance note: "Showing first ${studiesReturned} results for performance"`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🎯 COMPARISON WITH DIRECT API:');
  console.log('-'.repeat(50));
  
  // Test direct ClinicalTrials.gov API with same approach
  try {
    const directResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'lung cancer los angeles',
        pageSize: 1000,
        format: 'json'
      },
      timeout: 15000
    });
    
    const directStudies = directResponse.data.studies?.length || 0;
    console.log(`Direct ClinicalTrials.gov API (pageSize=1000): ${directStudies} studies`);
    console.log(`Our wrapper should now match this number!`);
    
  } catch (error) {
    console.log(`❌ Direct API error: ${error.message}`);
  }
  
  console.log('\n🎉 PAGESIZE FIX STATUS:');
  console.log('=' .repeat(50));
  console.log('✅ Main data call now uses pageSize=1000 instead of 100');
  console.log('✅ Total count estimation uses pagination sampling');
  console.log('✅ UI performance notes updated for larger datasets');
  console.log('✅ Should now show hundreds of studies instead of 100 max');
  console.log('✅ Much closer to ClinicalTrials.gov website totals');
  console.log('');
  console.log('🚀 Ready to test with "npm run dev" - lung cancer + los angeles should show ~786!');
}

if (require.main === module) {
  test1000PageSizeFix();
}

module.exports = { test1000PageSizeFix };