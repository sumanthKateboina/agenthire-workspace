const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Workflow = require('../models/Workflow');
const { executeWorkflow } = require('../workflows/workflowEngine');

// @desc    Upload resume & initiate hiring workflow
// @route   POST /api/candidates/upload
// @access  Public
const uploadCandidate = async (req, res) => {
  try {
    const { name, email, phone, job_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Resume PDF file is required.' });
    }

    if (!name || !email || !phone || !job_id) {
      return res.status(400).json({ success: false, error: 'Missing name, email, phone, or job_id in form payload.' });
    }

    // Check if job exists
    const job = await Job.findById(job_id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Target Job posting does not exist.' });
    }

    // Create Candidate
    const candidate = await Candidate.create({
      name,
      email,
      phone,
      resume_url: req.file.path,
      job_id
    });

    // Create Workflow
    const workflow = await Workflow.create({
      candidate_id: candidate._id,
      job_id: job._id,
      current_state: 'resume_parser',
      status: 'pending'
    });

    // Run the workflow engine asynchronously in the background
    executeWorkflow(workflow._id).catch((error) => {
      console.error(`[Background Workflow Runner] Execution crashed for workflow ${workflow._id}:`, error.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Candidate application submitted and AI workflow started.',
      data: {
        candidate,
        workflowId: workflow._id
      }
    });
  } catch (error) {
    console.error('Candidate upload error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error processing application upload.' });
  }
};

// @desc    Get all candidates
// @route   GET /api/candidates
// @access  Private/Recruiter
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find()
      .populate('job_id', 'title creator')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: candidates.length,
      data: candidates
    });
  } catch (error) {
    console.error('Get candidates error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving candidate list.' });
  }
};

// @desc    Get single candidate by ID
// @route   GET /api/candidates/:id
// @access  Private/Recruiter
const getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('job_id', 'title required_skills preferred_skills min_experience');
    if (!candidate) {
      return res.status(404).json({ success: false, error: 'Candidate not found.' });
    }
    return res.status(200).json({
      success: true,
      data: candidate
    });
  } catch (error) {
    console.error('Get candidate error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving candidate profile.' });
  }
};

module.exports = {
  uploadCandidate,
  getCandidates,
  getCandidate
};
