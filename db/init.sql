DROP TABLE IF EXISTS "ClinicalTrials" CASCADE;

-- Create the ClinicalTrials table
CREATE TABLE "ClinicalTrials" (
    id SERIAL PRIMARY KEY,
    "TrialID" VARCHAR(255) UNIQUE NOT NULL,
    "OfficialTitle" TEXT,
    "Condition" TEXT,
    "Location" TEXT,
    "Status" TEXT,
    "Phase" INTEGER,
    "Title" TEXT,
    "Summary" TEXT,
    "DetailedDescription" TEXT,
    "EligibilityCriteria" TEXT,
    "ArmGroups" TEXT,
    "Interventions" TEXT,
    "PrimaryOutcomes" TEXT,
    "SecondaryOutcomes" TEXT,
    "AISummary" TEXT, -- To cache AI-generated summaries
    "FullTextSearch" TSVECTOR
);

-- Create an index on the tsvector column for faster full-text search
CREATE INDEX fts_idx ON "ClinicalTrials" USING gin("FullTextSearch");

-- Create a trigger to automatically update the tsvector column when the data changes
CREATE OR REPLACE FUNCTION update_full_text_search_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."FullTextSearch" :=
        to_tsvector('english',
            COALESCE(NEW."Title", '') || ' ' ||
            COALESCE(NEW."OfficialTitle", '') || ' ' ||
            COALESCE(NEW."Condition", '') || ' ' ||
            COALESCE(NEW."Summary", '') || ' ' ||
            COALESCE(NEW."DetailedDescription", '') || ' ' ||
            COALESCE(NEW."EligibilityCriteria", '') || ' ' ||
            COALESCE(NEW."ArmGroups", '') || ' ' ||
            COALESCE(NEW."Interventions", '') || ' ' ||
            COALESCE(NEW."PrimaryOutcomes", '') || ' ' ||
            COALESCE(NEW."SecondaryOutcomes", '') || ' ' ||
            COALESCE(NEW."Location", '') || ' ' ||
            COALESCE(NEW."Status", '') || ' ' ||
            COALESCE(NEW."AISummary", '')
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fts_trigger
BEFORE INSERT OR UPDATE ON "ClinicalTrials"
FOR EACH ROW
EXECUTE FUNCTION update_full_text_search_column();