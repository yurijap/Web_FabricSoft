const express = require('express');
const router = express.Router();
const i18nController = require('../controllers/i18n.controller');

router.post('/translate', i18nController.translate);

module.exports = router;
