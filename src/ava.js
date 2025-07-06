const { VertexAI, HarmCategory, HarmBlockThreshold } = require('@google-cloud/vertexai');

const PROJECT_ID = process.env.PROJECT_ID;
const LOCATION = process.env.LOCATION || 'us-central1';

let vertexAI = null;
let model = null;

// Initialize Vertex AI only if PROJECT_ID is provided
if (PROJECT_ID) {
  try {
    vertexAI = new VertexAI({
      project: PROJECT_ID,
      location: LOCATION,
      apiKey: process.env.GEMINI_API_KEY
    });

    // Initialize the Gemini Pro model
    model = vertexAI.preview.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.9,
        topP: 1,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });
  } catch (error) {
    console.warn('Failed to initialize Vertex AI:', error.message);
  }
} else {
  console.warn('PROJECT_ID not provided. AI summaries will be disabled.');
}

/**
 * Generates a plain-language summary for a given clinical trial.
 *
 * @param {object} trial - The clinical trial object from the database.
 * @returns {Promise<string>} A promise that resolves to the AI-generated summary.
 */
async function getSummary(trial) {
  console.log(`Generating summary for trial: ${trial.TrialID}`);

  // Check if Vertex AI is available
  if (!model) {
    console.warn('Vertex AI not initialized. AI summaries are disabled.');
    return 'AI summary not available - Vertex AI not configured.';
  }

  const prompt = `Generate a plain language summary of the following clinical trial:\nTitle: ${trial.Title}\nCondition: ${trial.Condition}\nSummary: ${trial.Summary}\nStatus: ${trial.Status}\nPhase: ${trial.Phase}\n\nPlain Language Summary:`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    console.log(response);
    const aiSummary = response.candidates[0].content.parts[0].text;
    return aiSummary;
  } catch (error) {
    console.error(`Failed to get summary for trial ${trial.TrialID}:`, error);
    return 'AI summary not available at this time.';
  }
}

module.exports = {
  getSummary,
};