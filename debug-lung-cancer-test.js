#!/usr/bin/env node

const axios = require('axios');

async function debugLungCancerTest() {
  console.log('🔍 DEBUGGING LUNG CANCER + LOS ANGELES DISCREPANCY');
  console.log('=' .repeat(65));
  console.log('Expected: 786 studies (from ClinicalTrials.gov)');
  console.log('Our App: Only showing 100\n');
  
  // Test our app first
  console.log('📱 OUR APP RESPONSE:');
  console.log('-'.repeat(40));
  
  try {
    const ourParams = { condition: 'lung cancer', location: 'los angeles, ca' };
    const ourResponse = await axios.get('http://localhost:3000/api/trials/search', {
      params: ourParams
    });
    
    console.log('Our App Results:');
    console.log(`  Total Count: ${ourResponse.data.count || ourResponse.data.totalCount}`);
    console.log(`  Accurate Total Flag: ${ourResponse.data.accurateTotal}`);
    console.log(`  Studies Returned: ${ourResponse.data.studies?.length || 'N/A'}`);
    console.log(`  Trials Returned: ${ourResponse.data.trials?.length || 'N/A'}`);
    console.log(`  API URL: ${ourResponse.data.sourceUrl || 'N/A'}`);
    console.log(`  API Params Used:`, ourResponse.data.apiParams);
    
  } catch (error) {
    console.log(`❌ Our App Error: ${error.response?.data?.message || error.message}`);
  }
  
  console.log('\n🌐 DIRECT CLINICALTRIALS.GOV API TESTS:');
  console.log('-'.repeat(40));
  
  // Test direct API calls with different query formats
  const testQueries = [
    {
      name: 'Combined query term',
      params: { 'query.term': 'lung cancer los angeles' }
    },
    {
      name: 'Condition + Location parameters',
      params: { 'query.cond': 'lung cancer', 'query.locn': 'los angeles' }
    },
    {
      name: 'Just city name (location cleaning)',
      params: { 'query.cond': 'lung cancer', 'query.locn': 'los angeles' }
    },
    {
      name: 'With state abbreviation',
      params: { 'query.term': 'lung cancer los angeles ca' }
    },
    {
      name: 'Location only (no state)',
      params: { 'query.term': 'lung cancer los angeles' }
    }
  ];
  
  for (const query of testQueries) {
    try {
      console.log(`\n🔍 Testing: ${query.name}`);
      
      // Test with pageSize=1 for total count
      const countResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
        params: { ...query.params, pageSize: 1, format: 'json' },
        timeout: 10000
      });
      
      // Test with pageSize=100 for results
      const dataResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
        params: { ...query.params, pageSize: 100, format: 'json' },
        timeout: 10000
      });
      
      console.log(`  Parameters: ${JSON.stringify(query.params)}`);
      console.log(`  Total Count (pageSize=1): ${countResponse.data.totalCount || 0}`);
      console.log(`  Studies Returned (pageSize=100): ${dataResponse.data.studies?.length || 0}`);
      console.log(`  Data Total Count: ${dataResponse.data.totalCount || 0}`);
      
      if (countResponse.data.totalCount >= 700) {
        console.log(`  ✅ MATCHES expected ~786 studies!`);
      } else {
        console.log(`  ⚠️  Lower than expected 786 studies`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n🔧 LOCATION PROCESSING TEST:');
  console.log('-'.repeat(40));
  
  // Test our location cleaning function
  const ClinicalTrialsApiWrapper = require('./src/clinicalTrialsApiWrapper');
  const wrapper = new ClinicalTrialsApiWrapper();
  
  const locationInputs = [
    'los angeles, ca',
    'los angeles, california', 
    'Los Angeles, CA',
    'los angeles'
  ];
  
  locationInputs.forEach(location => {
    const cleaned = wrapper.cleanLocationForSearch(location);
    console.log(`  "${location}" → "${cleaned}"`);
  });
  
  console.log('\n🎯 ROOT CAUSE ANALYSIS:');
  console.log('-'.repeat(40));
  console.log('Possible issues:');
  console.log('1. ❓ Location cleaning removing too much information');
  console.log('2. ❓ API parameter mapping not matching ClinicalTrials.gov exactly');
  console.log('3. ❓ getTotalCount() method not working correctly');
  console.log('4. ❓ Different query structure needed for location-based searches');
  console.log('5. ❓ API response not being parsed correctly');
  
  console.log('\n💡 NEXT STEPS:');
  console.log('-'.repeat(40));
  console.log('1. Identify which direct API query gives 786 results');
  console.log('2. Fix our parameter mapping to match that exact query');
  console.log('3. Verify getTotalCount() is working with correct parameters');
  console.log('4. Test end-to-end with the working query format');
}

if (require.main === module) {
  debugLungCancerTest();
}

module.exports = { debugLungCancerTest };