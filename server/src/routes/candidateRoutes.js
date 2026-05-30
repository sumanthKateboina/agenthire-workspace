const express = require('express');
const { uploadCandidate, getCandidates, getCandidate } = require('../controllers/candidateController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.post('/upload', upload.single('resume'), uploadCandidate);
router.get('/', protect, getCandidates);
router.get('/:id', protect, getCandidate);

module.exports = router;
