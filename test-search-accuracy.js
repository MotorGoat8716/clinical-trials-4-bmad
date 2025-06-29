const axios = require('axios');
require('dotenv').config();

const API_BASE = 'http://localhost:3000';

async function testSearchScenarios() {
  console.log('🔍 Testing Universal Search Accuracy\n');
  
  const testCases = [
    {
      name: 'Obesity + Florida',
      params: { condition: 'obesity', location: 'florida' },
      expectedFeatures: ['Should find obesity trials in Florida', 'Should be precise, not broad']
    },
    {
      name: 'Cancer only',
      params: { condition: 'cancer' },
      expectedFeatures: ['Should find all cancer trials', 'Should search conditions, titles, summaries']
    },
    {
      name: 'California only',
      params: { location: 'california' },
      expectedFeatures: ['Should find all trials in California', 'Should match location field precisely']
    },
    {
      name: 'Diabetes + Texas + Phase 2',
      params: { condition: 'diabetes', location: 'texas', phase: '2' },
      expectedFeatures: ['Should combine all three filters', 'Should be most restrictive']
    },
    {
      name: 'Heart Disease + New York',
      params: { condition: 'heart disease', location: 'new york' },
      expectedFeatures: ['Should handle multi-word conditions', 'Should handle multi-word locations']
    },
    {
      name: 'Empty search',
      params: {},
      expectedFeatures: ['Should return all trials', 'Should not crash']
    },
    {
      name: 'Phase only',
      params: { phase: '3' },
      expectedFeatures: ['Should filter by phase only', 'Should work with just phase parameter']
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.get(`${API_BASE}/api/trials/search`, { params: testCase.params });
      const count = response.data.count;
      const hasTrials = response.data.trials ? 'with summaries' : 'IDs only';
      
      console.log(`✅ ${testCase.name}`);
      console.log(`   Results: ${count} trials (${hasTrials})`);
      console.log(`   Expected: ${testCase.expectedFeatures.join(', ')}`);
      
      // Basic validation
      if (count === 0 && Object.keys(testCase.params).length > 0) {
        console.log(`   ⚠️  Warning: No results found - may indicate issue`);
      }
      if (count > 10000) {
        console.log(`   ⚠️  Warning: Very high result count - may be too broad`);
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('🎯 Search Logic Quality Checks:');
  
  // Quality checks
  try {
    const [allTrials, obesityFlorida, floridaOnly, obesityOnly] = await Promise.all([
      axios.get(`${API_BASE}/api/trials/search`, { params: {} }),
      axios.get(`${API_BASE}/api/trials/search`, { params: { condition: 'obesity', location: 'florida' } }),
      axios.get(`${API_BASE}/api/trials/search`, { params: { location: 'florida' } }),
      axios.get(`${API_BASE}/api/trials/search`, { params: { condition: 'obesity' } })
    ]);
    
    const totalCount = allTrials.data.count;
    const obesityFloridaCount = obesityFlorida.data.count;
    const floridaCount = floridaOnly.data.count;
    const obesityCount = obesityOnly.data.count;
    
    console.log(`\n📊 Logic Validation:`);
    console.log(`   Total trials in DB: ${totalCount}`);
    console.log(`   Obesity trials: ${obesityCount}`);
    console.log(`   Florida trials: ${floridaCount}`);
    console.log(`   Obesity + Florida: ${obesityFloridaCount}`);
    
    // Validation logic
    if (obesityFloridaCount <= Math.min(obesityCount, floridaCount)) {
      console.log(`   ✅ Intersection logic correct: ${obesityFloridaCount} ≤ min(${obesityCount}, ${floridaCount})`);
    } else {
      console.log(`   ❌ Intersection logic error: ${obesityFloridaCount} > min(${obesityCount}, ${floridaCount})`);
    }
    
    if (obesityFloridaCount > 0) {
      console.log(`   ✅ Combined search returns results`);
    } else {
      console.log(`   ⚠️  Combined search returns no results - check data`);
    }
    
  } catch (error) {
    console.log(`   ❌ Quality check failed: ${error.message}`);
  }
}

if (require.main === module) {
  testSearchScenarios();
}

module.exports = { testSearchScenarios };