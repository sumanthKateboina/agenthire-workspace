const mongoose = require('mongoose');
const path = require('path');

// Set env variables manually if needed
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/agenthire';

const User = require('../server/src/models/User');
const Job = require('../server/src/models/Job');

const seedAndGetLink = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Ensure Recruiter Exists
    let recruiter = await User.findOne({ email: 'recruiter@example.com' });
    if (!recruiter) {
      recruiter = await User.create({
        name: 'Default Recruiter',
        email: 'recruiter@example.com',
        password: 'password123', // Will be hashed by pre-save middleware
        role: 'recruiter'
      });
      console.log('Created default recruiter account: recruiter@example.com / password123');
    } else {
      console.log('Default recruiter account already exists.');
    }

    // 2. Ensure Job Exists
    let job = await Job.findOne({ title: 'Frontend Developer' });
    if (!job) {
      job = await Job.create({
        title: 'Frontend Developer',
        description: 'We are seeking a Frontend Developer to build clean interfaces with React, CSS, and JavaScript. You will contribute to our user-facing platforms and work with modern layout architectures.',
        required_skills: ['React', 'JavaScript', 'CSS'],
        preferred_skills: ['Next.js', 'Tailwind CSS'],
        min_experience: 2,
        workflow_spec_id: 'default-hiring-workflow',
        hiring_spec_id: 'frontend-developer',
        creator: recruiter._id
      });
      console.log('Created Frontend Developer job posting.');
    } else {
      console.log('Frontend Developer job posting already exists.');
    }

    const applyUrl = `http://localhost:3000/jobs/${job._id}/apply`;
    const detailsUrl = `http://localhost:3000/jobs/${job._id}`;

    console.log('\n====================================================================');
    console.log('AGENTHIRE DEMO ENVIRONMENT SUCCESSFULLY SEEDED');
    console.log('====================================================================');
    console.log('Recruiter Login Credentials:');
    console.log('  Email:    recruiter@example.com');
    console.log('  Password: password123');
    console.log('--------------------------------------------------------------------');
    console.log('Public Job Detail Page:');
    console.log(`  ${detailsUrl}`);
    console.log('Public Candidate Apply Link:');
    console.log(`  ${applyUrl}`);
    console.log('====================================================================\n');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error during seeding:', error.message);
    process.exit(1);
  }
};

seedAndGetLink();
