/**
 * Runs the Human Approval Checkpoint
 * Halts execution and waits for recruiter review
 * @returns {object} Halt instruction payload
 */
const runHumanApproval = async () => {
  console.log('[Human Approval Agent] Halting workflow execution. Pausing for recruiter review.');
  return {
    status: 'waiting_approval',
    paused: true,
    message: 'Workflow paused at recruiter review checkpoint. Awaiting POST /api/workflow/approve request.'
  };
};

module.exports = {
  runHumanApproval
};
