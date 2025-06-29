# User Story: Build Initial Search User Interface

**ID:** STORY-003
**Epic:** [Trial Search & Discovery MVP](epics/epic-001-trial-search-mvp.md)
**Status:** To Do
**Priority:** High

## 1. Description

As a frontend developer, I need to build the initial user interface for the clinical trials search page. This interface will allow users to enter search criteria, view the results, and interact with the AVA AI assistant. The UI should be clean, intuitive, and empathetic, aligning with the design concepts outlined in the PRD.

## 2. Acceptance Criteria

1.  **GIVEN** a user navigates to the search page
    **WHEN** the page loads
    **THEN** it should display a prominent search bar and filter controls for `condition`, `location`, and `phase`.

2.  **GIVEN** a user enters search criteria and initiates a search
    **WHEN** the search results are returned from the backend API
    **THEN** the UI should correctly handle both possible response types:
    *   If the response contains a `trial_ids` array (large result set), the UI should display a message like, "We found [count] trials. Please add more filters to see summaries."
    *   If the response contains a `trials` array (small result set), the UI should display a "trial card" for each trial, showing its `title` and `summary`.

3.  **GIVEN** the UI is displaying trial cards
    **WHEN** a user clicks on a trial card
    **THEN** it should open the official `ClinicalTrials.gov` page for that trial in a new tab. (The URL can be constructed from the `trial_id`, e.g., `https://clinicaltrials.gov/study/{trial_id}`).

4.  **GIVEN** the user is on the search page
    **THEN** the AVA AI assistant interface should be present, consistent with the design concept in the PRD, ready for user interaction. (Note: The full conversational logic for AVA will be handled in a separate story).

## 3. Technical Notes

*   The UI should be built as a responsive web application using a modern JavaScript framework (e.g., React, Vue.js).
*   All API calls to the backend should be handled gracefully, with clear loading states and error messages.
*   The design should be clean, accessible, and empathetic, with a focus on ease of use for a non-technical audience.
*   The AVA design concept can be found in the [PRD](docs/prd.md).