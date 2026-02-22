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
    { name: 'logo_departamento', maxCount: 1 }, 
    { name: 'firma_rector', maxCount: 1 }
]), configController.guardarConfiguracion);

// 2. Gestión Académica
router.get('/academico', academicoController.getGestion);
router.post('/academico/area', academicoController.postArea);
router.post('/academico/asignatura', academicoController.postAsignatura);
router.post('/academico/area/editar', academicoController.editarArea);
router.post('/academico/area/eliminar', academicoController.eliminarArea);
router.post('/academico/asignatura/editar', academicoController.editarAsignatura);
router.post('/academico/asignatura/eliminar', academicoController.eliminarAsignatura);
router.get('/academico/plantilla', academicoController.descargarPlantilla);
router.post('/academico/masivo', upload.single('archivo_excel'), academicoController.cargarMasivo);

// 3. Gestión de Personal y Carga
router.get('/asignacion', asignacionController.getPanel);
router.get('/asignacion/docentes/buscar', asignacionController.buscarDocenteAPI); // NUEVA RUTA API
router.post('/asignacion/docente', asignacionController.postDocente);
router.post('/asignacion/grupo', asignacionController.postGrupo);
router.post('/asignacion/carga', asignacionController.postAsignacion);
router.get('/asignacion/docentes/plantilla', asignacionController.descargarPlantillaDocentes);
router.post('/asignacion/docentes/masivo', upload.single('archivo_excel'), asignacionController.cargarMasivoDocentes);

// 4. MATRÍCULAS Y EXCEL MASIVO
router.get('/matriculas', matriculaController.getPanel);
router.post('/matriculas', matriculaController.postMatricula);
router.get('/matriculas/plantilla', matriculaController.descargarPlantilla);
router.post('/matriculas/masivo', upload.single('archivo_excel'), matriculaController.cargarMasivo);
router.get('/matriculas/buscar', matriculaController.buscarAPI);

// 5. Boletines Oficiales
router.get('/boletines', boletinController.getPanel);
router.get('/api/boletines/datos/:id_grupo', boletinController.getDatosBoletin);

module.exports = router;