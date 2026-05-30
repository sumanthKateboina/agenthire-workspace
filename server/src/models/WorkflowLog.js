const mongoose = require('mongoose');

const WorkflowLogSchema = new mongoose.Schema({
  workflow_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },
  agent_name: {
    type: String,
    required: true
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['running', 'success', 'failed', 'waiting_approval'],
    default: 'running'
  },
  error: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorkflowLog', WorkflowLogSchema);
