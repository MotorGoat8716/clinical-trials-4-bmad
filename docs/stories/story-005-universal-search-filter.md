# User Story: Implement Universal Search Filter

**ID:** STORY-005
**Epic:** [Trial Search & Discovery MVP](epics/epic-001-trial-search-mvp.md)
**Status:** To Do
**Priority:** High

## 1. Description

As a patient or caregiver, I want to be able to search for clinical trials using a single, flexible input field that accepts a wide range of criteria beyond just condition and location. This will allow me to find relevant trials even if I'm looking for specific interventions, drugs, study statuses, or other details, mirroring the comprehensive search capabilities of ClinicalTrials.gov.

## 2. Acceptance Criteria

1.  **GIVEN** a user navigates to the search page
    **WHEN** the page loads
    **THEN** the existing "Phase" text input field should be replaced with a new "Universal Search" text input field.

2.  **GIVEN** a user enters a search term into the "Universal Search" field (e.g., "Olaparib", "Recruiting", "Phase 3", "Heart Attack")
    **WHEN** they initiate a search
    **THEN** the backend API should be called with a new `expr` parameter containing the user's search term.

3.  **GIVEN** the backend processes the search
    **WHEN** it constructs the query to ClinicalTrials.gov
    **THEN** the `expr` parameter from our app should be correctly mapped to the `expr` query parameter in the ClinicalTrials.gov API.

4.  **GIVEN** the search results are returned
    **WHEN** the UI displays the results
    **THEN** the results should be filtered according to the criteria entered in the "Universal Search" field, in addition to any other active filters (like condition or location).

## 3. Technical Notes

*   This change impacts both the frontend and the backend.
*   **Frontend:** The "Phase" input in the main search form needs to be updated to a "Universal Search" input. The `name` of the input should be changed from `phase` to `expr`.
*   **Backend:** The API endpoint that handles trial searches must be updated to accept the new `expr` parameter and pass it through to the `clinicalTrialsApiWrapper`.
*   **API Wrapper:** The `clinicalTrialsApiWrapper` must be updated to include the `expr` parameter in its call to the ClinicalTrials.gov API.
*   This new field should be treated as an optional filter; if left blank, it should not affect the search results.