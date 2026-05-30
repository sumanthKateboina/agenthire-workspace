'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../../store/useAuthStore';
import { 
  BarChart3, TrendingUp, CheckCircle, AlertTriangle, 
  HelpCircle, Users, Cpu, GitFork, RefreshCw, AlertCircle
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading, getAuthHeaders } = useAuthStore();

  const [analytics, setAnalytics] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadAnalytics = async () => {
    setFetching(true);
    setError('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/analytics`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch analytics');
      setAnalytics(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        loadAnalytics();
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

  const agentsList = [
    'resume_parser', 'embedding_agent', 'matching_agent', 
    'shortlisting_agent', 'human_approval', 'interview_agent', 'email_agent'
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8 border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl tracking-tight">
            System Analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Audit hiring conversion rates and individual agent node telemetry performance.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={loadAnalytics}
            disabled={fetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {fetching && !analytics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-36 bg-white border border-slate-200 rounded-xl"></div>
            ))}
          </div>
          <div className="animate-pulse h-80 bg-white border border-slate-200 rounded-xl"></div>
        </div>
      ) : (
        analytics && (
          <div className="space-y-8">
            {/* High-level cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Funnel Stats */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                  <Users className="h-4 w-4 text-blue-600" />
                  Hiring Funnel Status
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 border border-slate-100 rounded-lg bg-emerald-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Shortlisted</span>
                    <strong className="text-xl font-extrabold text-emerald-700 block mt-1">{analytics.candidates.shortlisted}</strong>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg bg-amber-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Hold</span>
                    <strong className="text-xl font-extrabold text-amber-700 block mt-1">{analytics.candidates.hold}</strong>
                  </div>
                  <div className="p-2 border border-slate-100 rounded-lg bg-red-50/50">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Rejected</span>
                    <strong className="text-xl font-extrabold text-red-700 block mt-1">{analytics.candidates.rejected}</strong>
                  </div>
                </div>
              </div>

              {/* Conversion rates */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Conversion Rates
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400">Pipeline Shortlist Rate</span>
                    <strong className="text-2xl font-black text-slate-800 mt-1 block">{analytics.candidates.shortlistRate}%</strong>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-blue-100 border-t-blue-600 flex items-center justify-center font-bold text-xs">
                    {analytics.candidates.shortlistRate}%
                  </div>
                </div>
              </div>

              {/* Engine Health */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-2 text-slate-400 font-medium text-sm">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  Workflow Completion
                </div>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400">Telemetry Success Rate</span>
                    <strong className="text-2xl font-black text-slate-800 mt-1 block">{analytics.workflows.completionRate}%</strong>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 flex items-center justify-center font-bold text-xs">
                    {analytics.workflows.completionRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Telemetry Matrix */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Agent Node Success Matrix
              </h3>

              <div className="space-y-6">
                {agentsList.map((agentName) => {
                  const metric = analytics.agentMetrics[agentName] || { success: 0, failed: 0, waiting_approval: 0, running: 0 };
                  const total = metric.success + metric.failed + metric.waiting_approval + metric.running;
                  const successPct = total > 0 ? Math.round((metric.success / total) * 100) : 0;
                  const label = agentName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                  return (
                    <div key={agentName} className="grid grid-cols-1 md:grid-cols-4 items-center gap-4">
                      <div className="min-w-0 md:col-span-1">
                        <strong className="text-sm font-semibold text-slate-800 block truncate">{label}</strong>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Total runs: {total}</span>
                      </div>

                      <div className="md:col-span-2">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${total > 0 ? (metric.success / total) * 100 : 0}%` }}
                            title={`Success: ${metric.success}`}
                          ></div>
                          <div 
                            className="bg-amber-500 h-full" 
                            style={{ width: `${total > 0 ? (metric.waiting_approval / total) * 100 : 0}%` }}
                            title={`Awaiting: ${metric.waiting_approval}`}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${total > 0 ? (metric.failed / total) * 100 : 0}%` }}
                            title={`Failed: ${metric.failed}`}
                          ></div>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end gap-3 text-xs">
                        <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {metric.success} OK
                        </span>
                        {metric.failed > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-red-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {metric.failed} ERR
                          </span>
                        )}
                        {metric.waiting_approval > 0 && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-600">
                            <HelpCircle className="h-3.5 w-3.5" />
                            {metric.waiting_approval} WAIT
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
