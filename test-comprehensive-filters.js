#!/usr/bin/env node

const axios = require('axios');

async function testComprehensiveFilters() {
  console.log('🔍 Testing Comprehensive Filter System\n');
  
  const testCases = [
    {
      name: 'Basic condition + location',
      params: { condition: 'cancer', location: 'boston' }
    },
    {
      name: 'Study status filter',
      params: { condition: 'diabetes', studyStatus: 'RECRUITING' }
    },
    {
      name: 'Phase filter',
      params: { condition: 'heart disease', phase: 'PHASE3' }
    },
    {
      name: 'Age and sex filters',
      params: { condition: 'cancer', age: 'ADULT', sex: 'FEMALE' }
    },
    {
      name: 'Multiple status values',
      params: { condition: 'cancer', studyStatus: 'RECRUITING,NOT_YET_RECRUITING' }
    },
    {
      name: 'Study type filter',
      params: { condition: 'cancer', studyType: 'Intr' }
    }
  ];

  for (const testCase of testCases) {
    console.log(`📋 Test: ${testCase.name}`);
    console.log(`Parameters:`, testCase.params);
    
    try {
      const queryString = new URLSearchParams(testCase.params).toString();
      const response = await axios.get(`http://localhost:3000/api/trials/search?${queryString}`);
      
      console.log(`✅ Success: ${response.data.count} trials found`);
      if (response.data.api_url) {
        console.log(`🔗 API URL: ${response.data.api_url}`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      if (error.response?.data?.error) {
        console.log(`   Details: ${error.response.data.error}`);
      }
    }
    
    console.log('');
  }
  
  // Test filter endpoints
  console.log('🔧 Testing Filter Endpoints:');
  try {
    const basicResponse = await axios.get('http://localhost:3000/api/filters/basic');
    console.log(`✅ Basic filters: ${Object.keys(basicResponse.data.filters).length} categories`);
    
    const advancedResponse = await axios.get('http://localhost:3000/api/filters/advanced');
    console.log(`✅ Advanced filters: ${Object.keys(advancedResponse.data.filters).length} categories`);
    
    const allResponse = await axios.get('http://localhost:3000/api/filters');
    console.log(`✅ All filters: ${Object.keys(allResponse.data.filters.all).length} total categories`);
    
  } catch (error) {
    console.log(`❌ Filter endpoint error: ${error.message}`);
  }
}

if (require.main === module) {
  testComprehensiveFilters();
}

module.exports = { testComprehensiveFilters };