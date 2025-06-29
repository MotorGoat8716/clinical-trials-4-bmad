# Test Plan: STORY-001 - Search for Clinical Trials from Internal Database

**Objective:** To verify that the `/api/trials/search` endpoint functions as per the acceptance criteria defined in [STORY-001](docs/stories/story-001-search-trials-from-db.md).

## 1. Test Environment

-   **Application:** Clinical Trials API
-   **Database:** PostgreSQL
-   **Data:** Real data fetched from `ClinicalTrials.gov`

## 2. Test Cases

| Test Case ID | Description                                                                 | Steps                                                                                                                                                           | Expected Result                                                                                                                                                           |
| :----------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-001       | **Search with a single condition:** Verify that the API returns correct results for a single search term. | 1. Seed the database with `npm run db:seed`.<br>2. Start the server with `npm start`.<br>3. Send a GET request to `/api/trials/search?condition=cancer`. | The API should return a JSON object with a `count` greater than 0 and an array of `trial_ids`.                                                                          |
| TC-002       | **Search with multiple conditions:** Verify that the API correctly filters results when multiple query parameters are provided. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request to `/api/trials/search?condition=cancer&location=boston`. | The API should return a JSON object with a `count` and an array of `trial_ids` that match both the condition and location.                                                |
| TC-003       | **Search with a phase:** Verify that the API correctly filters by phase. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request to `/api/trials/search?phase=2`. | The API should return a JSON object with a `count` and an array of `trial_ids` for trials in Phase 2.                                                                     |
| TC-004       | **Search with no matching results:** Verify that the API returns an empty result set when no trials match the query. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request to `/api/trials/search?condition=nonexistentcondition`. | The API should return a JSON object with a `count` of 0 and an empty array of `trial_ids`.                                                                                |
| TC-005       | **Search with no query parameters:** Verify that the API returns all trials when no query parameters are provided. | 1. Seed the database.<br>2. Start the server.<br>3. Send a GET request to `/api/trials/search`. | The API should return a JSON object with a `count` equal to the total number of trials in the database (100) and an array of all `trial_ids`.                               |
| TC-006       | **Performance Test:** Verify that the API response time is within the acceptable limit. | 1. Seed the database.<br>2. Start the server.<br>3. Use a tool like `ab` or `wrk` to send a high volume of requests to the API and measure the P90 response time. | The P90 response time should be under 200ms.                                                                                                                              |
