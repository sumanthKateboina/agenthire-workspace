const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');
const Job = require('../src/models/Job');

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/agenthire_test';

beforeAll(async () => {
  // Connect to test DB
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

afterAll(async () => {
  // Clean up collections and close connection
  try {
    await User.deleteMany({});
    await Job.deleteMany({});
    await mongoose.connection.close();
  } catch (e) {
    console.error('Test DB cleanup error:', e.message);
  }
});

describe('AgentHire API Endpoints Integration Tests', () => {
  let token = '';
  let recruiterId = '';
  let jobId = '';

  const testRecruiter = {
    name: 'Test Recruiter',
    email: `recruiter-${Date.now()}@example.com`,
    password: 'password123'
  };

  test('POST /api/auth/signup - Should register a new recruiter', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send(testRecruiter);

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
    
    token = res.body.data.token;
    recruiterId = res.body.data._id;
  });

  test('POST /api/auth/login - Should authenticate and issue JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testRecruiter.email,
        password: testRecruiter.password
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('GET /api/auth/me - Should retrieve profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toEqual(testRecruiter.email);
  });

  test('POST /api/jobs - Should create a job posting with valid token', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Software Engineer',
        description: 'Design and write clean software code.',
        required_skills: ['JavaScript', 'HTML'],
        preferred_skills: ['Git'],
        min_experience: 1
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toEqual('Software Engineer');
    
    jobId = res.body.data._id;
  });

  test('GET /api/jobs - Should retrieve jobs publicly without token', async () => {
    const res = await request(app)
      .get('/api/jobs');

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/jobs/:id - Should retrieve job detail publicly', async () => {
    const res = await request(app)
      .get(`/api/jobs/${jobId}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toEqual('Software Engineer');
  });
});
