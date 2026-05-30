const Workflow = require('../models/Workflow');
const WorkflowLog = require('../models/WorkflowLog');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { executeWorkflow } = require('../workflows/workflowEngine');
const { loadSpec } = require('../utils/specLoader');

// @desc    Start/Trigger a workflow manually
// @route   POST /api/workflow/start
// @access  Private/Recruiter
const startWorkflow = async (req, res) => {
  try {
    const { candidateId, jobId } = req.body;
    if (!candidateId || !jobId) {
      return res.status(400).json({ success: false, error: 'Missing candidateId or jobId.' });
    }

    // Check if workflow already exists
    let workflow = await Workflow.findOne({ candidate_id: candidateId, job_id: jobId });
    if (workflow) {
      return res.status(400).json({ success: false, error: 'Workflow already exists for this application.', workflowId: workflow._id });
    }

    workflow = await Workflow.create({
      candidate_id: candidateId,
      job_id: jobId,
      current_state: 'resume_parser',
      status: 'pending'
    });

    executeWorkflow(workflow._id).catch((err) => {
      console.error(`Error executing workflow ${workflow._id}:`, err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Workflow started successfully.',
      workflowId: workflow._id
    });
  } catch (error) {
    console.error('Start workflow error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error starting workflow.' });
  }
};

// @desc    Retry a failed workflow
// @route   POST /api/workflow/retry
// @access  Private/Recruiter
const retryWorkflow = async (req, res) => {
  try {
    const { workflowId } = req.body;
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    if (workflow.status !== 'failed') {
      return res.status(400).json({ success: false, error: 'Only failed workflows can be retried.' });
    }

    workflow.status = 'running';
    workflow.retries = 0; // Reset retries
    await workflow.save();

    console.log(`[Workflow Engine] Manual retry triggered for workflow ${workflow._id} from state: ${workflow.current_state}`);

    executeWorkflow(workflow._id).catch((err) => {
      console.error(`Error retrying workflow ${workflow._id}:`, err.message);
    });

    return res.status(200).json({
      success: true,
      message: 'Workflow retry initiated successfully.'
    });
  } catch (error) {
    console.error('Retry workflow error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrying workflow.' });
  }
};

// @desc    Approve or reject a candidate at the human checkpoint
// @route   POST /api/workflow/approve
// @access  Private/Recruiter
const approveWorkflow = async (req, res) => {
  try {
    const { workflowId, approved, notes } = req.body;

    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    if (workflow.status !== 'waiting_approval') {
      return res.status(400).json({ success: false, error: 'Workflow is not currently awaiting approval.' });
    }

    const candidate = await Candidate.findById(workflow.candidate_id);
    const job = await Job.findById(workflow.job_id);

    if (!candidate || !job) {
      return res.status(404).json({ success: false, error: 'Candidate or Job details missing.' });
    }

    // Load workflow spec to identify next steps
    const workflowSpec = loadSpec('workflow/default-hiring-workflow.json');
    const steps = workflowSpec.workflow;
    const approvalIndex = steps.indexOf('human_approval');

    if (approvalIndex === -1) {
      return res.status(500).json({ success: false, error: 'Hiring workflow specification is missing human_approval step.' });
    }

    // Save recruiter approval logs
    await WorkflowLog.create({
      workflow_id: workflow._id,
      agent_name: 'human_approval',
      status: 'success',
      input: { approved, notes },
      output: { message: approved ? 'Approved by recruiter' : 'Rejected by recruiter', notes }
    });

    // Update workflow state_data
    workflow.state_data = {
      ...workflow.state_data,
      human_approval: { approved, notes, timestamp: new Date() }
    };

    if (approved) {
      console.log(`[Workflow Engine] Candidate ${candidate.name} APPROVED. Moving to interview generation...`);
      
      // Advance to interview_agent
      workflow.current_state = steps[approvalIndex + 1] || 'interview_agent';
      workflow.status = 'running';
      await workflow.save();

      executeWorkflow(workflow._id).catch((err) => {
        console.error(`Error continuing workflow ${workflow._id} after approval:`, err.message);
      });
    } else {
      console.log(`[Workflow Engine] Candidate ${candidate.name} REJECTED. Branching to email notice directly...`);

      // Branching: Skip interview, go straight to email_agent
      candidate.status = 'rejected';
      await candidate.save();

      workflow.current_state = 'email_agent';
      workflow.status = 'running';
      await workflow.save();

      executeWorkflow(workflow._id).catch((err) => {
        console.error(`Error continuing workflow ${workflow._id} after rejection:`, err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: approved ? 'Candidate approved. Workflow resumed.' : 'Candidate rejected. Transitioned to email notifications.'
    });
  } catch (error) {
    console.error('Approve workflow error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error processing checkpoint approval.' });
  }
};

// @desc    Get detailed workflow details with step logs and state colors
// @route   GET /api/workflow/:id
// @access  Private/Recruiter
const getWorkflowDetails = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('candidate_id')
      .populate('job_id', 'title creator');
    
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found.' });
    }

    const logs = await WorkflowLog.find({ workflow_id: workflow._id }).sort({ createdAt: 1 });
    const nodeStates = loadSpec('workflow/node-states.json');
    const workflowSpec = loadSpec('workflow/default-hiring-workflow.json');

    return res.status(200).json({
      success: true,
      data: {
        workflow,
        logs,
        executionOrder: workflowSpec.workflow,
        colors: nodeStates.states
      }
    });
  } catch (error) {
    console.error('Get workflow details error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error retrieving workflow details.' });
  }
};

module.exports = {
  startWorkflow,
  retryWorkflow,
  approveWorkflow,
  getWorkflowDetails
};
