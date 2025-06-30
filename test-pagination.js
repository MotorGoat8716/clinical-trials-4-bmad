const assert = require('assert');
const ClinicalTrialsApiWrapper = require('./src/clinicalTrialsApiWrapper.js');

async function testPagination() {
  console.log('--- Running Pagination Test ---');
  const wrapper = new ClinicalTrialsApiWrapper();

  // A broad query known to return > 1000 results
  const searchParams = {
    condition: 'cancer'
  };

  try {
    console.log(`Performing search for: "${searchParams.condition}"`);
    const results = await wrapper.searchTrials(searchParams);

    const totalStudies = results.studies.length;
    const totalCount = results.totalCount;

    console.log(`Total studies returned by wrapper: ${totalStudies}`);
    console.log(`Total count reported by API: ${totalCount}`);

    assert(totalStudies > 1000, `Test Failed: Expected more than 1000 studies, but got ${totalStudies}`);
    console.log('✅ Test Passed: Successfully fetched more than 1000 studies.');

    assert(totalStudies <= totalCount, `Test Failed: Number of studies fetched (${totalStudies}) is greater than the reported total count (${totalCount}).`);
    console.log('✅ Test Passed: Fetched studies count is consistent with total count.');

    if (results.note) {
      console.log(`Note from wrapper: ${results.note}`);
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
  }
}

testPagination();