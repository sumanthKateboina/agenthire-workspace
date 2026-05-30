const { loadSpec } = require('../utils/specLoader');
const { getCompletion } = require('../utils/llmClient');

/**
 * Runs the Resume Parser Agent on raw resume text
 * @param {string} resumeText - Raw text extracted from the PDF.
 * @returns {Promise<object>} The extracted candidate profile JSON.
 */
const runResumeParser = async (resumeText) => {
  const spec = loadSpec('prompts/resume-parser.json');
  
  const systemPrompt = spec.system_prompt;
  const userPrompt = `
Here is the raw text extracted from a candidate's resume:
---
${resumeText}
---

Known standard skills for reference:
${JSON.stringify(spec.known_skills)}

Extract and structure the candidate's details. Return a JSON object matching this exact schema:
${JSON.stringify(spec.output_schema, null, 2)}
`;

  try {
    const rawResult = await getCompletion(
      systemPrompt, 
      userPrompt, 
      spec.temperature || 0.1, 
      'parser', 
      { text: resumeText }
    );
    
    // Parse the JSON
    let parsedResult;
    try {
      // Clean up markdown block format if LLM returns it
      const jsonString = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(jsonString);
    } catch (e) {
      console.warn('Failed to parse LLM response as JSON directly. Attempting regex cleanup.', rawResult);
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('LLM output does not contain valid JSON structure');
      }
    }
    
    // Verify required fields
    if (!parsedResult.name) parsedResult.name = 'Unknown Candidate';
    if (!parsedResult.email) parsedResult.email = 'unknown@example.com';
    if (!parsedResult.phone) parsedResult.phone = '000-0000';
    if (!parsedResult.skills) parsedResult.skills = [];
    if (parsedResult.experience_years === undefined) parsedResult.experience_years = 0;
    
    return parsedResult;
  } catch (error) {
    console.error('Resume Parser Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runResumeParser
};
