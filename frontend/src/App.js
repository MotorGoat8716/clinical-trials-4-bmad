import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [searchParams, setSearchParams] = useState({
    condition: '',
    location: '',
    phase: '',
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
            type="number"
            name="phase"
            placeholder="Phase (e.g., 2)"
            value={searchParams.phase}
            onChange={handleInputChange}
          />
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