# Clinical Trials Resource Hub - Patient-Centric ClinicalTrials.gov Wrapper

This project provides a patient-friendly wrapper around ClinicalTrials.gov, enhancing the authoritative clinical trials database with accessibility features including plain language summaries, medical glossary, and AVA conversational guidance while maintaining 100% data parity with the source.

## Prerequisites

- Node.js
- PostgreSQL

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd clinical-trials-api
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up the database:**

    -   Create a PostgreSQL database named `clinical_trials`.
    -   Run the `db/init.sql` script to create the necessary tables and indexes. You can do this using a tool like `psql`:

        ```bash
        psql -d clinical_trials -f db/init.sql
        ```

    -   The application integrates directly with the ClinicalTrials.gov API for real-time data access. You can optionally seed the database with cache data for testing:

        ```bash
        npm run db:seed
        ```

        **Note:** The wrapper architecture maintains real-time connectivity with ClinicalTrials.gov, so seeding is only for development/testing purposes.

4.  **Configure environment variables:**

    -   Create a `.env` file by copying the example file:

        ```bash
        cp .env.example .env
        ```

    -   Update the `.env` file with your PostgreSQL connection details.

5.  **Run the application:**

    ```bash
    npm start
    ```

    The server will start on `http://localhost:3000`.

## API Endpoints

### Search Trials

-   **URL:** `/api/trials/search`
-   **Method:** `GET`
-   **Query Parameters:**
    -   `condition` (string): The condition to search for (e.g., "cancer").
    -   `location` (string): The location to search for (e.g., "boston").
    -   `phase` (integer): The phase of the trial (e.g., 2).
-   **Example:**

    ```bash
    curl "http://localhost:3000/api/trials/search?condition=cancer&location=boston"
    ```

-   **Success Response:**

    ```json
    {
      "count": 1,
      "trial_ids": [123]
    }