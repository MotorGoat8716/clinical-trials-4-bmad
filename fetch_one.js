const axios = require('axios');
require('dotenv').config();

const API_URL = 'https://clinicaltrials.gov/api/v2/studies';

async function fetchOne(trialId) {
  try {
    const response = await axios.get(API_URL, {
      params: {
        'query.term': trialId,
        pageSize: 1,
      },
    });
    console.log(JSON.stringify(response.data.studies[0], null, 2));
  } catch (err) {
    console.error('Error fetching trial data:', err.response ? err.response.data : err.message);
  }
}

fetchOne('NCT06252220');