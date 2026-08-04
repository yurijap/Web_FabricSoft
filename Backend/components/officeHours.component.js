const express = require('express');
const router = express.Router();
const officeHoursController = require('../controllers/officeHours.controller');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

// Público
router.post('/book',                       officeHoursController.book);
router.post('/solicitar',                  officeHoursController.solicitar);
router.get('/slots-ocupados',              officeHoursController.slotsOcupados);
router.get('/disponibilidad/mes',          officeHoursController.disponibilidadMes);
router.get('/disponibilidad/dia',          officeHoursController.disponibilidadDia);

// Admin
router.get('/admin',               ClerkExpressRequireAuth(), officeHoursController.listar);
router.patch('/admin/:id/status',  ClerkExpressRequireAuth(), officeHoursController.actualizarStatus);
router.post('/admin/:id/retry-email',    ClerkExpressRequireAuth(), officeHoursController.reintentarEmail);
router.post('/admin/:id/retry-calendar', ClerkExpressRequireAuth(), officeHoursController.reintentarCalendar);

module.exports = router;
