const express = require('express');
const { createJob, getJobs, getJob, updateJob } = require('../controllers/jobController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createJobSchema } = require('../validators/schemas');

const router = express.Router();

router.route('/')
  .post(protect, validate(createJobSchema), createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJob)
  .put(protect, updateJob);

module.exports = router;
