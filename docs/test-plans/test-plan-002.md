# Test Plan: STORY-002 - Conditionally Summarize Trial Search Results

**Objective:** To verify that the `/api/trials/search` endpoint correctly implements conditional AI summarization as per the acceptance criteria in [STORY-002](docs/stories/story-002-conditional-summarization.md).

## 1. Test Environment

-   **Application:** Clinical Trials API
-   **Database:** PostgreSQL
-   **Data:** Real data fetched from `ClinicalTrials.gov`
-   **AI Service:** Mocked AVA AI Service (`src/ava.js`)

## 2. Test Cases

| Test Case ID | Description                                                                 | Steps                                                                                                                                                           | Expected Result                                                                                                                                                           |
| :----------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-007       | **Summarization on Small Result Set:** Verify that summaries are returned for a small number of results. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request with a query guaranteed to return <= 10 results. | The API should return a JSON object with a `count` (<=10) and a `trials` array. Each object in the `trials` array should contain a `trial_id` and a `summary`. |
| TC-008       | **No Summarization on Large Result Set:** Verify that summaries are NOT returned for a large number of results. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request with a query guaranteed to return > 10 results (e.g., no filters). | The API should return a JSON object with a `count` (>10) and a `trial_ids` array. The response should NOT contain a `trials` array with summaries. |
| TC-009       | **Summary Caching:** Verify that a generated summary is cached and reused. | 1. Clear the `AISummary` for a specific trial.<br>2. Make a request that summarizes that trial.<br>3. Verify the `AISummary` column is now populated.<br>4. Make the same request again and verify the AI service is not called a second time (check logs). | The `AISummary` column in the database should be populated after the first call, and subsequent calls for the same trial should use the cached summary. |
| TC-010       | **Graceful Error Handling:** Verify the API handles errors from the AI service gracefully. | 1. Modify the mock AVA service to throw an error.<br>2. Make a request that would trigger summarization. | The API should return a 200 status code with the trial data, but with a placeholder message for the summary (e.g., "Summary not available"). The API call should not fail. |
