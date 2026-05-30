const { loadSpec } = require('./specLoader');

/**
 * Calculates candidate match score based on job requirements and matching spec weights.
 * @param {object} parsedResume - Candidate's parsed skills and experience.
 * @param {object} job - Job document containing required_skills, preferred_skills, and min_experience.
 * @returns {object} Match result containing score, matched skills, and experience flag.
 */
const calculateMatchScore = (parsedResume, job) => {
  // Load weights from matching agent spec
  const matchingSpec = loadSpec('prompts/matching-agent.json');
  const { required_skills_weight, preferred_skills_weight, experience_weight } = matchingSpec.weights;

  const candidateSkills = (parsedResume.skills || []).map(s => s.toLowerCase());
  const candidateExp = parsedResume.experience_years || 0;

  const jobReqSkills = (job.required_skills || []).map(s => s.toLowerCase());
  const jobPrefSkills = (job.preferred_skills || []).map(s => s.toLowerCase());
  const jobMinExp = job.min_experience || 0;

  // 1. Required Skills Match
  let matchedReq = [];
  let missingReq = [];
  let reqScore = 100;

  if (jobReqSkills.length > 0) {
    matchedReq = jobReqSkills.filter(skill => candidateSkills.includes(skill));
    missingReq = jobReqSkills.filter(skill => !candidateSkills.includes(skill));
    reqScore = (matchedReq.length / jobReqSkills.length) * 100;
  }

  // 2. Preferred Skills Match
  let matchedPref = [];
  let prefScore = 100;

  if (jobPrefSkills.length > 0) {
    matchedPref = jobPrefSkills.filter(skill => candidateSkills.includes(skill));
    prefScore = (matchedPref.length / jobPrefSkills.length) * 100;
  }

  // 3. Experience Match
  let expScore = 100;
  const expMatch = candidateExp >= jobMinExp;

  if (jobMinExp > 0) {
    expScore = Math.min((candidateExp / jobMinExp) * 100, 100);
  }

  // Combined weighted score
  const finalScore = Math.round(
    (reqScore * required_skills_weight) +
    (prefScore * preferred_skills_weight) +
    (expScore * experience_weight)
  );

  return {
    match_score: finalScore,
    matched_required_skills: job.required_skills.filter(s => candidateSkills.includes(s.toLowerCase())),
    matched_preferred_skills: job.preferred_skills.filter(s => candidateSkills.includes(s.toLowerCase())),
    missing_required_skills: job.required_skills.filter(s => !candidateSkills.includes(s.toLowerCase())),
    all_skills_matched: missingReq.length === 0,
    experience_match: expMatch
  };
};

module.exports = {
  calculateMatchScore
};
