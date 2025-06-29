#!/usr/bin/env node

const axios = require('axios');

async function testWorkingFilters() {
  console.log('🔍 Testing Working Filter System\n');
  
  const testCases = [
    {
      name: 'Basic condition + location (working)',
      params: { condition: 'cancer', location: 'boston' }
    },
    {
      name: 'Intervention search (working)',
      params: { intervention: 'chemotherapy' }
    },
    {
      name: 'Sponsor search (working)',
      params: { sponsor: 'nih' }
    },
    {
      name: 'Other terms search (working)',
      params: { otherTerms: 'diabetes' }
    },
    {
      name: 'Study ID search (working)',
      params: { studyIds: 'NCT03451162' }
    },
    {
      name: 'Combined working filters',
      params: { condition: 'cancer', location: 'boston', sponsor: 'nih' }
    },
    {
      name: 'Legacy parameters (should work with warnings)',
      params: { condition: 'diabetes', phase: '3', age: 'adult' }
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
  console.log('🔧 Testing Working Filter Endpoints:');
  try {
    const workingResponse = await axios.get('http://localhost:3000/api/filters/basic');
    console.log(`✅ Basic (working) filters: ${Object.keys(workingResponse.data.filters).length} categories`);
    
    const advancedResponse = await axios.get('http://localhost:3000/api/filters/advanced');
    console.log(`✅ Advanced filters: ${Object.keys(advancedResponse.data.filters).length} categories`);
    
    console.log('\\n📋 Available Working Filters:');
    Object.keys(workingResponse.data.filters).forEach(filterKey => {
      const filter = workingResponse.data.filters[filterKey];
      console.log(`   ${filter.label} (${filter.apiParam})`);
    });
    
  } catch (error) {
    console.log(`❌ Filter endpoint error: ${error.message}`);
  }
}

if (require.main === module) {
  testWorkingFilters();
}

module.exports = { testWorkingFilters };