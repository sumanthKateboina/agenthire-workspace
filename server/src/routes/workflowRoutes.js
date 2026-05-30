const express = require('express');
const { startWorkflow, retryWorkflow, approveWorkflow, getWorkflowDetails } = require('../controllers/workflowController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { approveWorkflowSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/start', protect, startWorkflow);
router.post('/retry', protect, retryWorkflow);
router.post('/approve', protect, validate(approveWorkflowSchema), approveWorkflow);
router.get('/:id', protect, getWorkflowDetails);

module.exports = router;
