const express = require('express');
const router = express.Router();
const upload = require('../config/multer'); // Permite subir imágenes y archivos Excel

// Importación de Controladores (Asegurando que cada uno se llame solo una vez)
const configController = require('../controllers/configController');
const academicoController = require('../controllers/academicoController');
const asignacionController = require('../controllers/asignacionController');
const matriculaController = require('../controllers/matriculaController');
const boletinController = require('../controllers/boletinController');

// 1. Configuración Institucional
router.get('/configuracion', configController.getConfiguracion);
router.post('/configuracion', upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'firma_rector', maxCount: 1 }
]), configController.guardarConfiguracion);

// 2. Gestión Académica
router.get('/academico', academicoController.getGestion);
router.post('/academico/area', academicoController.postArea);
router.post('/academico/asignatura', academicoController.postAsignatura);

// 3. Gestión de Personal y Carga
router.get('/asignacion', asignacionController.getPanel);
router.post('/asignacion/docente', asignacionController.postDocente);
router.post('/asignacion/grupo', asignacionController.postGrupo);
router.post('/asignacion/carga', asignacionController.postAsignacion);

// 4. MATRÍCULAS Y EXCEL MASIVO
router.get('/matriculas', matriculaController.getPanel);
router.post('/matriculas', matriculaController.postMatricula);
router.get('/matriculas/plantilla', matriculaController.descargarPlantilla);
router.post('/matriculas/masivo', upload.single('archivo_excel'), matriculaController.cargarMasivo);

// 5. Boletines Oficiales
router.get('/boletines', boletinController.getPanel);
router.get('/api/boletines/datos/:id_grupo', boletinController.getDatosBoletin);

module.exports = router;