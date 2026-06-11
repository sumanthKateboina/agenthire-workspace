const mongoose = require('mongoose');

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/agenthire';

// Import all models first to register schemas
const User = require('./src/models/User');
const Job = require('./src/models/Job');
const Candidate = require('./src/models/Candidate');
const Workflow = require('./src/models/Workflow');
const WorkflowLog = require('./src/models/WorkflowLog');

const inspect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const workflows = await Workflow.find().populate('candidate_id').populate('job_id');
    console.log(`\nFound ${workflows.length} workflow executions in the database.`);

    for (const flow of workflows) {
      console.log(`\n====================================================================`);
      console.log(`Workflow ID:  ${flow._id}`);
      console.log(`Candidate:    ${flow.candidate_id?.name || 'Unknown'}`);
      console.log(`Job:          ${flow.job_id?.title || 'Unknown'}`);
      console.log(`Current Node: ${flow.current_state}`);
      console.log(`Status:       ${flow.status}`);
      console.log(`Retries:      ${flow.retries}`);
      console.log(`--------------------------------------------------------------------`);
      
      const logs = await WorkflowLog.find({ workflow_id: flow._id }).sort({ createdAt: 1 });
      console.log(`Step Logs count: ${logs.length}`);
      
      logs.forEach((log, index) => {
        console.log(`  [Step ${index + 1}] ${log.agent_name} -> Status: ${log.status} ${log.error ? '(Error: ' + log.error + ')' : ''}`);
      });
      console.log(`====================================================================\n`);
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error inspecting:', error.message);
    process.exit(1);
  }
};

inspect();
