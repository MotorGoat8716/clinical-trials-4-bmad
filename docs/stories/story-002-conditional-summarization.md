# User Story: Conditionally Summarize Trial Search Results

**ID:** STORY-002
**Epic:** [Trial Search & Discovery MVP](epics/epic-001-trial-search-mvp.md)
**Status:** To Do
**Priority:** High

## 1. Description

As a backend developer, I need to enhance the `/api/trials/search` endpoint to integrate with the AVA AI service. When a search query results in a small number of trials (e.g., 10 or fewer), the API should fetch AI-powered summaries for those trials and include them in the response. This provides immediate, high-value information to the user while strictly controlling costs by avoiding summarization of large result sets.

## 2. Acceptance Criteria

1.  **GIVEN** a search that returns **more than 10 trials**
    **WHEN** the `/api/trials/search` endpoint is called
    **THEN** the API should return the `count` and an array of `trial_ids` only (current behavior).

2.  **GIVEN** a search that returns **10 or fewer trials**
    **WHEN** the `/api/trials/search` endpoint is called
    **THEN** the API should, for each trial, retrieve its full details from the database.
    **AND** it should call the AVA AI service to generate a plain-language summary for each trial.
    **AND** the API response should include the `count` and an array of `trials`, where each object contains the `trial_id` and its `summary`.

3.  **GIVEN** a trial summary has been previously generated and cached
    **WHEN** the API needs a summary for that same trial
    **THEN** it should retrieve the summary from the cache/database to avoid a redundant, costly call to the AVA AI service.

4.  **GIVEN** the AVA AI service is unavailable or returns an error
    **WHEN** the search API attempts to fetch a summary
    **THEN** the API should gracefully handle the error, log it, and return the trial data without a summary, ensuring the user experience is not broken.

## 3. Technical Notes

*   A new column, `summary` (TEXT), should be added to the `ClinicalTrials` table to cache generated summaries.
*   The logic for calling the AVA AI service should be encapsulated in a separate module.
*   The threshold for summarization (10 trials) should be easily configurable.