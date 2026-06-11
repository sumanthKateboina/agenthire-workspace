'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '../../store/useAuthStore';
import { 
  Users, Briefcase, GitFork, CheckCircle, Clock, 
  ArrowUpRight, AlertCircle, PlusCircle, RefreshCw, BarChart2
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading, logout, getAuthHeaders } = useAuthStore();
  
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [fetchError, setFetchError] = useState('');
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadDashboardData = async () => {
    setFetching(true);
    setFetchError('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      // 1. Fetch Analytics
      const analRes = await fetch(`${apiBaseUrl}/analytics`, { headers });
      if (analRes.status === 401) {
        logout();
        router.push('/login');
        return;
      }
      if (!analRes.ok) throw new Error('Failed to load system analytics.');
      const analData = await analRes.json();

      // 2. Fetch Jobs
      const jobsRes = await fetch(`${apiBaseUrl}/jobs`, { headers });
      if (jobsRes.status === 401) {
        logout();
        router.push('/login');
        return;
      }
      if (!jobsRes.ok) throw new Error('Failed to retrieve job database.');
      const jobsData = await jobsRes.json();

      // 3. Fetch Candidates
      const candRes = await fetch(`${apiBaseUrl}/candidates`, { headers });
      if (candRes.status === 401) {
        logout();
        router.push('/login');
        return;
      }
      if (!candRes.ok) throw new Error('Failed to retrieve candidate database.');
      const candData = await candRes.json();

      setStats(analData.data);
      setJobs(jobsData.data || []);
      setCandidates(candData.data || []);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        loadDashboardData();
      }
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const recentCandidates = candidates.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8 border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl tracking-tight">
            Recruiter Console
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Real-time pipeline monitoring and agent telemetry.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
          <button
            onClick={loadDashboardData}
            disabled={fetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/dashboard/jobs/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <PlusCircle className="h-4 w-4" />
            Create Job
          </Link>
        </div>
      </div>

      {fetchError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* Grid of Stats */}
      {fetching && !stats ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-28 bg-white border border-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Pipeline Candidates</p>
                <h4 className="text-3xl font-bold text-slate-900 mt-2">{stats.candidates.total}</h4>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Job Postings</p>
                <h4 className="text-3xl font-bold text-slate-900 mt-2">{jobs.length}</h4>
              </div>
              <div className="rounded-lg bg-indigo-50 p-3 text-indigo-600">
                <Briefcase className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Workflow Shortlist Rate</p>
                <h4 className="text-3xl font-bold text-slate-900 mt-2">{stats.candidates.shortlistRate}%</h4>
              </div>
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Awaiting Checkpoint</p>
                <h4 className="text-3xl font-bold text-slate-900 mt-2">{stats.workflows.waitingApproval}</h4>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>
        )
      )}

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Recent applicants */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Recent Applications</h3>
              <Link href="/dashboard/candidates" className="text-xs font-semibold text-blue-600 hover:text-blue-500 inline-flex items-center gap-0.5">
                View all candidates
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="divide-y divide-slate-100">
              {recentCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No applications received yet. Copy the public application link from a job posting to submit resumes.
                </div>
              ) : (
                recentCandidates.map((cand) => (
                  <div key={cand._id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h5 className="font-semibold text-slate-800 text-sm">{cand.name}</h5>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>{cand.job_id?.title || 'Unknown Role'}</span>
                        <span>•</span>
                        <span>Score: <strong className="text-slate-800">{cand.match_score || 0}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
                        cand.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        cand.status === 'hold' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                        cand.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-blue-50 text-blue-700 ring-blue-600/20'
                      }`}>
                        {cand.status}
                      </span>
                      <Link
                        href={`/dashboard/workflows?candidateId=${cand._id}`}
                        className="rounded bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
                      >
                        Inspect Flow
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Workflow Telemetry summary */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">Workflow Execution</h3>
            
            {stats ? (
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm font-medium mb-1">
                    <span className="text-slate-500">Completion Success Rate</span>
                    <span className="text-slate-800 font-bold">{stats.workflows.completionRate}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.workflows.completionRate}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 text-center">
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Completed</span>
                    <strong className="text-lg font-bold text-slate-800 block mt-1">{stats.workflows.completed}</strong>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Failed</span>
                    <strong className="text-lg font-bold text-slate-800 block mt-1">{stats.workflows.failed}</strong>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Running: <strong>{stats.workflows.running}</strong>
                  </span>
                  <span>Total started: <strong>{stats.workflows.total}</strong></span>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-sm">
                Telemetry stats loading...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
