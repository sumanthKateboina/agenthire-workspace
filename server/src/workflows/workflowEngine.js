const { loadSpec } = require('../utils/specLoader');
const Workflow = require('../models/Workflow');
const WorkflowLog = require('../models/WorkflowLog');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');

const { extractTextFromPDF } = require('../utils/pdfParser');
const { runResumeParser } = require('../agents/resumeParser');
const { runEmbeddingAgent } = require('../agents/embeddingAgent');
const { runMatchingAgent } = require('../agents/matchingAgent');
const { runShortlistingAgent } = require('../agents/shortlistingAgent');
const { runHumanApproval } = require('../agents/humanApproval');
const { runInterviewAgent } = require('../agents/interviewAgent');
const { runEmailAgent } = require('../agents/emailAgent');

/**
 * Runs a workflow from its current state onward
 * @param {string} workflowId - ID of the workflow document.
 */
const executeWorkflow = async (workflowId) => {
  let workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }

  // Load workflow sequence spec
  const workflowSpec = loadSpec('workflow/default-hiring-workflow.json');
  const steps = workflowSpec.workflow;

  // Check retry policy
  const retrySpec = loadSpec('system/retry-policy.json');
  const maxRetries = retrySpec.max_retries || 3;

  const candidate = await Candidate.findById(workflow.candidate_id);
  const job = await Job.findById(workflow.job_id);

  if (!candidate || !job) {
    workflow.status = 'failed';
    await workflow.save();
    throw new Error(`Candidate or Job missing for workflow ${workflowId}`);
  }

  workflow.status = 'running';
  await workflow.save();

  console.log(`[Workflow Engine] Starting execution of workflow ${workflowId} for candidate ${candidate.name} (Job: ${job.title})`);

  let currentIndex = steps.indexOf(workflow.current_state);
  if (currentIndex === -1) {
    currentIndex = 0;
    workflow.current_state = steps[0];
  }

  // State loop
  for (let i = currentIndex; i < steps.length; i++) {
    const stepName = steps[i];
    workflow.current_state = stepName;
    await workflow.save();

    console.log(`[Workflow Engine] Executing Node [${i + 1}/${steps.length}]: "${stepName}"`);

    // Create log entry
    const logEntry = await WorkflowLog.create({
      workflow_id: workflow._id,
      agent_name: stepName,
      status: 'running',
      input: { candidateId: candidate._id, jobId: job._id }
    });

    try {
      let result = null;

      switch (stepName) {
        case 'resume_parser':
          // Extract text and parse
          const rawText = await extractTextFromPDF(candidate.resume_url);
          logEntry.input = { resume_path: candidate.resume_url, text_length: rawText.length };
          result = await runResumeParser(rawText);
          
          // Save parsed resume to candidate
          candidate.parsed_resume_json = result;
          await candidate.save();
          break;

        case 'embedding_agent':
          // Re-load text for indexing
          const textForEmbed = await extractTextFromPDF(candidate.resume_url);
          result = await runEmbeddingAgent(candidate._id.toString(), textForEmbed);
          break;

        case 'matching_agent':
          if (!candidate.parsed_resume_json) {
            throw new Error('Resume parsing data is missing for matching.');
          }
          result = await runMatchingAgent(candidate.parsed_resume_json, job);
          
          // Save score
          candidate.match_score = result.match_score;
          await candidate.save();
          break;

        case 'shortlisting_agent':
          result = await runShortlistingAgent(candidate.match_score);
          
          // Save status
          candidate.status = result.decision;
          await candidate.save();
          break;

        case 'human_approval':
          result = await runHumanApproval();
          break;

        case 'interview_agent':
          result = await runInterviewAgent(candidate, job);
          
          // Save interview info
          candidate.interview_material = result;
          await candidate.save();
          break;

        case 'email_agent':
          result = await runEmailAgent(candidate, job);
          
          // Update status
          candidate.email_sent = result.sent;
          await candidate.save();
          break;

        default:
          throw new Error(`Unknown agent node: ${stepName}`);
      }

      // Successful step execution
      logEntry.status = 'success';
      logEntry.output = result;
      await logEntry.save();

      // Check if human approval halted the flow
      if (stepName === 'human_approval' && result.paused) {
        workflow.status = 'waiting_approval';
        await workflow.save();
        
        // Log waiting approval transition
        logEntry.status = 'waiting_approval';
        await logEntry.save();
        
        console.log(`[Workflow Engine] Workflow paused at recruiter review. Exit loop.`);
        return; // Pause execution here
      }

      // Save intermediate data in state channels
      workflow.state_data = {
        ...workflow.state_data,
        [stepName]: result
      };
      
      // Advance state
      if (i + 1 < steps.length) {
        workflow.current_state = steps[i + 1];
      } else {
        workflow.status = 'completed';
      }
      await workflow.save();

    } catch (stepError) {
      console.error(`[Workflow Engine] Error in agent "${stepName}":`, stepError.message);
      
      logEntry.status = 'failed';
      logEntry.error = stepError.message;
      await logEntry.save();

      workflow.status = 'failed';
      workflow.retries += 1;
      await workflow.save();

      throw stepError; // Rethrow to halt flow
    }
  }
  
  console.log(`[Workflow Engine] Workflow ${workflowId} completed successfully.`);
};

module.exports = {
  executeWorkflow
};
