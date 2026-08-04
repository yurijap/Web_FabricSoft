const express = require('express');
const erpTcoController = require('../controllers/erpTco.controller');

const router = express.Router();

router.post('/calculate', erpTcoController.calculate);

module.exports = router;
