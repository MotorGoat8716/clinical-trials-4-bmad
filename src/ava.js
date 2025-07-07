// src/ava.js
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
        temperature: 0.7,
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
 * @param {string} type - The type of summary to generate ('summary' or 'detailed_description')
 * @returns {Promise<string>} A promise that resolves to the AI-generated summary.
 */
async function getSummary(trial, type = 'summary') {
  console.log(`Generating ${type} for trial: ${trial.TrialID || trial.nctId}`);

  // Check if Vertex AI is available
  if (!model) {
    console.warn('Vertex AI not initialized. AI summaries are disabled.');
    return 'AI summary not available - Vertex AI not configured.';
  }

  // Create different prompts based on the type requested
  let prompt = '';
  
  if (type === 'detailed_description') {
    prompt = `You are a medical communication specialist. Create a detailed plain language explanation of this clinical trial that a patient or family member could easily understand. Include what the study is testing, who can participate, what participants will do, potential benefits and risks, and what the results might mean.

Clinical Trial Information:
Title: ${trial.Title || trial.briefTitle || trial.officialTitle || 'Not provided'}
Condition/Disease: ${trial.Condition || (trial.conditions ? trial.conditions.join(', ') : 'Not specified')}
Study Summary: ${trial.Summary || trial.briefSummary || trial.detailedDescription || 'Not provided'}
Status: ${trial.Status || trial.overallStatus || 'Not provided'}
Phase: ${trial.Phase || trial.phase || 'Not provided'}
Study Type: ${trial.studyType || 'Not provided'}
NCT ID: ${trial.TrialID || trial.nctId || 'Not provided'}

Please write a comprehensive plain language explanation that includes:
1. What this study is trying to find out
2. Who this study is for (eligibility in simple terms)
3. What participants will experience during the study
4. Why this research is important
5. What the current status means for potential participants

Write in a warm, accessible tone that reduces anxiety and helps people understand whether this might be relevant for them or a loved one.`;
  } else if (type === 'eligibility') {
    prompt = `You are a medical communication specialist. Convert these clinical trial eligibility criteria into clear, simple language that any patient or family member can understand.

Clinical Trial Information:
Title: ${trial.Title || trial.briefTitle || trial.officialTitle || 'Not provided'}
Condition/Disease: ${trial.Condition || (trial.conditions ? trial.conditions.join(', ') : 'Not specified')}
Eligibility Criteria: ${trial.Summary || trial.eligibilityCriteria || 'Not provided'}
NCT ID: ${trial.TrialID || trial.nctId || 'Not provided'}

Please explain:
1. Who can participate in simple terms
2. Who cannot participate and why
3. Any special requirements or tests needed
4. How to determine if someone might be eligible

Use everyday language and avoid medical jargon. Be encouraging but accurate about eligibility requirements.`;
  } else {
    // Default summary type
    prompt = `You are a medical communication specialist. Convert this clinical trial information into a clear, concise summary that any patient or family member can understand. Use simple language and avoid medical jargon.

Clinical Trial Information:
Title: ${trial.Title || trial.briefTitle || trial.officialTitle || 'Not provided'}
Condition: ${trial.Condition || (trial.conditions ? trial.conditions.join(', ') : 'Not specified')}
Summary: ${trial.Summary || trial.briefSummary || trial.detailedDescription || 'Not provided'}
Status: ${trial.Status || trial.overallStatus || 'Not provided'}
Phase: ${trial.Phase || trial.phase || 'Not provided'}

Write a 2-3 sentence plain language summary that explains:
1. What condition this study focuses on
2. What the researchers are trying to learn or test
3. Current status (whether they're looking for participants)

Use everyday language that a 12-year-old could understand.`;
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    console.log('AI Response received for trial:', trial.TrialID || trial.nctId);
    
    if (response && response.candidates && response.candidates[0] && 
        response.candidates[0].content && response.candidates[0].content.parts && 
        response.candidates[0].content.parts[0]) {
      
      const aiSummary = response.candidates[0].content.parts[0].text;
      
      // Clean up the response
      const cleanedSummary = aiSummary
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*/g, '') // Remove markdown italics
        .trim();
      
      return cleanedSummary;
    } else {
      console.warn('Unexpected AI response structure for trial:', trial.TrialID || trial.nctId);
      return 'AI summary not available - unexpected response format.';
    }
  } catch (error) {
    console.error(`Failed to get summary for trial ${trial.TrialID || trial.nctId}:`, error);
    
    // Provide helpful error messages based on the error type
    if (error.message.includes('quota') || error.message.includes('limit')) {
      return 'AI summary temporarily unavailable due to usage limits. Please try again later.';
    } else if (error.message.includes('safety') || error.message.includes('blocked')) {
      return 'AI summary not available for this trial due to content safety filters.';
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      return 'AI summary not available due to network issues. Please try again.';
    } else {
      return 'AI summary not available at this time due to a technical issue.';
    }
  }
}

/**
 * Generates field explanations for common clinical trial terms
 * @param {string} fieldName - The field to explain
 * @param {string} fieldValue - The value to explain
 * @returns {Promise<string>} Plain language explanation
 */
async function getFieldExplanation(fieldName, fieldValue) {
  if (!model || !fieldValue) {
    return '';
  }

  const prompt = `Explain this clinical trial term in one simple sentence that a patient could understand:

Field: ${fieldName}
Value: ${fieldValue}

Provide a clear, one-sentence explanation without using medical jargon.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const response = result.response;
    if (response && response.candidates && response.candidates[0] && 
        response.candidates[0].content && response.candidates[0].content.parts && 
        response.candidates[0].content.parts[0]) {
      
      return response.candidates[0].content.parts[0].text.trim();
    }
  } catch (error) {
    console.warn(`Failed to get field explanation for ${fieldName}:`, error.message);
  }
  
  return '';
}

/**
 * Test function to verify AI is working
 * @returns {Promise<boolean>} Whether AI is functional
 */
async function testAI() {
  if (!model) {
    console.log('AI Test: Vertex AI not initialized');
    return false;
  }

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: "Say 'AI is working' if you can respond." }] }],
    });

    const response = result.response;
    if (response && response.candidates && response.candidates[0]) {
      console.log('AI Test: Success - AI is responding');
      return true;
    } else {
      console.log('AI Test: Failed - unexpected response structure');
      return false;
    }
  } catch (error) {
    console.log('AI Test: Failed -', error.message);
    return false;
  }
}

module.exports = {
  getSummary,
  getFieldExplanation,
  testAI,
};