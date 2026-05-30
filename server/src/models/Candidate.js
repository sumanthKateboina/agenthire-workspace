const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  resume_url: {
    type: String,
    required: true
  },
  parsed_resume_json: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  match_score: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['applied', 'parser_failed', 'matching_failed', 'pending', 'shortlisted', 'hold', 'rejected'],
    default: 'applied'
  },
  interview_material: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  email_sent: {
    type: Boolean,
    default: false
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
