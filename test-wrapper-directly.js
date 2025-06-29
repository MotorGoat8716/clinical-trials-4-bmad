#!/usr/bin/env node

const ClinicalTrialsApiWrapper = require('./src/clinicalTrialsApiWrapper');

async function testWrapperDirectly() {
  console.log('🧪 TESTING WRAPPER DIRECTLY (BYPASS SERVER)');
  console.log('=' .repeat(55));
  console.log('Testing our wrapper class directly to see what it returns\n');
  
  const wrapper = new ClinicalTrialsApiWrapper();
  
  // Clear any cache
  wrapper.clearCache();
  console.log('✅ Cache cleared\n');
  
  try {
    console.log('🔍 Testing: condition="lung cancer", location="los angeles, ca"');
    
    const startTime = Date.now();
    const result = await wrapper.searchTrials({
      condition: 'lung cancer',
      location: 'los angeles, ca'
    });
    const responseTime = Date.now() - startTime;
    
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📊 Total count: ${result.totalCount}`);
    console.log(`📋 Studies returned: ${result.studies?.length || 0}`);
    console.log(`🎯 Is small result set: ${result.isSmallResultSet}`);
    console.log(`🎯 Is large result set: ${result.isLargeResultSet}`);
    console.log(`✅ Accurate total: ${result.accurateTotal}`);
    console.log(`🔗 Source URL: ${result.sourceUrl}`);
    
    if (result.apiParams) {
      console.log(`📝 API Parameters used:`);
      Object.entries(result.apiParams).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    // Analyze the result
    if (result.isLargeResultSet && result.studies.length === 0) {
      console.log(`\n✅ CORRECT: Large result set with count-only approach`);
      if (result.totalCount >= 700) {
        console.log(`✅ PERFECT: Total count ${result.totalCount} matches expected ~806`);
      } else {
        console.log(`🟡 PARTIAL: Total count ${result.totalCount} improved but not optimal`);
      }
    } else if (result.isSmallResultSet && result.studies.length > 0) {
      console.log(`\n✅ CORRECT: Small result set with detailed studies`);
    } else {
      console.log(`\n❌ WRONG: Unexpected result structure`);
      console.log(`   Expected: Large result set (>10) should return count-only`);
      console.log(`   Got: ${result.studies.length} studies returned`);
    }
    
    // Check parameter format
    if (result.sourceUrl) {
      if (result.sourceUrl.includes('query.cond=lung') && result.sourceUrl.includes('query.locn=los')) {
        console.log(`✅ CORRECT: Using separate query.cond and query.locn parameters`);
      } else if (result.sourceUrl.includes('query.term=lung%20cancer%20los')) {
        console.log(`❌ WRONG: Still using combined query.term parameter`);
      } else {
        console.log(`❓ UNCLEAR: Parameter format unknown`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Wrapper test failed: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
  }
  
  console.log('\n🎯 WRAPPER VERIFICATION:');
  console.log('-'.repeat(55));
  console.log('This test bypasses the Express server and tests the wrapper directly.');
  console.log('If this shows the correct results (800+ count), then the issue is');
  console.log('with server caching or the server needs to be restarted.');
  console.log('');
  console.log('If this still shows 100, then there\'s an issue with the wrapper logic.');
}

if (require.main === module) {
  testWrapperDirectly();
}

module.exports = { testWrapperDirectly };