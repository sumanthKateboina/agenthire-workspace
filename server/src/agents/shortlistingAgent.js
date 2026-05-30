const { loadSpec } = require('../utils/specLoader');

/**
 * Runs the Shortlisting Agent to decide a candidate's status based on match score
 * @param {number} matchScore - Calculated suitability score (0-100).
 * @returns {object} The shortlisting decision.
 */
const runShortlistingAgent = async (matchScore) => {
  try {
    const rules = loadSpec('evaluation/shortlisting-rules.json');
    const shortlistThreshold = rules.shortlist_threshold || 80;
    const holdThreshold = rules.hold_threshold || 60;

    let decision = 'rejected';
    if (matchScore >= shortlistThreshold) {
      decision = 'shortlisted';
    } else if (matchScore >= holdThreshold) {
      decision = 'hold';
    }

    console.log(`[Shortlisting Agent] Match Score: ${matchScore}. Applied thresholds (Shortlist: ${shortlistThreshold}, Hold: ${holdThreshold}). Decision: ${decision}`);

    return {
      score: matchScore,
      decision: decision,
      thresholds: {
        shortlist: shortlistThreshold,
        hold: holdThreshold
      }
    };
  } catch (error) {
    console.error('Shortlisting Agent Error:', error.message);
    throw error;
  }
};

module.exports = {
  runShortlistingAgent
};
