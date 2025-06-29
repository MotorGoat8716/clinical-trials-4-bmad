# Test Plan: STORY-004 - Validate and Optimize Data Ingestion Pipeline

**Objective:** To verify that the data ingestion pipeline from ClinicalTrials.gov is accurate, complete, and performant, as per the acceptance criteria in [STORY-004](docs/stories/story-004-validate-data-ingestion.md).

## 1. Test Environment

-   **Application:** Data Ingestion Script (`db/fetch-and-seed.js`)
-   **Database:** Local PostgreSQL database
-   **Data Source:** `ClinicalTrials.gov` API

## 2. Test Cases

| Test Case ID | Description                                                                 | Steps                                                                                                                                                           | Expected Result                                                                                                                                                           |
| :----------- | :-------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-016       | **Data Accuracy:** Verify that specific trial data matches the source. | 1. Select 5-10 `NCTID`s.<br>2. Run the ingestion script for these `NCTID`s.<br>3. Manually check the `TrialID`, `Title`, `Condition`, `Location`, `Phase`, and `Summary` fields in the database against the `ClinicalTrials.gov` website. | The data for the selected trials in the local database should exactly match the data on the `ClinicalTrials.gov` website. |
| TC-017       | **Data Completeness:** Verify that the total number of ingested trials is correct. | 1. Perform a broad search (e.g., "cancer") on `ClinicalTrials.gov` and note the total number of results.<br>2. Configure and run the ingestion script for the same query.<br>3. Count the number of records in the `ClinicalTrials` table. | The total number of records in the database should match the total count from the `ClinicalTrials.gov` website. |
| TC-018       | **Data Speed:** Measure the performance of the ingestion script. | 1. Configure the script to fetch a large number of trials (e.g., 1,000).<br>2. Execute the script and measure the total execution time. | The execution time should be documented and deemed acceptable for a daily batch process. |
| TC-019       | **Script Configurability:** Verify that the ingestion script can be configured via arguments. | 1. Run `db/fetch-and-seed.js` with different arguments for the search query and number of trials.<br>2. Check that the script fetches data according to the provided arguments. | The script should dynamically change its execution based on the command-line arguments, not hardcoded values. |
| TC-020       | **Validation Script:** Verify the automated validation script works correctly. | 1. Run the new validation script (`db/validate-data.js`).<br>2. The script should perform the checks from TC-016 and TC-017 automatically. | The script should output a clear report indicating whether the data is accurate and complete, highlighting any discrepancies. |
