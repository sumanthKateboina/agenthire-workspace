const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  required_skills: {
    type: [String],
    default: []
  },
  preferred_skills: {
    type: [String],
    default: []
  },
  min_experience: {
    type: Number,
    required: true
  },
  workflow_spec_id: {
    type: String,
    default: 'default-hiring-workflow'
  },
  hiring_spec_id: {
    type: String,
    default: 'frontend-developer'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);
