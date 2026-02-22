const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const upload = require('../config/multer');

// Ruta para ver el formulario
router.get('/configuracion', configController.getConfiguracion);

// Ruta para procesar el formulario (Multer espera campos con name 'logo' y 'firma_rector')
router.post('/configuracion', upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'firma_rector', maxCount: 1 }
]), configController.guardarConfiguracion);

const academicoController = require('../controllers/academicoController');

// Rutas para la Gestión Académica (Áreas y Asignaturas)
router.get('/academico', academicoController.getGestion);
router.post('/academico/area', academicoController.postArea);
router.post('/academico/asignatura', academicoController.postAsignatura);

const asignacionController = require('../controllers/asignacionController');

// Rutas para la Gestión de Personal, Grupos y Asignación
router.get('/asignacion', asignacionController.getPanel);
router.post('/asignacion/docente', asignacionController.postDocente);
router.post('/asignacion/grupo', asignacionController.postGrupo);
router.post('/asignacion/carga', asignacionController.postAsignacion);

const matriculaController = require('../controllers/matriculaController');

// Rutas para Matriculación de Estudiantes
router.get('/matriculas', matriculaController.getPanel);
router.post('/matriculas', matriculaController.postMatricula);

const boletinController = require('../controllers/boletinController');

// Rutas para la Generación de Boletines
router.get('/boletines', boletinController.getPanel);
router.get('/api/boletines/datos/:id_grupo', boletinController.getDatosBoletin);

module.exports = router;