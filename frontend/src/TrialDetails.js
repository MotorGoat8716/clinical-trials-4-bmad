import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './TrialDetails.css';

function TrialDetails() {
  const { trial_id } = useParams();
  const [trial, setTrial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [plainLanguageSummary, setPlainLanguageSummary] = useState('');
  const [plainLanguageDescription, setPlainLanguageDescription] = useState('');
  const [plainLanguageEligibility, setPlainLanguageEligibility] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const [loadingEligibility, setLoadingEligibility] = useState(false);

  // Fetch trial details
  useEffect(() => {
    const fetchTrialDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching trial details for: ${trial_id}`);
        
        // Use fetch instead of axios to avoid module issues
        const response = await fetch(`/api/trials/details/${trial_id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Trial data received:', data);
        setTrial(data);
        
        // Generate plain language content after getting trial data
        if (data) {
          generatePlainLanguageContent(data);
        }
      } catch (err) {
        console.error('Error fetching trial details:', err);
        setError(`An error occurred while fetching the trial details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (trial_id) {
      fetchTrialDetails();
    }
  }, [trial_id]);

  // Generate plain language content using AI
  const generatePlainLanguageContent = async (trialData) => {
    console.log('Starting plain language content generation for:', trialData.nctId);
    
    // Generate summary
    setLoadingSummary(true);
    try {
      console.log('Generating AI summary...');
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trial: trialData,
          type: 'summary'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.summary) {
          setPlainLanguageSummary(data.summary);
          console.log('AI summary generated successfully');
        } else {
          console.warn('No summary in response:', data);
          setPlainLanguageSummary('Unable to generate plain language summary at this time.');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setPlainLanguageSummary(`Unable to generate plain language summary: ${error.message}`);
    } finally {
      setLoadingSummary(false);
    }

    // Generate detailed description
    setLoadingDescription(true);
    try {
      console.log('Generating AI detailed description...');
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trial: trialData,
          type: 'detailed_description'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.summary) {
          setPlainLanguageDescription(data.summary);
          console.log('AI detailed description generated successfully');
        } else {
          console.warn('No detailed description in response:', data);
          setPlainLanguageDescription('Unable to generate plain language description at this time.');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating description:', error);
      setPlainLanguageDescription(`Unable to generate plain language description: ${error.message}`);
    } finally {
      setLoadingDescription(false);
    }

    // Generate eligibility explanation
    setLoadingEligibility(true);
    try {
      console.log('Generating AI eligibility explanation...');
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trial: trialData,
          type: 'eligibility'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.summary) {
          setPlainLanguageEligibility(data.summary);
          console.log('AI eligibility explanation generated successfully');
        } else {
          console.warn('No eligibility explanation in response:', data);
          setPlainLanguageEligibility('Unable to generate plain language eligibility explanation at this time.');
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error generating eligibility explanation:', error);
      setPlainLanguageEligibility(`Unable to generate plain language eligibility explanation: ${error.message}`);
    } finally {
      setLoadingEligibility(false);
    }
  };

  // Generate field explanations
  const getFieldExplanation = (fieldName, fieldValue) => {
    if (!fieldValue) return '';
    
    const explanations = {
      phase: {
        'EARLY_PHASE1': 'This is a very early study testing a new treatment for the first time in humans.',
        'PHASE1': 'This is an early study testing the safety and best dose of a new treatment.',
        'PHASE1_PHASE2': 'This study tests both safety and effectiveness of a treatment.',
        'PHASE2': 'This study tests whether a treatment works and continues to monitor safety.',
        'PHASE2_PHASE3': 'This study tests effectiveness in a larger group while comparing to standard treatment.',
        'PHASE3': 'This large study compares the new treatment to the current standard treatment.',
        'PHASE4': 'This study monitors long-term effects after a treatment has been approved.',
        'NA': 'This study does not test a new treatment or drug.'
      },
      
      status: {
        'RECRUITING': 'This study is currently accepting new participants.',
        'NOT_YET_RECRUITING': 'This study has not started recruiting participants yet.',
        'ACTIVE_NOT_RECRUITING': 'This study is ongoing but not accepting new participants.',
        'COMPLETED': 'This study has finished and is no longer recruiting participants.',
        'SUSPENDED': 'This study has been temporarily stopped.',
        'TERMINATED': 'This study has been stopped early and will not continue.',
        'WITHDRAWN': 'This study was stopped before it started recruiting participants.'
      },
      
      studyType: {
        'INTERVENTIONAL': 'This study tests a specific treatment or intervention.',
        'OBSERVATIONAL': 'This study observes participants without giving them a specific treatment.',
        'EXPANDED_ACCESS': 'This study provides access to experimental treatments outside of regular clinical trials.'
      }
    };
    
    const fieldExplanations = explanations[fieldName.toLowerCase()];
    if (fieldExplanations) {
      return fieldExplanations[fieldValue.toUpperCase()] || fieldValue;
    }
    
    return fieldValue;
  };

  if (loading) {
    return (
      <div className="trial-details">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading trial details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trial-details">
        <div className="error">
          <h2>Error Loading Trial Details</h2>
          <p className="error">{error}</p>
          <button onClick={() => window.location.reload()}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="trial-details">
        <div className="error">
          <h2>Trial Not Found</h2>
          <p>No trial details found for ID: {trial_id}</p>
          <Link to="/">Back to Search</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="trial-details">
      {/* Header Section */}
      <header className="trial-header">
        <h2>{trial.title || trial.officialTitle}</h2>
        <p>
          <strong>NCT ID:</strong> {trial.nctId || trial_id}
        </p>
        {trial.officialTitle && trial.title !== trial.officialTitle && (
          <p>
            <strong>Official Title:</strong> {trial.officialTitle}
          </p>
        )}
      </header>

      {/* Study Information */}
      {(trial.phase || trial.status || trial.studyType) && (
        <div className="study-info">
          <h3>Study Information</h3>
          <div className="info-grid">
            {trial.phase && (
              <div className="info-item">
                <label>Phase:</label>
                <span>{trial.phase}</span>
                <div className="explanation">{getFieldExplanation('phase', trial.phase)}</div>
              </div>
            )}
            
            {trial.status && (
              <div className="info-item">
                <label>Status:</label>
                <span>{trial.status}</span>
                <div className="explanation">{getFieldExplanation('status', trial.status)}</div>
              </div>
            )}
            
            {trial.studyType && (
              <div className="info-item">
                <label>Study Type:</label>
                <span>{trial.studyType}</span>
                <div className="explanation">{getFieldExplanation('studyType', trial.studyType)}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="side-by-side">
        <div className="original">
          <h3>Summary (ClinicalTrials.gov)</h3>
          <div className="content">
            {trial.summary || 'No summary available.'}
          </div>
        </div>
        <div className="plain-language">
          <h3>Summary (Plain Language)</h3>
          <div className="content">
            {loadingSummary ? (
              <div className="loading-content">
                <div className="small-spinner"></div>
                <span>Generating plain language summary...</span>
              </div>
            ) : (
              plainLanguageSummary || 'Plain language summary not available.'
            )}
          </div>
        </div>
      </div>

      {/* Detailed Description Section */}
      {trial.detailedDescription && (
        <div className="side-by-side">
          <div className="original">
            <h3>Detailed Description (ClinicalTrials.gov)</h3>
            <div className="content">
              {trial.detailedDescription}
            </div>
          </div>
          <div className="plain-language">
            <h3>Detailed Description (Plain Language)</h3>
            <div className="content">
              {loadingDescription ? (
                <div className="loading-content">
                  <div className="small-spinner"></div>
                  <span>Generating plain language description...</span>
                </div>
              ) : (
                plainLanguageDescription || 'Plain language description not available.'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Criteria Section */}
      {trial.eligibilityCriteria && (
        <div className="side-by-side">
          <div className="original">
            <h3>Eligibility Criteria (ClinicalTrials.gov)</h3>
            <div className="content">
              {trial.eligibilityCriteria}
            </div>
          </div>
          <div className="plain-language">
            <h3>Eligibility Criteria (Plain Language)</h3>
            <div className="content">
              {loadingEligibility ? (
                <div className="loading-content">
                  <div className="small-spinner"></div>
                  <span>Generating plain language eligibility explanation...</span>
                </div>
              ) : (
                plainLanguageEligibility || 'Plain language eligibility criteria not available.'
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="trial-footer">
        {trial.official_url && (
          <a 
            href={trial.official_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="official-link"
          >
            View on ClinicalTrials.gov
          </a>
        )}
        <Link to="/" className="back-link">Back to Search</Link>
      </div>
    </div>
  );
}

export default TrialDetails;