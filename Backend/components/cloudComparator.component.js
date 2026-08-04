const express = require('express');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const cloudComparatorController = require('../controllers/cloudComparator.controller');

const router = express.Router();

router.post('/submit', cloudComparatorController.submit);

router.get('/admin', ClerkExpressRequireAuth(), cloudComparatorController.listAdmin);
router.patch('/admin/:id/status', ClerkExpressRequireAuth(), cloudComparatorController.updateStatus);
router.patch('/admin/:id/notas', ClerkExpressRequireAuth(), cloudComparatorController.updateNotas);

module.exports = router;
