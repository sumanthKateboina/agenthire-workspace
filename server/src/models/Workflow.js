const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  candidate_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Candidate',
    required: true
  },
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  current_state: {
    type: String,
    default: 'resume_parser'
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'waiting_approval', 'completed', 'failed'],
    default: 'pending'
  },
  state_data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  retries: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

WorkflowSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Workflow', WorkflowSchema);
