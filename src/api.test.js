const request = require('supertest');
const { app, pool } = require('./index'); // Assuming your express app is exported from index.js
const { execSync } = require('child_process');

beforeAll(async () => {
  try {
    console.log('Seeding database for tests...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('Database seeded successfully.');

    // Add a specific trial for testing summarization
    await pool.query(
      `INSERT INTO "ClinicalTrials" ("TrialID", "Title", "Condition", "Location", "Phase")
       VALUES ('NCT-TEST-123', 'Test Trial for Summarization', 'A-Very-Specific-Condition', 'Testville', 1)
       ON CONFLICT ("TrialID") DO NOTHING`
    );
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  }
}, 30000);

afterAll(async () => {
  await pool.end();
});

describe('Clinical Trials API', () => {
  // Test Case TC-001
  it('should return trials for a single condition', async () => {
    const res = await request(app).get('/api/trials/search?condition=cancer');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('trial_ids');
    expect(res.body.count).toBeGreaterThan(0);
  });

  // Test Case TC-002
  it('should return trials for multiple conditions', async () => {
    const res = await request(app).get('/api/trials/search?condition=cancer&location=boston');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('trials');
    expect(res.body.trials).toHaveLength(res.body.count);
  });

  // Test Case TC-003
  it('should return trials for a specific phase', async () => {
    const res = await request(app).get('/api/trials/search?phase=2');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('trial_ids');
  });

  // Test Case TC-004
  it('should return a count of 0 for a nonexistent condition', async () => {
    const res = await request(app).get('/api/trials/search?condition=nonexistentcondition');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('count', 0);
    expect(res.body.trial_ids).toHaveLength(0);
  });

  // Test Case TC-005
  it('should return only trial_ids when the result set is large', async () => {
    const res = await request(app).get('/api/trials/search');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('trial_ids');
    expect(res.body).not.toHaveProperty('trials');
    expect(res.body.count).toBeGreaterThan(10);
  });

  describe('STORY-002: Conditional Summarization', () => {
    // Test Case TC-007
    it('should return summaries when the result set is small', async () => {
      const res = await request(app).get('/api/trials/search?condition=A-Very-Specific-Condition');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('count', 1);
      expect(res.body).toHaveProperty('trials');
      expect(res.body.trials).toHaveLength(1);
      expect(res.body.trials[0]).toHaveProperty('summary');
      expect(res.body.trials[0].summary).toContain('This is a mock AI summary');
    });

    // Test Case TC-008
    it('should not return summaries when the result set is large', async () => {
      const res = await request(app).get('/api/trials/search?condition=cancer');
      expect(res.statusCode).toEqual(200);
      expect(res.body.count).toBeGreaterThan(10);
      expect(res.body).toHaveProperty('trial_ids');
      expect(res.body).not.toHaveProperty('trials');
    });

    // Test Case TC-009
    it('should cache the summary in the database', async () => {
      // Clear any existing AI summary
      await pool.query(`UPDATE "ClinicalTrials" SET "AISummary" = NULL WHERE "TrialID" = 'NCT-TEST-123'`);

      // First request to generate and cache the summary
      await request(app).get('/api/trials/search?condition=A-Very-Specific-Condition');

      // Check that the summary is now cached
      const { rows } = await pool.query(`SELECT "AISummary" FROM "ClinicalTrials" WHERE "TrialID" = 'NCT-TEST-123'`);
      expect(rows[0].AISummary).not.toBeNull();
      expect(rows[0].AISummary).toContain('This is a mock AI summary');
    });
  });
});