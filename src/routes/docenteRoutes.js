const express = require('express');
const router = express.Router();
const planillaController = require('../controllers/planillaController');

// Rutas del Docente
router.get('/planillas', planillaController.getMisClases);
router.get('/planillas/:id_asignacion', planillaController.getPlanilla);
router.post('/planillas/guardar', planillaController.postGuardarNotas);

module.exports = router;