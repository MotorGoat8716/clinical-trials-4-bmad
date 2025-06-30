const ClinicalTrialsApiWrapper = require('./src/clinicalTrialsApiWrapper');

async function testAllStatuses() {
  const wrapper = new ClinicalTrialsApiWrapper();
  
  console.log('Testing "All Statuses" filter...');
  
  try {
    // Test with specific status
    console.log('\n1. Testing with specific status (RECRUITING):');
    const resultWithStatus = await wrapper.searchTrials({
      condition: 'lung cancer',
      location: 'boston',
      studyStatus: 'RECRUITING'
    });
    console.log(`Found ${resultWithStatus.totalCount} recruiting studies`);
    
    // Test with all statuses (empty string)
    console.log('\n2. Testing with "All Statuses" (empty string):');
    const resultAllStatuses = await wrapper.searchTrials({
      condition: 'lung cancer', 
      location: 'boston',
      studyStatus: ''
    });
    console.log(`Found ${resultAllStatuses.totalCount} studies (all statuses)`);
    
    // Test with no status parameter
    console.log('\n3. Testing with no status parameter:');
    const resultNoStatus = await wrapper.searchTrials({
      condition: 'lung cancer',
      location: 'boston'
    });
    console.log(`Found ${resultNoStatus.totalCount} studies (no status param)`);
    
    // Compare results 2 and 3 - they should be identical
    if (resultAllStatuses.totalCount === resultNoStatus.totalCount) {
      console.log('\n✅ SUCCESS: "All Statuses" and "no status" return the same count');
    } else {
      console.log('\n❌ ISSUE: "All Statuses" and "no status" return different counts');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAllStatuses();