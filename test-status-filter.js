const ClinicalTrialsFiltersV2 = require('./src/clinicalTrialsFiltersV2');

console.log('Testing status filter behavior:');

// Test 1: Specific status selected
const paramsWithStatus = ClinicalTrialsFiltersV2.buildApiParams({
  condition: 'cancer',
  studyStatus: 'RECRUITING'
});
console.log('\n1. With specific status (RECRUITING):');
console.log(paramsWithStatus);

// Test 2: All statuses selected (empty string)
const paramsAllStatuses = ClinicalTrialsFiltersV2.buildApiParams({
  condition: 'cancer',
  studyStatus: ''
});
console.log('\n2. With "All Statuses" (empty string):');
console.log(paramsAllStatuses);

// Test 3: No status parameter at all
const paramsNoStatus = ClinicalTrialsFiltersV2.buildApiParams({
  condition: 'cancer'
});
console.log('\n3. With no status parameter:');
console.log(paramsNoStatus);