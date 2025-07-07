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

// CORS middleware (if needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

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

// Fixed endpoint to get trial details by NCT ID - matches both old and new frontend patterns
app.get('/api/trials/details/:trial_id', async (req, res) => {
  const { trial_id } = req.params;
  console.log(`Fetching trial details for: ${trial_id}`);

  try {
    // Search for the specific trial using the wrapper
    const searchResult = await clinicalTrialsApi.searchTrials({
      otherTerms: trial_id,
      pageSize: 1
    });
    
    if (searchResult.studies && searchResult.studies.length > 0) {
      const study = searchResult.studies[0];
      
      // Extract and normalize the trial data
      const trial = {
        nctId: study.protocolSection?.identificationModule?.nctId || trial_id,
        title: study.protocolSection?.identificationModule?.briefTitle,
        officialTitle: study.protocolSection?.identificationModule?.officialTitle,
        summary: study.protocolSection?.descriptionModule?.briefSummary,
        detailedDescription: study.protocolSection?.descriptionModule?.detailedDescription,
        eligibilityCriteria: study.protocolSection?.eligibilityModule?.eligibilityCriteria,
        phase: study.protocolSection?.designModule?.phases?.[0],
        status: study.protocolSection?.statusModule?.overallStatus,
        studyType: study.protocolSection?.designModule?.studyType,
        conditions: study.protocolSection?.conditionsModule?.conditions || [],
        interventions: study.protocolSection?.armsInterventionsModule?.interventions || [],
        primaryOutcomes: study.protocolSection?.outcomesModule?.primaryOutcomes || [],
        secondaryOutcomes: study.protocolSection?.outcomesModule?.secondaryOutcomes || [],
        minimumAge: study.protocolSection?.eligibilityModule?.minimumAge,
        maximumAge: study.protocolSection?.eligibilityModule?.maximumAge,
        sex: study.protocolSection?.eligibilityModule?.sex,
        contacts: study.protocolSection?.contactsLocationsModule?.centralContacts || [],
        locations: study.protocolSection?.contactsLocationsModule?.locations || [],
        official_url: `https://clinicaltrials.gov/study/${trial_id}`
      };
      
      res.json(trial);
    } else {
      res.status(404).json({ 
        error: 'Trial not found',
        trial_id: trial_id,
        message: `Clinical trial with ID ${trial_id} was not found.`
      });
    }
    
  } catch (error) {
    console.error(`Error fetching trial ${trial_id}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch trial details',
      trial_id: trial_id,
      details: error.message
    });
  }
});

// Also keep the alternative endpoint for compatibility
app.get('/api/trials/:nctId', async (req, res) => {
  const { nctId } = req.params;
  
  // Redirect to the details endpoint
  req.params.trial_id = nctId;
  return app._router.handle(Object.assign(req, { url: `/api/trials/details/${nctId}`, path: `/api/trials/details/${nctId}` }), res);
});

// AI Summary Generation Endpoint
app.post('/api/generate-summary', async (req, res) => {
  try {
    console.log('Generate summary request received:', req.body);
    const { trial, type } = req.body;
    
    if (!trial) {
      return res.status(400).json({ 
        error: 'Trial data is required',
        summary: 'No trial data provided for summary generation.'
      });
    }

    let summary = '';
    
    if (type === 'summary') {
      // Generate AI summary using the ava module
      try {
        console.log('Generating AI summary for trial:', trial.nctId);
        summary = await ava.getSummary({
          TrialID: trial.nctId,
          Title: trial.title || trial.officialTitle,
          Condition: trial.conditions ? trial.conditions.join(', ') : '',
          Summary: trial.summary || trial.detailedDescription || '',
          Status: trial.status || '',
          Phase: trial.phase || ''
        }, 'summary');
      } catch (aiError) {
        console.warn('AI summary failed, falling back to wrapper method:', aiError.message);
        // Fallback to the wrapper's plain language method
        summary = clinicalTrialsApi.generatePlainLanguageSummary(trial);
      }
    } else if (type === 'detailed_description') {
      // Generate detailed plain language description
      try {
        console.log('Generating detailed AI description for trial:', trial.nctId);
        summary = await ava.getSummary({
          TrialID: trial.nctId,
          Title: trial.title || trial.officialTitle,
          Condition: trial.conditions ? trial.conditions.join(', ') : '',
          Summary: trial.detailedDescription || trial.summary || '',
          Status: trial.status || '',
          Phase: trial.phase || ''
        }, 'detailed_description');
        
        // If AI returns a short response, enhance it with wrapper method
        if (summary.length < 200) {
          const wrapperSummary = clinicalTrialsApi.generatePlainLanguageSummary(trial);
          summary = summary + '\n\n' + wrapperSummary;
        }
      } catch (aiError) {
        console.warn('AI detailed description failed, falling back to wrapper method:', aiError.message);
        summary = clinicalTrialsApi.generatePlainLanguageSummary(trial);
      }
    } else if (type === 'eligibility') {
      // Generate plain language eligibility explanation
      try {
        console.log('Generating eligibility explanation for trial:', trial.nctId);
        summary = await ava.getSummary({
          TrialID: trial.nctId,
          Title: trial.title || trial.officialTitle,
          Condition: trial.conditions ? trial.conditions.join(', ') : '',
          Summary: trial.eligibilityCriteria || '',
          Status: trial.status || '',
          Phase: trial.phase || ''
        }, 'eligibility');
      } catch (aiError) {
        console.warn('AI eligibility explanation failed:', aiError.message);
        summary = 'Plain language eligibility explanation not available at this time.';
      }
    } else {
      // Default to basic summary
      summary = clinicalTrialsApi.generatePlainLanguageSummary(trial);
    }

    // Ensure we always return something meaningful
    if (!summary || summary.trim() === '') {
      summary = 'Unable to generate plain language summary for this clinical trial at this time.';
    }

    console.log(`Summary generated for ${trial.nctId}: ${summary.substring(0, 100)}...`);

    res.json({ 
      success: true, 
      summary: summary,
      trialId: trial.nctId,
      type: type
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      summary: 'Unable to generate plain language summary due to a technical error.',
      details: error.message
    });
  }
});

// Test endpoints for debugging
app.get('/api/test-env', (req, res) => {
  res.json({
    PROJECT_ID: process.env.PROJECT_ID ? 'Set' : 'Not set',
    LOCATION: process.env.LOCATION || 'Not set',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV || 'Not set'
  });
});

app.get('/api/test-ai', async (req, res) => {
  try {
    console.log('Testing AI functionality...');
    
    const testTrial = {
      TrialID: 'TEST123',
      Title: 'Test Clinical Trial for Cancer Treatment',
      Condition: 'Cancer',
      Summary: 'This is a test study to evaluate a new cancer treatment.',
      Status: 'RECRUITING',
      Phase: 'PHASE2'
    };
    
    const summary = await ava.getSummary(testTrial, 'summary');
    
    res.json({
      success: true,
      message: 'AI test completed',
      testTrial: testTrial,
      generatedSummary: summary,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI test failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'AI test failed'
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
      hybrid_approach: true,
      ai_summaries: true
    },
    accuracyFeatures: {
      websiteCountMatching: true,
      sexFilterAccuracy: true,
      realTimeData: true,
      plainLanguageGeneration: true
    }
  });
});

if (require.main === module) {
  const server = app.listen(port, () => {
    console.log(`Clinical Trials Resource Hub (ClinicalTrials.gov Wrapper) running on http://localhost:${port}`);
    console.log('API Endpoints:');
    console.log('  GET /api/trials/search - Search trials with comprehensive ClinicalTrials.gov filters');
    console.log('  GET /api/trials/details/:trial_id - Get specific trial details (legacy)');
    console.log('  GET /api/trials/:nctId - Get specific trial details');
    console.log('  POST /api/generate-summary - Generate AI plain language summaries');
    console.log('  GET /api/test-env - Test environment variables');
    console.log('  GET /api/test-ai - Test AI functionality');
    console.log('  GET /api/filters - Get all available filter options');
    console.log('  GET /api/filters/basic - Get basic filter options for simple UI');
    console.log('  GET /api/filters/advanced - Get advanced filter options');
    console.log('  GET /api/stats - Get API wrapper statistics');
    console.log('');
    console.log('New Features:');
    console.log('  ✅ AI-powered plain language summaries');
    console.log('  ✅ Detailed description generation');
    console.log('  ✅ Eligibility criteria explanations');
    console.log('  ✅ Fallback to rule-based explanations');
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

if (clinicalTrialsApi.getTrialDetailsRoute) {
  clinicalTrialsApi.getTrialDetailsRoute(app);
}

module.exports = { app, pool, clinicalTrialsApi };