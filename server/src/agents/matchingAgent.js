const { loadSpec } = require('../utils/specLoader');
const { searchDocuments } = require('../rag/qdrantService');
const { calculateMatchScore } = require('../utils/scoreCalculator');
const { getCompletion } = require('../utils/llmClient');

/**
 * Runs the Matching Agent to score a candidate against a Job
 * @param {object} parsedResume - The parsed candidate profile.
 * @param {object} job - The job posting object.
 * @returns {Promise<object>} The matching scorecard.
 */
const runMatchingAgent = async (parsedResume, job) => {
  try {
    const matchingSpec = loadSpec('prompts/matching-agent.json');
    const collectionName = `candidate_${parsedResume._id || parsedResume.id}`;
    
    // Programmatic matching calculation
    const progResult = calculateMatchScore(parsedResume, job);

    // Perform RAG search to pull relevant experience context for skills
    let ragContext = '';
    try {
      const searchTerms = [...(job.required_skills || []), ...(job.preferred_skills || [])];
      if (searchTerms.length > 0) {
        const queryText = searchTerms.join(' ');
        const hits = await searchDocuments(collectionName, queryText, 3);
        ragContext = hits.map(hit => hit.text).join('\n---\n');
      }
    } catch (e) {
      console.warn('RAG search during matching failed or was skipped:', e.message);
    }

    // Call LLM for detailed review and confirmation if API keys exist
    const systemPrompt = matchingSpec.system_prompt;
    const userPrompt = `
Job Requirements:
- Title: ${job.title}
- Required Skills: ${JSON.stringify(job.required_skills)}
- Preferred Skills: ${JSON.stringify(job.preferred_skills)}
- Minimum Experience Years: ${job.min_experience}

Candidate Parsed Details:
- Name: ${parsedResume.name}
- Extracted Skills: ${JSON.stringify(parsedResume.skills)}
- Experience Years: ${parsedResume.experience_years}
- Projects: ${JSON.stringify(parsedResume.projects)}

RAG Resume Text Context:
---
${ragContext || 'No raw context available.'}
---

Scoring weights:
${JSON.stringify(matchingSpec.weights, null, 2)}

Provide the final JSON matching scorecard. Use the programmatic score ${progResult.match_score} as a baseline, adjusting slightly based on projects or RAG details if applicable.
Return JSON ONLY, matching this schema:
{
  "match_score": Number (0-100),
  "matched_required_skills": ["String"],
  "matched_preferred_skills": ["String"],
  "missing_required_skills": ["String"],
  "all_skills_matched": Boolean,
  "experience_match": Boolean,
  "justification": "String"
}
`;

    // Try calling LLM, fallback to programmatic calculator result
    let finalResult;
    try {
      const rawLLMResult = await getCompletion(
        systemPrompt,
        userPrompt,
        0.2,
        'matching',
        parsedResume
      );

      // Clean up markdown block format
      const jsonString = rawLLMResult.replace(/```json/g, '').replace(/```/g, '').trim();
      finalResult = JSON.parse(jsonString);
    } catch (llmError) {
      console.warn('Matching Agent LLM call failed. Falling back to programmatic calculation:', llmError.message);
      finalResult = {
        ...progResult,
        justification: `Programmatically calculated score based on skill overlap. Matched ${progResult.matched_required_skills.length}/${job.required_skills.length} required skills.`
      };
    }

    // Sanitize response to guarantee keys match schema
    if (finalResult.match_score === undefined) finalResult.match_score = progResult.match_score;
    if (!finalResult.matched_required_skills) finalResult.matched_required_skills = progResult.matched_required_skills;
    if (!finalResult.matched_preferred_skills) finalResult.matched_preferred_skills = progResult.matched_preferred_skills;
    if (!finalResult.missing_required_skills) finalResult.missing_required_skills = progResult.missing_required_skills;
    if (finalResult.all_skills_matched === undefined) finalResult.all_skills_matched = progResult.all_skills_matched;
    if (finalResult.experience_match === undefined) finalResult.experience_match = progResult.experience_match;

    return finalResult;
  } catch (error) {
    console.error('Matching Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runMatchingAgent
};
