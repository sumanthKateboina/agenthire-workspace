'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, ArrowRight, CheckCircle2, ChevronLeft, Calendar } from 'lucide-react';

export default function PublicJobDetail() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;
      setFetching(true);
      setError('');
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBaseUrl}/jobs/${jobId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Job not found');
        setJob(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  if (fetching) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <Briefcase className="h-12 w-12 text-slate-500 mb-4" />
        <h3 className="text-xl font-bold">Job Posting Unavailable</h3>
        <p className="text-sm text-slate-400 mt-2">{error || 'This job listing does not exist or has been removed.'}</p>
        <Link href="/" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 relative overflow-hidden flex flex-col justify-center">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Logo Header */}
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-2 text-lg font-bold text-blue-400">
            <Briefcase className="h-5 w-5" />
            <span>AgentHire Job Board</span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Posted {new Date(job.createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Card Body */}
        <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 sm:p-10 backdrop-blur-md shadow-2xl space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              {job.title}
            </h1>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mt-2">
              Minimum Required Experience: {job.min_experience} years
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold mb-3">Role Overview</h3>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Skill lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/10 pt-6">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Required Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {job.required_skills.map((skill, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-xs font-semibold text-blue-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.preferred_skills && job.preferred_skills.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Preferred Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.preferred_skills.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Call to action */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Applications processed securely via AI agents.</span>
            <Link
              href={`/jobs/${job._id}/apply`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold shadow-md hover:bg-blue-500 transition-all w-full sm:w-auto"
            >
              Apply to Role
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
