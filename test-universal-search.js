const ava = require('ava');
const ClinicalTrialsApiWrapper = require('./src/clinicalTrialsApiWrapper');

ava('Universal search filter should pass the expr parameter to the API', async t => {
  const api = new ClinicalTrialsApiWrapper();
  const searchParams = { expr: 'Olaparib' };
  const apiUrl = api.buildApiUrl(searchParams, 100);
  t.true(apiUrl.includes('query.term=Olaparib'));
});

ava('Universal search and other filters should work together', async t => {
    const api = new ClinicalTrialsApiWrapper();
    const searchParams = { expr: 'Olaparib', condition: 'Cancer' };
    const apiUrl = api.buildApiUrl(searchParams, 100);
    t.true(apiUrl.includes('query.term=Olaparib'));
    t.true(apiUrl.includes('query.cond=Cancer'));
  });