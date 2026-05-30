'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../../../store/useAuthStore';
import { Briefcase, ArrowLeft, PlusCircle, AlertCircle, X, Check } from 'lucide-react';
import Link from 'next/link';

export default function CreateJob() {
  const router = useRouter();
  const { isAuthenticated, initialize, loading, getAuthHeaders } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minExperience, setMinExperience] = useState(2);
  const [workflowSpec, setWorkflowSpec] = useState('default-hiring-workflow');
  const [hiringSpec, setHiringSpec] = useState('frontend-developer');

  // Interactive skill lists
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [requiredSkills, setRequiredSkills] = useState(['React', 'JavaScript', 'CSS']);
  const [prefSkillInput, setPrefSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState(['Next.js', 'Tailwind CSS']);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const handleAddRequiredSkill = (e) => {
    e.preventDefault();
    const skill = reqSkillInput.trim();
    if (skill && !requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
      setReqSkillInput('');
    }
  };

  const handleRemoveRequiredSkill = (skillToRemove) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skillToRemove));
  };

  const handleAddPreferredSkill = (e) => {
    e.preventDefault();
    const skill = prefSkillInput.trim();
    if (skill && !preferredSkills.includes(skill)) {
      setPreferredSkills([...preferredSkills, skill]);
      setPrefSkillInput('');
    }
  };

  const handleRemovePreferredSkill = (skillToRemove) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (requiredSkills.length === 0) {
      setError('Please add at least one required skill.');
      return;
    }

    setSubmitting(true);

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBaseUrl}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title,
          description,
          required_skills: requiredSkills,
          preferred_skills: preferredSkills,
          min_experience: Number(minExperience),
          workflow_spec_id: workflowSpec,
          hiring_spec_id: hiringSpec
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create job posting');

      router.push('/dashboard/jobs');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 sm:p-10">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-5 mb-8">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">Create Job Posting</h2>
            <p className="text-sm text-slate-500">Configure evaluation specifications and candidate requirements.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700">
              Job Title
            </label>
            <input
              type="text"
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-950 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., Senior React Developer"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-950 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              placeholder="Provide a description of the responsibilities, project scopes, and day-to-day items."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="minExperience" className="block text-sm font-semibold text-slate-700">
                Min Experience (Years)
              </label>
              <input
                type="number"
                id="minExperience"
                min={0}
                required
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3.5 py-2 text-slate-950 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="workflowSpec" className="block text-sm font-semibold text-slate-700">
                Workflow Specification
              </label>
              <select
                id="workflowSpec"
                value={workflowSpec}
                onChange={(e) => setWorkflowSpec(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              >
                <option value="default-hiring-workflow">Default Hiring (7 Agents)</option>
              </select>
            </div>

            <div>
              <label htmlFor="hiringSpec" className="block text-sm font-semibold text-slate-700">
                Hiring Template spec
              </label>
              <select
                id="hiringSpec"
                value={hiringSpec}
                onChange={(e) => setHiringSpec(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-950 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              >
                <option value="frontend-developer">Frontend Developer (Required: React, JS, CSS)</option>
              </select>
            </div>
          </div>

          {/* Required Skills Chip Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Required Skills
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={reqSkillInput}
                onChange={(e) => setReqSkillInput(e.target.value)}
                className="block flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-slate-950 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Press Add to append skill"
              />
              <button
                type="button"
                onClick={handleAddRequiredSkill}
                className="rounded-lg border border-blue-600 bg-white text-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-50"
              >
                Add
              </button>
            </div>
            {/* Skill Preview Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {requiredSkills.map((skill, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
                  {skill}
                  <button type="button" onClick={() => handleRemoveRequiredSkill(skill)} className="text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-100 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Preferred Skills Chip Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700">
              Preferred Skills
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={prefSkillInput}
                onChange={(e) => setPrefSkillInput(e.target.value)}
                className="block flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-slate-950 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="Press Add to append skill"
              />
              <button
                type="button"
                onClick={handleAddPreferredSkill}
                className="rounded-lg border border-slate-300 bg-white text-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Add
              </button>
            </div>
            {/* Skill Preview Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {preferredSkills.map((skill, index) => (
                <span key={index} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200">
                  {skill}
                  <button type="button" onClick={() => handleRemovePreferredSkill(skill)} className="text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              href="/dashboard/jobs"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {submitting ? 'Creating Posting...' : 'Publish Job Posting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
