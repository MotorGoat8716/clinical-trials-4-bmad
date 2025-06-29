# User Story: Search for Clinical Trials from Internal Database

**ID:** STORY-001
**Epic:** [Trial Search & Discovery MVP](epics/epic-001-trial-search-mvp.md)
**Status:** To Do
**Priority:** High

## 1. Description

As a backend developer, I need to create an API endpoint that can search and filter clinical trials stored in our internal PostgreSQL database. This is the foundational step for the trial search functionality.

## 2. Acceptance Criteria

1.  **GIVEN** a user performs a search
    **WHEN** the API receives a GET request to `/api/trials/search` with query parameters (e.g., `?condition=cancer&location=boston`)
    **THEN** the service should query the `ClinicalTrials` table in the PostgreSQL database using full-text search.
    **AND** the API should return a JSON object containing a `count` of matching trials and an array of `trial_ids`.

2.  **GIVEN** a search query with multiple filters
    **WHEN** the API receives a request with multiple parameters (e.g., `?condition=cancer&phase=2`)
    **THEN** the database query should correctly apply all filters.

3.  **GIVEN** a search query that matches no trials
    **WHEN** the API is queried
    **THEN** it should return a `count` of 0 and an empty array of `trial_ids`.

4.  **GIVEN** the service is under normal load
    **WHEN** the API is queried
    **THEN** the P90 response time should be under 200ms.

## 3. Technical Notes

*   This story **does not** include integration with the AVA AI service for summarization. That will be handled in a subsequent story.
*   The focus is on querying the internal PostgreSQL database, not the live `ClinicalTrials.gov` API.
*   The API endpoint should be stateless and follow RESTful principles.
*   Initial implementation should use the built-in full-text search capabilities of PostgreSQL.