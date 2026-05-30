const dotenv = require('dotenv');
const path = require('path');

// Try loading env from root first, then from server folder
const rootEnvPath = path.join(__dirname, '../../../.env');
const localEnvPath = path.join(__dirname, '../../.env');

dotenv.config({ path: rootEnvPath });
dotenv.config({ path: localEnvPath });

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agenthire',
  JWT_SECRET: process.env.JWT_SECRET || 'agenthire_super_secret_jwt_key_123_456_789',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
