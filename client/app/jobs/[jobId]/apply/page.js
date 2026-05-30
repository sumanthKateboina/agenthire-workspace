'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FileText, Upload, AlertCircle, CheckCircle, ChevronLeft, 
  RefreshCw, Cpu, Brain, GitFork, User, Phone, Mail
} from 'lucide-react';

export default function CandidateApply() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId;

  const [job, setJob] = useState(null);
  const [fetchingJob, setFetchingJob] = useState(true);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);

  // Status flags
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0); // 0: input, 1: upload, 2: parsing, 3: matching, 4: checkpoint, 5: success
  const [workflowId, setWorkflowId] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBaseUrl}/jobs/${jobId}`);
        const data = await res.json();
        if (res.ok) setJob(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingJob(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF resume files are accepted.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a resume PDF file to upload.');
      return;
    }

    setSubmitting(true);
    setCurrentStep(1); // Uploading

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('job_id', jobId);
      formData.append('resume', file);

      const res = await fetch(`${apiBaseUrl}/candidates/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setWorkflowId(data.data.workflowId);

      // Simulate AI agents pipeline transitions for visual polish
      setTimeout(() => {
        setCurrentStep(2); // Parsing
        setTimeout(() => {
          setCurrentStep(3); // Embedding / Indexing
          setTimeout(() => {
            setCurrentStep(4); // Matching / Decision
            setTimeout(() => {
              setCurrentStep(5); // Human approval pause (Completed initial pipeline)
            }, 1500);
          }, 1500);
        }, 1500);
      }, 1500);

    } catch (err) {
      setError(err.message);
      setCurrentStep(0);
      setSubmitting(false);
    }
  };

  if (fetchingJob) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-xl font-bold">Position Closed</h3>
        <p className="text-sm text-slate-400 mt-2">The application window for this job posting is no longer available.</p>
        <Link href="/" className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white py-12 relative overflow-hidden flex flex-col justify-center">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]"></div>
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4 sm:px-6 lg:px-8 w-full">
        {/* Navigation back */}
        {currentStep === 0 && (
          <div className="mb-6">
            <Link href={`/jobs/${jobId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back to Job details
            </Link>
          </div>
        )}

        {/* Pipeline progress screens */}
        {currentStep > 0 && currentStep < 5 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 sm:p-10 backdrop-blur-md shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-blue-500/10 text-blue-400 ring-4 ring-blue-500/20">
                <Cpu className="h-8 w-8 animate-pulse" />
              </div>
            </div>

            <h3 className="text-xl font-bold">Processing Application</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              Our recruitment agents are auditing your profile against requirements.
            </p>

            {/* Stepper details */}
            <div className="space-y-4 text-left max-w-xs mx-auto pt-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep >= 1 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  1
                </span>
                <span className={`text-xs ${currentStep === 1 ? 'font-bold text-white' : 'text-slate-400'}`}>
                  Uploading resume PDF file...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  2
                </span>
                <span className={`text-xs ${currentStep === 2 ? 'font-bold text-white animate-pulse' : 'text-slate-400'}`}>
                  Parsing resume structure and skills...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep >= 3 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  3
                </span>
                <span className={`text-xs ${currentStep === 3 ? 'font-bold text-white animate-pulse' : 'text-slate-400'}`}>
                  Generating vector embeddings...
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep >= 4 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  4
                </span>
                <span className={`text-xs ${currentStep === 4 ? 'font-bold text-white animate-pulse' : 'text-slate-400'}`}>
                  Scoring credentials & shortlisting...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Success screen */}
        {currentStep === 5 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 sm:p-10 backdrop-blur-md shadow-2xl text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-4 ring-emerald-500/20">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>

            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Application Submitted!
            </h3>
            
            <div className="text-sm text-slate-300 max-w-sm mx-auto space-y-3 leading-relaxed">
              <p>
                Hello <strong>{name}</strong>, thank you for applying for the <strong>{job.title}</strong> role.
              </p>
              <p>
                Your profile was successfully evaluated and stored. Your matching metrics are currently under review by our hiring coordinators.
              </p>
            </div>

            <div className="border-t border-white/10 pt-6">
              <Link
                href={`/jobs/${jobId}`}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold hover:bg-blue-500 transition-all"
              >
                Back to Listings
              </Link>
            </div>
          </div>
        )}

        {/* Input Form Screen */}
        {currentStep === 0 && (
          <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 sm:p-10 backdrop-blur-md shadow-2xl space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Apply for Position</h2>
              <p className="text-xs text-blue-400 mt-1 capitalize font-semibold">{job.title}</p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-4 text-sm text-red-300 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-white/10 bg-slate-950/80 pl-10 pr-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none sm:text-sm"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-lg border border-white/10 bg-slate-950/80 pl-10 pr-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none sm:text-sm"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded-lg border border-white/10 bg-slate-950/80 pl-10 pr-3 py-2 text-white placeholder-slate-500 shadow-sm focus:border-blue-500 focus:outline-none sm:text-sm"
                      placeholder="555-0199"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Resume PDF File
                </label>
                <div className="mt-1 flex justify-center rounded-lg border-2 border-dashed border-white/10 px-6 py-6 bg-slate-950/40">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-500" />
                    <div className="mt-4 flex text-sm justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-blue-400 hover:text-blue-300 focus-within:outline-none">
                        <span>Upload a resume file</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".pdf"
                          required
                          onChange={handleFileChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">PDF file format only (Max 5MB)</p>
                  </div>
                </div>

                {file && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-blue-400 bg-blue-500/5 border border-blue-500/20 p-2.5 rounded-lg">
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="font-semibold truncate">{file.name}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 disabled:opacity-50 transition-all w-full sm:w-auto"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
