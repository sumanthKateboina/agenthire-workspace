const { z } = require('zod');

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['recruiter', 'admin']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email'),
  password: z.string().min(1, 'Password is required')
});

const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  required_skills: z.array(z.string()).min(1, 'At least one required skill is needed'),
  preferred_skills: z.array(z.string()).optional().default([]),
  min_experience: z.number().nonnegative('Experience cannot be negative'),
  workflow_spec_id: z.string().optional().default('default-hiring-workflow'),
  hiring_spec_id: z.string().optional().default('frontend-developer')
});

const approveWorkflowSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  approved: z.boolean(),
  notes: z.string().optional()
});

module.exports = {
  signupSchema,
  loginSchema,
  createJobSchema,
  approveWorkflowSchema
};
