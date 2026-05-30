'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../../store/useAuthStore';
import { Users, FileText, Phone, Mail, Clock, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function CandidatesList() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading, getAuthHeaders } = useAuthStore();
  const [candidates, setCandidates] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadCandidates = async () => {
    setFetching(true);
    setError('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/candidates`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load candidates');
      setCandidates(data.data || []);
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
        loadCandidates();
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between mb-8 border-b border-slate-200 pb-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl tracking-tight">
            Candidates Database
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review parsed resume data, match suitability records, and agent shortlists.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            onClick={loadCandidates}
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

      {fetching ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 bg-white border border-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm max-w-lg mx-auto mt-10">
          <Users className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No applicants yet</h3>
          <p className="mt-2 text-sm text-slate-500">Applicants will appear here automatically when they apply to jobs.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Candidate Info</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Applied Role</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Match Score</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">hiring Decision</th>
                  <th scope="col" className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date Applied</th>
                  <th scope="col" className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {candidates.map((cand) => (
                  <tr key={cand._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {cand.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">{cand.name}</div>
                          <div className="mt-0.5 flex flex-col sm:flex-row sm:gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {cand.email}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {cand.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">{cand.job_id?.title || 'Unknown Role'}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
                      <span className={`inline-flex items-center rounded bg-slate-100 px-2 py-1 text-xs font-semibold ${
                        cand.match_score >= 80 ? 'text-emerald-700 bg-emerald-50' :
                        cand.match_score >= 60 ? 'text-amber-700 bg-amber-50' :
                        'text-red-700 bg-red-50'
                      }`}>
                        {cand.match_score || 0}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                        cand.status === 'shortlisted' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                        cand.status === 'hold' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                        cand.status === 'rejected' ? 'bg-red-50 text-red-700 ring-red-600/20' :
                        'bg-blue-50 text-blue-700 ring-blue-600/20'
                      }`}>
                        {cand.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(cand.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/workflows?candidateId=${cand._id}`}
                        className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-900 font-semibold"
                      >
                        Telemetry details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
