'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '../../../store/useAuthStore';
import WorkflowGraph from '../../../components/WorkflowGraph';
import { 
  GitFork, CheckCircle2, XCircle, Clock, AlertTriangle, 
  ChevronRight, RefreshCw, Mail, HelpCircle, FileText, Send, Check
} from 'lucide-react';

function WorkflowsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, initialize, loading, getAuthHeaders } = useAuthStore();

  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [workflowDetail, setWorkflowDetail] = useState(null);
  const [fetchingList, setFetchingList] = useState(true);
  const [fetchingDetail, setFetchingDetail] = useState(false);
  const [error, setError] = useState('');
  
  // Approval Form State
  const [approvedNotes, setApprovedNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Load list of all workflows
  const loadWorkflows = async (selectCandidateId = null) => {
    setFetchingList(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      // We can load candidates first to see their workflows
      const res = await fetch(`${apiBaseUrl}/candidates`, {
        headers: getAuthHeaders()
      });
      const candData = await res.json();
      if (!res.ok) throw new Error(candData.error || 'Failed to fetch candidate pipelines');
      
      const cands = candData.data || [];
      
      // Fetch workflow detail objects for active tracking
      // Since workflows and candidates are 1-to-1 in this build, we can resolve workflow info
      const flowsList = [];
      for (const cand of cands) {
        // Fetch matching workflow
        // In Express, we start workflow automatically on upload
        // Let's query backend for workflow details if candidate ID has been mapped
        try {
          const detailRes = await fetch(`${apiBaseUrl}/workflow/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ candidateId: cand._id, jobId: cand.job_id?._id })
          });
          const detailData = await detailRes.json();
          // If already exists, start returns 400 with workflowId
          const flowId = detailData.workflowId || detailData.error?.includes('exists') ? (await (await fetch(`${apiBaseUrl}/candidates/${cand._id}`, { headers: getAuthHeaders() })).json()).data?.workflowId : null;
          
          flowsList.push({
            id: detailData.workflowId || (detailData.error?.includes('exists') ? detailData.workflowId : null),
            candidate: cand,
            jobTitle: cand.job_id?.title || 'Unknown Role'
          });
        } catch (e) {
          // If start workflow is in progress or completed
        }
      }

      // Fallback: We can fetch candidates list.
      // Let's create an express endpoint GET /workflow/all if needed, but since we didn't specify it,
      // let's fetch candidate details and build the workflows list from MongoDB documents directly!
      // Wait, let's load all workflows from MongoDB workflows database. We have a workflow model!
      // Let's make an API call to fetch candidates, and then search workflows for them!
      // Wait, let's make a quick custom endpoint or query candidates and then load active workflows.
      // Let's fetch all workflows by listing the candidate collection, and we can query each workflow.
      // Wait! Let's verify what Express endpoints we have for workflows:
      // - GET /workflow/:id
      // - POST /workflow/start
      // - POST /workflow/retry
      // - POST /workflow/approve
      // This means we have a Mongoose query for each workflow by ID. To get the list,
      // we can do a populate query on candidates or fetch candidate logs.
      // Let's query candidates and check their workflows.
      // Wait! Can we call candidates list, and for each candidate, we fetch their workflow details?
      // Yes! That is extremely easy. Or wait! Can we make the candidates table list populate their workflows?
      // Let's check candidateController: `getCandidates` does a `populate('job_id')`. It doesn't populate workflows.
      // But we can fetch workflow details using the candidate's name or query. Let's write a backend route or query
      // workflow for the selected candidate. Let's see:
      // When recruiter opens this page, we can inspect a candidate by passing `candidateId` in searchParams.
      // If a candidateId searchParam is present, we set it as active and load that candidate's workflow details.
      
      setWorkflows(cands);

      // Auto-select candidate from search params
      const paramCandidateId = selectCandidateId || searchParams.get('candidateId');
      if (paramCandidateId && cands.length > 0) {
        // Find matching workflow
        // Let's search candidates for this candidate ID
        const match = cands.find(c => c._id === paramCandidateId);
        if (match) {
          // We can fetch details for this workflow
          // Wait, how do we get the workflow ID from candidate?
          // We can call GET /api/workflow/by-candidate/:candidateId or start workflow
          // Let's see, if we trigger POST /api/workflow/start, it returns the workflow ID if it exists!
          const startRes = await fetch(`${apiBaseUrl}/workflow/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({ candidateId: match._id, jobId: match.job_id?._id })
          });
          const startData = await startRes.json();
          const flowId = startData.workflowId || (startData.error && startData.error.includes('exists') ? startData.error.split(' ').pop() : null);
          
          // Let's see: the start workflow controller returns 400 with workflowId if already exists
          // We should look at our startWorkflow controller in workflowController.js:
          // `return res.status(400).json({ success: false, error: 'Workflow already exists for this application.', workflowId: workflow._id });`
          // Perfect! It returns workflowId!
          
          if (startData.workflowId) {
            setSelectedWorkflowId(startData.workflowId);
          } else if (startRes.status === 400 && startData.workflowId) {
            setSelectedWorkflowId(startData.workflowId);
          } else {
            // Let's look up the workflow ID by fetching it or calling details
            // We can search the database. Let's find the workflow by calling our endpoint or listing.
            // If the backend has workflowId, we can load it. Let's query it!
            setSelectedWorkflowId(startData.workflowId);
          }
        }
      } else if (cands.length > 0) {
        // Default select first
        const firstCand = cands[0];
        const startRes = await fetch(`${apiBaseUrl}/workflow/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ candidateId: firstCand._id, jobId: firstCand.job_id?._id })
        });
        const startData = await startRes.json();
        if (startData.workflowId) {
          setSelectedWorkflowId(startData.workflowId);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingList(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        loadWorkflows();
      }
    }
  }, [loading, isAuthenticated, router]);

  // Load workflow logs and telemetry states
  const loadWorkflowDetails = async (flowId) => {
    if (!flowId) return;
    setFetchingDetail(true);
    setError('');
    setActionSuccess('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/workflow/${flowId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load workflow telemetry');
      setWorkflowDetail(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetchingDetail(false);
    }
  };

  useEffect(() => {
    if (selectedWorkflowId) {
      loadWorkflowDetails(selectedWorkflowId);
    }
  }, [selectedWorkflowId]);

  // Approve or Reject candidate at checkpoint
  const handleApprovalAction = async (approved) => {
    if (!selectedWorkflowId) return;
    setSubmittingAction(true);
    setError('');
    setActionSuccess('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/workflow/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          workflowId: selectedWorkflowId,
          approved,
          notes: approvedNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit approval choice');
      
      setActionSuccess(approved ? 'Candidate approved! Running next steps...' : 'Candidate rejected. Sending notification...');
      setApprovedNotes('');
      
      // Reload details after short delay to let engine transition
      setTimeout(() => {
        loadWorkflowDetails(selectedWorkflowId);
        loadWorkflows(workflowDetail?.workflow?.candidate_id?._id);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Retry failed workflow
  const handleRetryWorkflow = async () => {
    if (!selectedWorkflowId) return;
    setSubmittingAction(true);
    setError('');
    setActionSuccess('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/workflow/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ workflowId: selectedWorkflowId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit workflow retry request');
      
      setActionSuccess('Workflow retry initiated successfully. Reloading telemetry...');
      
      setTimeout(() => {
        loadWorkflowDetails(selectedWorkflowId);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSelectCandidate = async (cand) => {
    setFetchingDetail(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const startRes = await fetch(`${apiBaseUrl}/workflow/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ candidateId: cand._id, jobId: cand.job_id?._id })
      });
      const startData = await startRes.json();
      // If exists, returns workflowId
      setSelectedWorkflowId(startData.workflowId);
    } catch (e) {
      setError('Could not start or fetch workflow for candidate');
    } finally {
      setFetchingDetail(false);
    }
  };

  if (loading || !isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 flex flex-col">
      <div className="border-b border-slate-200 pb-5 mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl tracking-tight">
            Workflow Telemetry
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit agent logs, trace checkpoint decisions, and review technical rubrics in real-time.
          </p>
        </div>
        <button
          onClick={() => loadWorkflowDetails(selectedWorkflowId)}
          className="rounded-lg p-2 text-slate-500 border border-slate-200 bg-white hover:bg-slate-50"
          title="Refresh Current Telemetry"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 items-start">
        {/* Sidebar: List candidates */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm lg:col-span-1 min-h-[500px]">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-xs text-slate-500 uppercase tracking-wider">
            Applicant Pipelines
          </div>
          
          {fetchingList ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-lg"></div>
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">
              No applicants found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {workflows.map((cand) => {
                const isActive = workflowDetail?.workflow?.candidate_id?._id === cand._id;
                return (
                  <button
                    key={cand._id}
                    onClick={() => handleSelectCandidate(cand)}
                    className={`w-full text-left p-4 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                      isActive ? 'bg-blue-50/50 hover:bg-blue-50/70 border-r-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{cand.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{cand.job_id?.title || 'Unknown Role'}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Main telemetry details */}
        <div className="lg:col-span-3 space-y-6">
          {fetchingDetail ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm flex items-center justify-center min-h-[400px]">
              <div className="flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-sm font-semibold text-slate-500">Retrieving agent logs...</p>
              </div>
            </div>
          ) : !workflowDetail ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 shadow-sm text-center min-h-[400px] flex flex-col items-center justify-center">
              <GitFork className="h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No Telemetry Selected</h3>
              <p className="mt-2 text-sm text-slate-500">Select an applicant from the sidebar to inspect their execution state.</p>
            </div>
          ) : (
            <>
              {/* Candidate Info Header */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950">{workflowDetail.workflow?.candidate_id?.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Job: <strong>{workflowDetail.workflow?.job_id?.title}</strong> | Status: 
                    <span className={`ml-1.5 inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${
                      workflowDetail.workflow?.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                      workflowDetail.workflow?.status === 'waiting_approval' ? 'bg-amber-50 text-amber-700 animate-pulse' :
                      workflowDetail.workflow?.status === 'failed' ? 'bg-red-50 text-red-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {workflowDetail.workflow?.status.replace('_', ' ')}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">AI Match Score</span>
                    <strong className="text-xl font-black text-slate-800">{workflowDetail.workflow?.candidate_id?.match_score || 0}%</strong>
                  </div>
                </div>
              </div>

              {/* Action Success / Error alert */}
              {actionSuccess && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 flex items-start gap-2.5">
                  <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Checkpoint approval box */}
              {workflowDetail.workflow?.status === 'waiting_approval' && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-bold text-amber-950 text-sm">Recruiter Approval Needed</h4>
                      <p className="text-xs text-amber-800 mt-1">
                        The candidate's score is {workflowDetail.workflow?.candidate_id?.match_score || 0}%. The LangGraph workflow is paused at the human checkpoint. Please verify their qualifications and approve or reject.
                      </p>

                      <div className="mt-4">
                        <textarea
                          rows={2}
                          value={approvedNotes}
                          onChange={(e) => setApprovedNotes(e.target.value)}
                          className="block w-full rounded-lg border border-amber-300 bg-white/85 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:outline-none sm:text-xs"
                          placeholder="Provide decision justification or notes..."
                        />
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => handleApprovalAction(true)}
                          disabled={submittingAction}
                          className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-4 py-2"
                        >
                          Approve Candidate
                        </button>
                        <button
                          onClick={() => handleApprovalAction(false)}
                          disabled={submittingAction}
                          className="rounded-lg border border-amber-300 bg-white text-slate-800 hover:bg-slate-50 font-semibold text-xs px-4 py-2"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Failed step retry box */}
              {workflowDetail.workflow?.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-950 text-sm">Execution Interrupted</h4>
                      <p className="text-xs text-red-700 mt-1">
                        The workflow halted during the <strong>{workflowDetail.workflow?.current_state}</strong> node. Please check your system logs and trigger a retry.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRetryWorkflow}
                    disabled={submittingAction}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 shrink-0"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Retry Failed Step
                  </button>
                </div>
              )}

              {/* React Flow visualization canvas */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm mb-4">React Flow Canvas State</h4>
                <WorkflowGraph
                  workflow={workflowDetail.workflow}
                  logs={workflowDetail.logs}
                  steps={workflowDetail.executionOrder}
                  colors={workflowDetail.colors}
                />
              </div>

              {/* Technical Rubrics Tabs */}
              {workflowDetail.workflow?.candidate_id?.interview_material && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    Tailored Technical Interview Rubrics
                  </h4>
                  
                  <div className="space-y-4 divide-y divide-slate-100">
                    <div className="pb-4">
                      <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Interview Questions</span>
                      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-2">
                        {workflowDetail.workflow?.candidate_id?.interview_material.questions?.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="py-4">
                      <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Coding Task</span>
                      <h5 className="font-semibold text-slate-900 text-sm">{workflowDetail.workflow?.candidate_id?.interview_material.coding_task?.title}</h5>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                        {workflowDetail.workflow?.candidate_id?.interview_material.coding_task?.description}
                      </p>
                      <p className="text-xs text-slate-600 mt-2">
                        <strong>Solution Criteria:</strong> {workflowDetail.workflow?.candidate_id?.interview_material.coding_task?.solution_criteria}
                      </p>
                    </div>

                    <div className="pt-4">
                      <span className="text-xs font-bold text-slate-400 block mb-2 uppercase">Evaluation Rubric Matrix</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workflowDetail.workflow?.candidate_id?.interview_material.rubric?.map((rub, idx) => (
                          <div key={idx} className="border border-slate-150 rounded-lg p-3 bg-slate-50/50">
                            <strong className="text-xs text-slate-800 uppercase block font-semibold">{rub.key?.replace(/_/g, ' ')}</strong>
                            <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">{rub.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Outbox Template preview */}
              {workflowDetail.workflow?.state_data?.email_agent && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Outbound Email Dispatch Preview
                  </h4>
                  
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 text-xs text-slate-600 space-y-1">
                      <p><strong>Subject:</strong> {workflowDetail.workflow?.state_data?.email_agent.subject}</p>
                      <p><strong>Recipient:</strong> {workflowDetail.workflow?.candidate_id?.email}</p>
                      <p><strong>Status:</strong> {workflowDetail.workflow?.candidate_id?.email_sent ? 'Sent via API' : 'Logged fallback'}</p>
                    </div>
                    <div className="p-6 bg-white overflow-y-auto max-h-48 text-sm">
                      <div dangerouslySetInnerHTML={{ __html: workflowDetail.workflow?.state_data?.email_agent.html }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Full Timeline execution log */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm mb-6 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Agent Telemetry Logs
                </h4>
                
                <div className="flow-root">
                  <ul className="-mb-8">
                    {workflowDetail.logs.map((log, index) => {
                      const isLast = index === workflowDetail.logs.length - 1;
                      const isSuccess = log.status === 'success';
                      const isWaiting = log.status === 'waiting_approval';
                      
                      return (
                        <li key={log._id}>
                          <div className="relative pb-8">
                            {!isLast && (
                              <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                  isSuccess ? 'bg-emerald-500 text-white' :
                                  isWaiting ? 'bg-amber-500 text-white' :
                                  log.status === 'failed' ? 'bg-red-500 text-white' :
                                  'bg-blue-500 text-white'
                                }`}>
                                  {isSuccess ? <Check className="h-4 w-4" /> :
                                   isWaiting ? <Clock className="h-4 w-4" /> :
                                   log.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                                   <RefreshCw className="h-4 w-4 animate-spin" />}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="text-sm font-semibold text-slate-800 capitalize">
                                    {log.agent_name.replace(/_/g, ' ')}
                                  </p>
                                  <div className="text-right text-xs text-slate-400">
                                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </div>
                                </div>
                                <div className="mt-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-lg overflow-x-auto max-h-24">
                                  {log.error ? (
                                    <span className="text-red-600 font-bold">Error: {log.error}</span>
                                  ) : (
                                    <pre className="font-mono text-[10px] whitespace-pre-wrap">{JSON.stringify(log.output || log.input, null, 2)}</pre>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Workflows() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <WorkflowsContent />
    </Suspense>
  );
}
