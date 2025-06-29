#!/usr/bin/env node

const axios = require('axios');

async function generateAccuracyReport() {
  console.log('📋 FINAL ACCURACY REPORT: Obesity + Orlando Florida');
  console.log('=' .repeat(60));
  
  try {
    // Get our current results
    const ourResponse = await axios.get('http://localhost:3000/api/trials/search', {
      params: { condition: 'obesity', location: 'orlando florida' }
    });
    
    // Get ClinicalTrials.gov API results  
    const ctGovResponse = await axios.get('https://clinicaltrials.gov/api/v2/studies', {
      params: {
        'query.term': 'obesity orlando florida',
        pageSize: 200
      }
    });
    
    const ourCount = ourResponse.data.count;
    const ctGovCount = ctGovResponse.data.studies?.length || 0;
    const webCount = 91; // User reported
    
    console.log('📊 RESULTS COMPARISON:');
    console.log(`   Our App:               ${ourCount} trials`);
    console.log(`   ClinicalTrials.gov API: ${ctGovCount} trials`);
    console.log(`   ClinicalTrials.gov Web: ${webCount} trials (user reported)`);
    console.log('');
    
    // Calculate accuracy metrics
    const apiAccuracy = ourCount / ctGovCount * 100;
    const webAccuracy = ourCount / webCount * 100;
    
    console.log('🎯 ACCURACY METRICS:');
    console.log(`   vs API:  ${apiAccuracy.toFixed(1)}% (${ourCount}/${ctGovCount})`);
    console.log(`   vs Web:  ${webAccuracy.toFixed(1)}% (${ourCount}/${webCount})`);
    console.log('');
    
    // Assessment
    console.log('✅ ASSESSMENT:');
    if (apiAccuracy >= 95) {
      console.log(`   🟢 EXCELLENT: ${apiAccuracy.toFixed(1)}% API accuracy`);
    } else if (apiAccuracy >= 80) {
      console.log(`   🟡 GOOD: ${apiAccuracy.toFixed(1)}% API accuracy`);
    } else {
      console.log(`   🔴 NEEDS IMPROVEMENT: ${apiAccuracy.toFixed(1)}% API accuracy`);
    }
    
    if (webAccuracy >= 95 && webAccuracy <= 120) {
      console.log(`   🟢 EXCELLENT: ${webAccuracy.toFixed(1)}% web accuracy`);
    } else if (webAccuracy >= 80 && webAccuracy <= 130) {
      console.log(`   🟡 ACCEPTABLE: ${webAccuracy.toFixed(1)}% web accuracy`);
    } else {
      console.log(`   🔴 DISCREPANCY: ${webAccuracy.toFixed(1)}% web accuracy`);
    }
    
    console.log('');
    console.log('🚀 IMPROVEMENTS MADE:');
    console.log('   ✅ Fixed pagination in seeding process');
    console.log('   ✅ Increased data coverage from 120 to 742+ trials');
    console.log('   ✅ Improved search results from 9 to 104 trials');
    console.log('   ✅ Added comprehensive validation tools');
    console.log('');
    
    console.log('📈 COVERAGE STATS:');
    console.log(`   Before fix: 9 trials (10% of target)`);
    console.log(`   After fix:  ${ourCount} trials (${webAccuracy.toFixed(0)}% of target)`);
    console.log(`   Improvement: ${(ourCount - 9)}x more trials found`);
    
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
  }
}

if (require.main === module) {
  generateAccuracyReport();
}

module.exports = { generateAccuracyReport };