#!/usr/bin/env node

const axios = require('axios');

async function testCTGovAPI() {
  try {
    console.log('🔍 Testing ClinicalTrials.gov API for: obesity orlando florida\n');
    
    const response = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'obesity orlando florida',
        pageSize: 100
      }
    });
    
    const studies = response.data.studies || [];
    console.log(`📊 ClinicalTrials.gov API returned: ${studies.length} studies`);
    console.log(`📊 User reported web interface shows: 91 studies`);
    console.log(`📊 Our database currently has: 9 studies\n`);
    
    if (studies.length > 0) {
      console.log('🔗 First 10 trial IDs from API:');
      studies.slice(0, 10).forEach((study, i) => {
        const nctId = study.protocolSection?.identificationModule?.nctId;
        console.log(`  ${i+1}. ${nctId}`);
      });
      
      console.log('\n📈 Coverage Analysis:');
      if (studies.length < 91) {
        console.log(`⚠️  API returned ${studies.length} but web shows 91`);
        console.log('   → Web interface likely uses more sophisticated filtering');
        console.log('   → May need to use different API parameters');
      }
      
      if (studies.length > 9) {
        console.log(`❌ Our database is missing ${studies.length - 9} trials`);
        console.log('   → Need to improve seeding process');
        console.log('   → Current seeding is too restrictive');
      }
    }
    
    // Test with broader query
    console.log('\n🔍 Testing broader query: obesity florida');
    const broaderResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'obesity florida',
        pageSize: 100
      }
    });
    
    const broaderStudies = broaderResponse.data.studies || [];
    console.log(`📊 Broader query returned: ${broaderStudies.length} studies`);
    
  } catch (err) {
    console.error('❌ Error:', err.response?.status, err.response?.statusText);
    console.error('Details:', err.message);
  }
}

if (require.main === module) {
  testCTGovAPI();
}

module.exports = { testCTGovAPI };