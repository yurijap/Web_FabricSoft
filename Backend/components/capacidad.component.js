const express = require('express');
const router = express.Router();
const capacidadController = require('../controllers/capacidad.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público — s15 lee el estado de capacidad
router.get('/', capacidadController.get);

// Admin
router.put('/',               ClerkExpressRequireAuth(), capacidadController.update);
router.patch('/slot/:id',     ClerkExpressRequireAuth(), capacidadController.updateSlot);

module.exports = router;
