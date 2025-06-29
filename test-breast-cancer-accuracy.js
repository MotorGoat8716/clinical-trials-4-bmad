#!/usr/bin/env node

const axios = require('axios');

async function testBreastCancerAccuracy() {
  console.log('🔍 Testing Breast Cancer Boston MA Accuracy\n');
  
  try {
    // Test our app
    const ourResponse = await axios.get('http://localhost:3000/api/trials/search', {
      params: { condition: 'breast cancer', location: 'boston ma' }
    });
    
    // Test ClinicalTrials.gov API
    const ctGovResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'breast cancer boston ma',
        pageSize: 50
      }
    });
    
    const ourCount = ourResponse.data.count;
    const ctGovCount = ctGovResponse.data.studies?.length || 0;
    
    console.log('📊 RESULTS COMPARISON:');
    console.log(`   Our App:                ${ourCount} trials`);
    console.log(`   ClinicalTrials.gov API: ${ctGovCount} trials`);
    console.log(`   User Reported Web:      980 trials`);
    console.log('');
    
    // Show our trial IDs
    console.log('🔗 Our Trial IDs:');
    if (ourResponse.data.trials) {
      ourResponse.data.trials.forEach((trial, i) => {
        console.log(`  ${i+1}. ${trial.trial_id}`);
      });
    } else if (ourResponse.data.trial_ids) {
      ourResponse.data.trial_ids.slice(0, 10).forEach((id, i) => {
        console.log(`  ${i+1}. ${id}`);
      });
    }
    console.log('');
    
    // Show ClinicalTrials.gov trial IDs
    console.log('🔗 ClinicalTrials.gov Trial IDs (first 10):');
    if (ctGovResponse.data.studies) {
      ctGovResponse.data.studies.slice(0, 10).forEach((study, i) => {
        const nctId = study.protocolSection?.identificationModule?.nctId;
        console.log(`  ${i+1}. ${nctId}`);
      });
    }
    console.log('');
    
    // Calculate accuracy
    const apiAccuracy = ctGovCount > 0 ? (ourCount / ctGovCount * 100) : 0;
    const webAccuracy = ourCount / 980 * 100;
    
    console.log('🎯 ACCURACY METRICS:');
    console.log(`   vs API:  ${apiAccuracy.toFixed(1)}% (${ourCount}/${ctGovCount})`);
    console.log(`   vs Web:  ${webAccuracy.toFixed(1)}% (${ourCount}/980)`);
    console.log('');
    
    if (apiAccuracy < 10) {
      console.log('❌ SEVERE DATA COVERAGE ISSUE:');
      console.log('   → Major discrepancy suggests search logic or data coverage problems');
      console.log('   → May need to adjust search parameters or improve seeding');
    } else if (apiAccuracy < 50) {
      console.log('⚠️  SIGNIFICANT GAP:');
      console.log('   → Need to improve search logic or data coverage');
    } else if (apiAccuracy >= 80) {
      console.log('✅ GOOD ACCURACY:');
      console.log('   → Search is working well');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (require.main === module) {
  testBreastCancerAccuracy();
}

module.exports = { testBreastCancerAccuracy };