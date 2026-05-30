'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import { GitFork, Shield, Sparkles, Brain, Cpu, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-semibold text-slate-500">Checking credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-white">
      {/* Background Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[120px]"></div>
        <div className="absolute top-1/2 right-0 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2 text-xl font-bold">
            <GitFork className="h-6 w-6 stroke-[2.5] text-blue-400" />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">AgentHire</span>
          </div>
          <Link
            href="/login"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 hover:border-white/30 transition-all"
          >
            Recruiter Sign In
          </Link>
        </header>

        {/* Hero Section */}
        <main className="grid min-h-[calc(100vh-80px)] grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2">
          <div className="flex flex-col gap-6 text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              <Sparkles className="h-3 w-3" />
              Spec-Driven Recruitment Automation
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
              Next-Gen{' '}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Agentic Recruiter
              </span>{' '}
              Workspace
            </h1>
            
            <p className="text-lg text-slate-400">
              Build explainable, resume-to-offer recruitment flows driven by LangGraph AI agents. Parse files, run RAG scoring, generate interview questions, and coordinate recruiter approvals.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold shadow-md hover:bg-blue-500 transition-all"
              >
                Start Hiring Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold hover:bg-white/10 transition-all"
              >
                Access Recruiter Console
              </Link>
            </div>
          </div>

          {/* Graphics/Features Column */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:p-8">
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <Brain className="mb-4 h-8 w-8 text-blue-400" />
              <h3 className="text-lg font-bold">Multi-Agent Workflow</h3>
              <p className="mt-2 text-sm text-slate-400">
                Cooperating LLM agents perform parsing, vector embeddings, skills comparison, and scoring.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <Cpu className="mb-4 h-8 w-8 text-indigo-400" />
              <h3 className="text-lg font-bold">LangGraph Orchestrated</h3>
              <p className="mt-2 text-sm text-slate-400">
                Stateful graphs with error retries, recruiter checkpoint pauses, and canvas visualization.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <Shield className="mb-4 h-8 w-8 text-emerald-400" />
              <h3 className="text-lg font-bold">Spec-Driven (SDD)</h3>
              <p className="mt-2 text-sm text-slate-400">
                Hiring thresholds, templates, prompts, and system policies load dynamically from central files.
              </p>
            </div>
            
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur-sm">
              <GitFork className="mb-4 h-8 w-8 text-pink-400" />
              <h3 className="text-lg font-bold">React Flow Visuals</h3>
              <p className="mt-2 text-sm text-slate-400">
                Watch candidates travel through state nodes color-coded in real-time.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
