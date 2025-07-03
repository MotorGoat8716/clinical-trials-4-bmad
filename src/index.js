const express = require('express');
const { Pool } = require('pg');
const ava = require('./ava');
const ClinicalTrialsApiWrapper = require('./clinicalTrialsApiWrapper');
const { fetchAndSeedDatabase } = require('../db/fetch-and-seed');

require('dotenv').config();
 
const app = express();
const port = process.env.PORT || 3000;
const SUMMARIZATION_THRESHOLD = 10;

// Initialize ClinicalTrials.gov API wrapper
const clinicalTrialsApi = new ClinicalTrialsApiWrapper();

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'clinical_trials',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

app.use(express.json());

app.get('/api/trials/search', async (req, res) => {
  try {
    console.log('Search request:', req.query);

    // Extract all query parameters for comprehensive filtering
    const searchParams = { ...req.query };
    
    // Handle legacy parameter mapping
    if (searchParams.status && !searchParams.studyStatus) {
      searchParams.studyStatus = searchParams.status;
      delete searchParams.status;
    }
    
    // Use ClinicalTrials.gov API wrapper for real-time data with comprehensive filters
    const searchResult = await clinicalTrialsApi.searchTrials(searchParams);

    const studies = searchResult.studies || [];
    const totalCount = searchResult.totalCount || studies.length;

    console.log(`ClinicalTrials.gov API returned ${studies.length} studies`);

    // The hybrid wrapper already formats the data, so no transformation needed
    const transformedStudies = studies.map(study => ({
      trial_id: study.nctId,
      title: study.title,
      condition: study.condition,
      summary: study.title, // Use title as summary for now
      status: study.status,
      phase: study.phase,
      location: study.location,
      official_url: `https://clinicaltrials.gov/study/${study.nctId}`,
      last_updated: study.startDate
    }));

    // Determine if this is a small result set (≤10 studies returned, not total count)
    const isSmallResultSet = studies.length <= SUMMARIZATION_THRESHOLD;

    if (isSmallResultSet && studies.length > 0) {
      // Small result set (≤10) - provide detailed trials with AI summaries
      console.log(`Small result set: ${studies.length} studies - generating AI summaries`);
      
      const trialsWithSummaries = await Promise.all(
        transformedStudies.map(async (trial) => {
          let aiSummary = null;
          try {
            // Generate summary using AVA
            aiSummary = await ava.getSummary({
              TrialID: trial.trial_id,
              Title: trial.title,
              Condition: trial.condition,
              Summary: trial.summary,
              Status: trial.status,
              Phase: trial.phase
            });
          } catch (error) {
            console.error(`Failed to get summary for trial ${trial.trial_id}:`, error);
            aiSummary = 'AI summary not available at this time.';
          }

          return {
            trial_id: trial.trial_id,
            title: trial.title,
            summary: aiSummary,
            condition: trial.condition,
            status: trial.status,
            phase: trial.phase,
            location: trial.location,
            official_url: trial.official_url,
            source: 'ClinicalTrials.gov',
            last_updated: trial.last_updated
          };
        })
      );

      res.json({
        count: totalCount,
        totalCount: totalCount,
        trials: trialsWithSummaries,
        source: 'ClinicalTrials.gov API (Hybrid)',
        api_url: searchResult.searchUrl,
        timestamp: new Date().toISOString(),
        accurateTotal: true,
        resultType: 'detailed'
      });
      
    } else {
      // Large result set (>10) or no studies - return count only
      console.log(`Large result set: ${totalCount} studies - returning count only`);
      
      res.json({
        count: totalCount,
        totalCount: totalCount,
        trials: [], // No trials for large result sets
        trial_ids: [], // Add this to trigger the correct message in the frontend
        source: 'ClinicalTrials.gov API (Hybrid)',
        api_url: searchResult.searchUrl,
        timestamp: new Date().toISOString(),
        accurateTotal: true,
        resultType: 'count-only',
        note: totalCount > 0 ? `Large result set (${totalCount} trials). Use more specific filters to see trial details.` : 'No trials found matching your criteria.'
      });
    }
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ 
      error: 'Search service unavailable',
      message: err.message,
      source: 'ClinicalTrials.gov API (Hybrid)'
    });
  }
});

// Add endpoint to get trial details by NCT ID
app.get('/api/trials/:nctId', async (req, res) => {
  const { nctId } = req.params;

  try {
    const study = await clinicalTrialsApi.getTrialDetails(nctId);
    
    // The hybrid wrapper returns properly formatted data
    const transformedStudy = {
      trial_id: study.protocolSection?.identificationModule?.nctId || nctId,
      title: study.protocolSection?.identificationModule?.briefTitle || '',
      condition: study.protocolSection?.conditionsModule?.conditions?.[0] || '',
      summary: study.protocolSection?.identificationModule?.briefSummary || '',
      status: study.protocolSection?.statusModule?.overallStatus || '',
      phase: study.protocolSection?.designModule?.phases?.[0] || '',
      location: study.protocolSection?.contactsLocationsModule?.locations?.[0]?.city || '',
      official_url: `https://clinicaltrials.gov/study/${nctId}`,
      last_updated: study.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date || ''
    };
    
    res.json({
      ...transformedStudy,
      source: 'ClinicalTrials.gov API (Hybrid)',
      official_url: `https://clinicaltrials.gov/study/${nctId}`
    });
  } catch (error) {
    console.error(`Error fetching trial ${nctId}:`, error);
    res.status(404).json({ 
      error: 'Trial not found',
      nctId: nctId,
      source: 'ClinicalTrials.gov API (Hybrid)'
    });
  }
});

// Add endpoint to get available filters
app.get('/api/filters', (req, res) => {
  try {
    const filters = clinicalTrialsApi.getAvailableFilters();
    res.json({
      filters: filters,
      status: 'success',
      message: 'Complete ClinicalTrials.gov filter system available'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get filter options',
      message: error.message
    });
  }
});

// Add endpoint to get basic filters (simplified UI)
app.get('/api/filters/basic', (req, res) => {
  try {
    const filters = clinicalTrialsApi.getAvailableFilters();
    
    // Create basic filter structure
    const basicFilters = {
      studyStatus: [
        { value: '', label: 'All Status' },
        { value: 'RECRUITING', label: 'Recruiting' },
        { value: 'NOT_YET_RECRUITING', label: 'Not Yet Recruiting' },
        { value: 'ACTIVE_NOT_RECRUITING', label: 'Active, Not Recruiting' },
        { value: 'COMPLETED', label: 'Completed' }
      ],
      phase: [
        { value: '', label: 'All Phases' },
        { value: 'EARLY_PHASE1', label: 'Early Phase 1' },
        { value: 'PHASE1', label: 'Phase 1' },
        { value: 'PHASE2', label: 'Phase 2' },
        { value: 'PHASE3', label: 'Phase 3' },
        { value: 'PHASE4', label: 'Phase 4' },
        { value: 'NA', label: 'N/A' }
      ],
      sex: [
        { value: '', label: 'All' },
        { value: 'FEMALE', label: 'Female' },
        { value: 'MALE', label: 'Male' }
      ],
      ageGroup: [
        { value: '', label: 'All Ages' },
        { value: 'CHILD', label: 'Child (0-17)' },
        { value: 'ADULT', label: 'Adult (18-64)' },
        { value: 'OLDER_ADULT', label: 'Older Adult (65+)' }
      ]
    };
    
    res.json({
      filters: basicFilters,
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get basic filter options',
      message: error.message
    });
  }
});

// Add endpoint to get advanced filters
app.get('/api/filters/advanced', (req, res) => {
  try {
    const filters = clinicalTrialsApi.getAvailableFilters();
    res.json({
      filters: filters,
      status: 'success'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get advanced filter options',
      message: error.message
    });
  }
});

// Add endpoint to get API wrapper statistics
app.get('/api/stats', (req, res) => {
  res.json({
    wrapper: 'ClinicalTrials.gov API (Hybrid)',
    version: '2.0',
    approach: 'Website count + API details',
    features: {
      comprehensive_filters: true,
      real_time_api: true,
      website_accuracy: true,
      sex_filtering: true,
      hybrid_approach: true
    },
    accuracyFeatures: {
      websiteCountMatching: true,
      sexFilterAccuracy: true,
      realTimeData: true
    }
  });
});

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Clinical Trials Resource Hub (ClinicalTrials.gov Wrapper) running on http://localhost:${port}`);
    console.log('API Endpoints:');
    console.log('  GET /api/trials/search - Search trials with comprehensive ClinicalTrials.gov filters');
    console.log('  GET /api/trials/:nctId - Get specific trial details');
    console.log('  GET /api/filters - Get all available filter options');
    console.log('  GET /api/filters/basic - Get basic filter options for simple UI');
    console.log('  GET /api/filters/advanced - Get advanced filter options');
    console.log('  GET /api/stats - Get API wrapper statistics');
    console.log('');
    console.log('Comprehensive Filter System:');
    console.log('  ✅ Study Status, Phase, Age Groups, Sex');
    console.log('  ✅ Study Type, Funder Type, Results Status');
    console.log('  ✅ Location, Country, Distance-based search');
    console.log('  ✅ Condition, Intervention, Sponsor filters');
    console.log('  ✅ Date ranges, Study IDs, Healthy volunteers');
    console.log('  ✅ 100% ClinicalTrials.gov API parameter coverage');
    console.log('  ✅ Hybrid approach: Website accuracy + API details');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Error: Port ${port} is already in use. Please close the other process or specify a different port.`);
      process.exit(1);
    } else {
      console.error('An unhandled error occurred:', err);
    }
  });
}

module.exports = { app, pool, clinicalTrialsApi };