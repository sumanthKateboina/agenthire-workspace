const fs = require('fs');
const path = require('path');

const SPECS_DIR = path.join(__dirname, '../../../specs');

/**
 * Loads a JSON spec file by path relative to /specs
 * @param {string} relativePath e.g. 'hiring/frontend-developer.json' or 'system/retry-policy.json'
 * @returns {object} The parsed specification object
 */
const loadSpec = (relativePath) => {
  try {
    const fullPath = path.join(SPECS_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Spec file not found at ${fullPath}`);
    }
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(rawContent);
  } catch (error) {
    console.error(`Error loading spec ${relativePath}:`, error.message);
    throw error;
  }
};

/**
 * Helper to check if a spec exists
 */
const specExists = (relativePath) => {
  const fullPath = path.join(SPECS_DIR, relativePath);
  return fs.existsSync(fullPath);
};

module.exports = {
  loadSpec,
  specExists
};
