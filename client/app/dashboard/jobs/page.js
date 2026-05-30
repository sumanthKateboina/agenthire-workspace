'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../../store/useAuthStore';
import { Briefcase, Copy, Check, Plus, AlertCircle, Calendar, Users, ExternalLink } from 'lucide-react';

export default function JobsList() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading, getAuthHeaders } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const loadJobs = async () => {
    setFetching(true);
    setError('');
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/jobs`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load jobs');
      setJobs(data.data || []);
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
        loadJobs();
      }
    }
  }, [loading, isAuthenticated, router]);

  const handleCopyLink = (jobId) => {
    const applyUrl = `${window.location.origin}/jobs/${jobId}/apply`;
    navigator.clipboard.writeText(applyUrl);
    setCopiedId(jobId);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
            Job Postings
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Create jobs, manage parameters, and retrieve applicant pipelines.
          </p>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/dashboard/jobs/create"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Posting
          </Link>
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse h-40 bg-white border border-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center bg-white border border-slate-200 rounded-xl p-12 shadow-sm max-w-lg mx-auto mt-10">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-sm font-semibold text-slate-900">No job postings created</h3>
          <p className="mt-2 text-sm text-slate-500">Get started by creating your first recruitment position.</p>
          <div className="mt-6">
            <Link
              href="/dashboard/jobs/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <Plus className="h-4 w-4" />
              Create Job
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 shrink-0">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1">{job.title}</h3>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">Min Experience: {job.min_experience} yrs</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500 line-clamp-3 min-h-[60px]">{job.description}</p>

                {/* Skills Preview */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {job.required_skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {skill}
                    </span>
                  ))}
                  {job.required_skills.length > 3 && (
                    <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-slate-600/10">
                      +{job.required_skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Card Footer actions */}
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <Link
                  href={`/jobs/${job._id}`}
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Page
                </Link>
                <button
                  onClick={() => handleCopyLink(job._id)}
                  className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-bold transition-all ${
                    copiedId === job._id
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  {copiedId === job._id ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Apply URL
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
