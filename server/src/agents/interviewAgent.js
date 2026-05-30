const { loadSpec } = require('../utils/specLoader');
const { getCompletion } = require('../utils/llmClient');

/**
 * Runs the Interview Agent to generate role-specific questions and rubrics
 * @param {object} candidate - Candidate document.
 * @param {object} job - Job document.
 * @returns {Promise<object>} The generated interview material JSON.
 */
const runInterviewAgent = async (candidate, job) => {
  try {
    const spec = loadSpec('prompts/interview-agent.json');
    const systemPrompt = spec.system_prompt;
    const userPrompt = `
Generate technical interview material for:
Candidate Name: ${candidate.name}
Applying For: ${job.title}
Suitability Score: ${candidate.match_score}/100

Skills Highlighted in Resume: ${JSON.stringify(candidate.parsed_resume_json?.skills || [])}

Create:
1. ${spec.num_questions || 3} tailored questions assessing their skills.
2. 1 custom coding challenge matching their experience level.
3. An evaluation rubric with score keys and focus points.

Output must be in JSON matching this schema:
{
  "questions": ["String"],
  "coding_task": {
    "title": "String",
    "description": "String",
    "solution_criteria": "String"
  },
  "rubric": [
    { "key": "String", "description": "String" }
  ]
}
`;

    const rawResult = await getCompletion(
      systemPrompt,
      userPrompt,
      spec.temperature || 0.7,
      'interview',
      { jobTitle: job.title, candidateName: candidate.name }
    );

    let parsedResult;
    try {
      const jsonString = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(jsonString);
    } catch (e) {
      console.warn('Failed to parse Interview Agent response. Cleaning up regex...', e.message);
      const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Interview LLM output does not contain valid JSON structure');
      }
    }

    return parsedResult;
  } catch (error) {
    console.error('Interview Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runInterviewAgent
};
