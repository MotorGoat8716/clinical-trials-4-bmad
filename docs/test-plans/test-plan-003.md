# Test Plan: STORY-003 - Build Initial Search User Interface

**Objective:** To verify that the frontend application correctly implements the search UI as per the acceptance criteria in [STORY-003](docs/stories/story-003-search-ui.md).

## 1. Test Environment

-   **Application:** Clinical Trials UI (React App)
-   **Backend:** Local Node.js API
-   **Browser:** Latest stable version of Chrome

## 2. Test Cases

| Test Case ID | Description                                                                 | Steps                                                                                                                                                           | Expected Result                                                                                                                                                           |
| :----------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-011       | **Initial UI Display:** Verify that the search page loads with all required elements. | 1. Run the application with `npm run dev`.<br>2. Open the application in a browser. | The page should display a main heading, a search bar, and input fields for `condition`, `location`, and `phase`. The AVA assistant interface should be visible. |
| TC-012       | **Large Result Set Handling:** Verify the UI correctly displays the message for a large number of results. | 1. Start the application.<br>2. Perform a search that is known to return > 10 results (e.g., search for "cancer"). | The UI should display the message: "We found [count] trials. Please add more filters to see summaries." No trial cards should be displayed. |
| TC-013       | **Small Result Set Handling:** Verify the UI correctly displays trial cards for a small number of results. | 1. Start the application.<br>2. Perform a search that is known to return <= 10 results. | The UI should display a "trial card" for each returned trial, showing the `title` and `summary`. |
| TC-014       | **Trial Card Link:** Verify that clicking a trial card opens the correct external link. | 1. Perform a search that returns trial cards.<br>2. Click on the "View on ClinicalTrials.gov" link on any trial card. | A new browser tab should open to the correct URL on `clinicaltrials.gov` for that specific trial. |
| TC-015       | **Loading and Error States:** Verify that the UI correctly displays loading and error indicators. | 1. Perform a search.<br>2. While the search is in progress, verify a "Searching..." message is shown.<br>3. Manually stop the backend server and perform a search. | The "Searching..." button text should appear during the API call. When the backend is unavailable, an appropriate error message should be displayed to the user. |
