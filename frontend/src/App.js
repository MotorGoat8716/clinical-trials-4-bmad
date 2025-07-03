import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [searchParams, setSearchParams] = useState({
    condition: '',
    location: '',
    expr: '',
    studyStatus: '',
    ageGroup: '',
    sex: '',
    studyType: '',
    funderType: '',
    otherTerms: '',
  });
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearchResults(null); // Clear previous results before new search
    try {
      const response = await axios.get('/api/trials/search', { params: searchParams });
      setSearchResults(response.data);
    } catch (err) {
      setError('An error occurred while fetching the search results.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="App">
      <header className="App-header">
        <h1>Clinical Trials Search</h1>
      </header>
      <main>
        <div className="search-controls">
          <input
            type="text"
            name="condition"
            placeholder="Condition (e.g., cancer)"
            value={searchParams.condition}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="location"
            placeholder="Location (e.g., boston)"
            value={searchParams.location}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="expr"
            placeholder="Universal Search..."
            value={searchParams.expr}
            onChange={handleInputChange}
            className="universal-search"
          />
          <select name="studyStatus" value={searchParams.studyStatus} onChange={handleInputChange}>
            <option value="">All Statuses</option>
            <option value="RECRUITING">Recruiting</option>
            <option value="NOT_YET_RECRUITING">Not Yet Recruiting</option>
            <option value="ACTIVE_NOT_RECRUITING">Active, Not Recruiting</option>
            <option value="COMPLETED">Completed</option>
            <option value="ENROLLING_BY_INVITATION">Enrolling by Invitation</option>
            <option value="TERMINATED">Terminated</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
          <select name="ageGroup" value={searchParams.ageGroup} onChange={handleInputChange}>
            <option value="">All Age Groups</option>
            <option value="CHILD">Child (birth-17)</option>
            <option value="ADULT">Adult (18-64)</option>
            <option value="OLDER_ADULT">Older Adult (65+)</option>
          </select>
          <select name="sex" value={searchParams.sex} onChange={handleInputChange}>
            <option value="">All Sexes</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <select name="studyType" value={searchParams.studyType} onChange={handleInputChange}>
            <option value="">All Study Types</option>
            <option value="INTERVENTIONAL">Interventional</option>
            <option value="OBSERVATIONAL">Observational</option>
            <option value="EXPANDED_ACCESS">Expanded Access</option>
          </select>
          <select name="funderType" value={searchParams.funderType} onChange={handleInputChange}>
            <option value="">All Funder Types</option>
            <option value="NIH">NIH</option>
            <option value="FED">Other U.S. Federal Agency</option>
            <option value="INDIV">Individual</option>
            <option value="INDUSTRY">Industry</option>
            <option value="NETWORK">Network</option>
            <option value="OTHER">Other</option>
          </select>
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && <p className="error">{error}</p>}

        {/* Total Count Display - Right below filter boxes */}
        {searchResults && (
          <div className="total-count-display">
            <div className="count-summary">
              <span className="total-number">{searchResults.count || searchResults.totalCount || 0}</span>
              <span className="count-label">clinical trials found</span>
              {searchResults.accurateTotal && (
                <span className="accuracy-badge">✓ Live from ClinicalTrials.gov</span>
              )}
            </div>
            {searchResults.count > (searchResults.trials?.length || 0) && (
              <div className="display-note">
                Showing first {searchResults.trials?.length || 0} results for performance
              </div>
            )}
          </div>
        )}

        {searchResults && (
          <div className="search-results">
            {searchResults.resultType === 'count-only' ? (
              <p>
                We found {searchResults.totalCount} trials. Please add more filters to see summaries.
              </p>
            ) : searchResults.trials && searchResults.trials.length > 0 ? (
              <div>
                <h2>Found {searchResults.totalCount} trials:</h2>
                <div className="trial-cards">
                  {searchResults.trials.map((trial) => (
                    <div key={trial.trial_id} className="trial-card">
                      <h3>{trial.title}</h3>
                      <p>
                        <strong>NCT ID:</strong> {trial.trial_id}
                      </p>
                      <p>
                        <strong>Condition:</strong> {trial.condition}
                      </p>
                      <p>
                        <strong>Recruitment Status:</strong> {trial.status}
                      </p>
                      <p>{trial.summary}</p>
                      <a
                        href={`https://clinicaltrials.gov/study/${trial.trial_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on ClinicalTrials.gov
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No trials found for your search criteria.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;