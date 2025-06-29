# Epic 001: Trial Search & Discovery MVP

**Date:** June 27, 2025
**Status:** To Do

## 1. Description

This epic covers the work required to build the core clinical trial search and discovery functionality for the MVP of the Clinical Trials Resource Hub. The primary goal is to provide patients and caregivers with a simple, empathetic, and cost-effective way to find and understand clinical trials.

This epic directly supports the core user stories outlined in the PRD, focusing on search, filtering, and AVA-powered summarization with a strict focus on minimizing operational costs as detailed in the architecture document.

## 2. Business & Product Goals

*   Validate that an AI-centric approach effectively addresses the pain points of trial discovery.
*   Achieve initial user adoption by providing a high-value, easy-to-use search tool.
*   Establish the technical viability of the proposed cost-effective architecture.
*   Deliver a tangible reduction in the complexity and emotional burden of finding clinical trials.

## 3. Key Features & Scope

*   **Backend Data Service:** Implement a service to periodically ingest a scoped set of data from ClinicalTrials.gov into a PostgreSQL database.
*   **Search & Filtering:** Develop an API that uses PostgreSQL's full-text search to find and filter trials based on user criteria (disease, location, phase, etc.).
*   **AVA Integration for Summarization:** Integrate with an LLM to provide plain-language summaries of trial information.
*   **Cost Control Logic:** Implement the critical logic to ensure AVA only generates summaries when the result set is small (e.g., <=10 trials).
*   **Frontend UI:** Build the user interface for the search bar, filter controls, and display of results/summaries.

## 4. User Stories

*As a patient/caregiver, I want AVA to make it easy to search for clinical trials by any filter I want...*
*As a patient/caregiver, I want AVA to make it easy to filter trial search results by additional basic criteria...*
*As a patient/caregiver, I want AVA to make it easy to view a summarized, plain-language overview of a selected trial...*
*As a patient/caregiver, I want to view the official, full trial details...*

*(This epic will be broken down into more detailed user stories for development sprints.)*

## 5. Dependencies

*   Finalized selection of LLM provider.
*   Access to ClinicalTrials.gov data.
*   Availability of a managed PostgreSQL instance.