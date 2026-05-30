const Candidate = require('../models/Candidate');
const Workflow = require('../models/Workflow');
const WorkflowLog = require('../models/WorkflowLog');

// @desc    Get recruiter system analytics
// @route   GET /api/analytics
// @access  Private/Recruiter
const getAnalytics = async (req, res) => {
  try {
    // 1. Candidate statistics
    const totalCandidates = await Candidate.countDocuments();
    const shortlistedCandidates = await Candidate.countDocuments({ status: 'shortlisted' });
    const holdCandidates = await Candidate.countDocuments({ status: 'hold' });
    const rejectedCandidates = await Candidate.countDocuments({ status: 'rejected' });
    const pendingCandidates = await Candidate.countDocuments({ status: { $in: ['applied', 'pending'] } });

    const shortlistRate = totalCandidates > 0 
      ? Math.round((shortlistedCandidates / totalCandidates) * 100) 
      : 0;

    // 2. Workflow stats
    const totalWorkflows = await Workflow.countDocuments();
    const completedWorkflows = await Workflow.countDocuments({ status: 'completed' });
    const runningWorkflows = await Workflow.countDocuments({ status: 'running' });
    const failedWorkflows = await Workflow.countDocuments({ status: 'failed' });
    const waitingApprovalWorkflows = await Workflow.countDocuments({ status: 'waiting_approval' });

    const completionRate = totalWorkflows > 0 
      ? Math.round((completedWorkflows / totalWorkflows) * 100) 
      : 0;

    // 3. Agent performance breakdown
    const agentBreakdown = await WorkflowLog.aggregate([
      {
        $group: {
          _id: { agent: '$agent_name', status: '$status' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format agent breakdown nicely
    const agentMetrics = {};
    agentBreakdown.forEach((item) => {
      const { agent, status } = item._id;
      if (!agentMetrics[agent]) {
        agentMetrics[agent] = { success: 0, failed: 0, waiting_approval: 0, running: 0 };
      }
      agentMetrics[agent][status] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        candidates: {
          total: totalCandidates,
          shortlisted: shortlistedCandidates,
          hold: holdCandidates,
          rejected: rejectedCandidates,
          pending: pendingCandidates,
          shortlistRate
        },
        workflows: {
          total: totalWorkflows,
          completed: completedWorkflows,
          running: runningWorkflows,
          failed: failedWorkflows,
          waitingApproval: waitingApprovalWorkflows,
          completionRate
        },
        agentMetrics
      }
    });
  } catch (error) {
    console.error('Analytics aggregation error:', error.message);
    return res.status(500).json({ success: false, error: 'Server error aggregating analytics data.' });
  }
};

module.exports = {
  getAnalytics
};
