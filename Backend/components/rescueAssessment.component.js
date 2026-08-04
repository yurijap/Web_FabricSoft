const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/rescueAssessment.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

router.get('/questions', ctrl.getQuestionSet);
router.post('/submit', ctrl.submit);

router.get('/admin', ClerkExpressRequireAuth(), ctrl.listar);
router.put('/admin/questions', ClerkExpressRequireAuth(), ctrl.updateQuestionSet);
router.put('/admin/questions/reset', ClerkExpressRequireAuth(), ctrl.resetQuestionSet);

module.exports = router;
