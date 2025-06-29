const fs = require('fs');

const fetched = fs.readFileSync('fetched_trials.txt', 'utf-8').split('\n').filter(Boolean);
const found = fs.readFileSync('found_trials.txt', 'utf-8').split('\n').filter(Boolean);

const missing = fetched.filter(id => !found.includes(id));

if (missing.length > 0) {
  console.log('Missing trial ID(s):', missing.join(', '));
} else {
  console.log('No missing trials found.');
}