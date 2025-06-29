const axios = require('axios');
const { Pool } = require('pg');

const API_URL = 'https://clinicaltrials.gov/api/v2/studies';

async function fetchAndSeedDatabase(pool, options = {}) {
  const {
    condition = 'cancer',
    location = null,
    pageSize = 100,
    queryTerm = null, // For backward compatibility
  } = options;
  
  // Build search term - prefer individual parameters over queryTerm
  let searchTerm;
  if (queryTerm) {
    searchTerm = queryTerm;
  } else if (condition && location) {
    searchTerm = `${condition} ${location}`;
  } else if (condition) {
    searchTerm = condition;
  } else {
    searchTerm = 'cancer'; // fallback
  }
  const client = await pool.connect();
  try {
    let allTrials = [];
    let nextPageToken = null;

    console.log(`Fetching data from ClinicalTrials.gov API for query: "${searchTerm}"...`);

    // Fetch all pages to get comprehensive data
    do {
      const response = await axios.get(API_URL, {
        params: {
          'query.term': searchTerm,
          pageSize: pageSize,
          pageToken: nextPageToken,
        },
      });

      const { studies, nextPageToken: newNextPageToken } = response.data;
      if (studies) {
        allTrials = allTrials.concat(studies);
        console.log(`Fetched ${studies.length} trials, total so far: ${allTrials.length}`);
      }
      nextPageToken = newNextPageToken;
    } while (nextPageToken);

    console.log(`Total trials fetched: ${allTrials.length}`);

    await client.query('BEGIN');

    for (const trial of allTrials) {
      const protocol = trial.protocolSection;
      const idModule = protocol.identificationModule;
      const conditionsModule = protocol.conditionsModule;
      const statusModule = protocol.statusModule;
      const designModule = protocol.designModule;
      const contactsLocationsModule = protocol.contactsLocationsModule;
      const armsInterventionsModule = protocol.armsInterventionsModule;
      const outcomesModule = protocol.outcomesModule;
      const eligibilityModule = protocol.eligibilityModule;

      const locations = contactsLocationsModule?.locations;
      let locationString = null;
      if (locations && locations.length > 0) {
        locationString = locations
          .map(loc => [loc.city, loc.state, loc.country].filter(Boolean).join(', '))
          .join('; ');
      }

      const armGroupsString = armsInterventionsModule?.armGroups
        ?.map(ag => `${ag.label}: ${ag.description} (${(ag.interventionNames || []).join(', ')})`)
        .join('; ');

      const interventionsString = armsInterventionsModule?.interventions
        ?.map(i => `${i.name}: ${i.description}`)
        .join('; ');

      const primaryOutcomesString = outcomesModule?.primaryOutcomes
        ?.map(o => `${o.measure}: ${o.description}`)
        .join('; ');

      const secondaryOutcomesString = outcomesModule?.secondaryOutcomes
        ?.map(o => `${o.measure}: ${o.description}`)
        .join('; ');

      const query = {
        text: `
          INSERT INTO "ClinicalTrials" (
            "TrialID", "OfficialTitle", "Condition", "Location", "Status", "Phase", "Title",
            "Summary", "DetailedDescription", "EligibilityCriteria", "ArmGroups",
            "Interventions", "PrimaryOutcomes", "SecondaryOutcomes"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT ("TrialID") DO UPDATE SET
            "OfficialTitle" = EXCLUDED."OfficialTitle",
            "Condition" = EXCLUDED."Condition",
            "Location" = EXCLUDED."Location",
            "Status" = EXCLUDED."Status",
            "Phase" = EXCLUDED."Phase",
            "Title" = EXCLUDED."Title",
            "Summary" = EXCLUDED."Summary",
            "DetailedDescription" = EXCLUDED."DetailedDescription",
            "EligibilityCriteria" = EXCLUDED."EligibilityCriteria",
            "ArmGroups" = EXCLUDED."ArmGroups",
            "Interventions" = EXCLUDED."Interventions",
            "PrimaryOutcomes" = EXCLUDED."PrimaryOutcomes",
            "SecondaryOutcomes" = EXCLUDED."SecondaryOutcomes"
        `,
        values: [
          idModule.nctId,
          idModule.officialTitle,
          conditionsModule.conditions?.join(', ') || null,
          locationString,
          statusModule.overallStatus || null,
          parseInt((designModule.phases?.[0] || '0').replace(/[^0-9]/g, ''), 10) || null,
          idModule.officialTitle,
          protocol.descriptionModule?.briefSummary || null,
          protocol.descriptionModule?.detailedDescription || null,
          eligibilityModule?.eligibilityCriteria || null,
          armGroupsString || null,
          interventionsString || null,
          primaryOutcomesString || null,
          secondaryOutcomesString || null,
        ],
      };
      try {
        const res = await client.query(query);
      } catch (e) {
        console.error(`Failed to insert trial ${idModule.nctId}:`, e.stack);
        console.error('Query:', query.text);
        console.error('Values:', query.values);
        throw e; // Re-throw to trigger the rollback
      }
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully with all available data!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error fetching or seeding database:', err.stack);
    process.exit(1);
  } finally {
    client.release();
  }
}

module.exports = { fetchAndSeedDatabase };