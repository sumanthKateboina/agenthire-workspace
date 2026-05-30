const Job = require('../models/Job');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Private/Recruiter
const createJob = async (req, res) => {
  try {
    const { title, description, required_skills, preferred_skills, min_experience, workflow_spec_id, hiring_spec_id } = req.body;

    const job = await Job.create({
      title,
      description,
      required_skills,
      preferred_skills: preferred_skills || [],
      min_experience,
      workflow_spec_id: workflow_spec_id || 'default-hiring-workflow',
      hiring_spec_id: hiring_spec_id || 'frontend-developer',
      creator: req.user._id
    });

    return res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Create job error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error creating job.' });
  }
};

// @desc    Get all job postings
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving jobs.' });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
const getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }
    return res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving job details.' });
  }
};

// @desc    Update job details
// @route   PUT /api/jobs/:id
// @access  Private/Recruiter
const updateJob = async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found.' });
    }

    // Verify ownership
    if (job.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this job posting.' });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error updating job details.' });
  }
};

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob
};
