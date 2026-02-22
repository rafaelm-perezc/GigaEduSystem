const express = require('express');
const path = require('path');
require('dotenv').config();

// 1. Inicializar la Base de Datos
// Al requerir este archivo, Node ejecutará el código de database.js, 
// lo que creará el archivo giga_edu.sqlite en la carpeta data/ si no existe.
const db = require('./config/database');

// 2. Crear la aplicación Express
const app = express();

// 3. Configuración del Motor de Vistas (Pantallas)
// Le decimos al sistema que usaremos EJS para mezclar HTML con datos de la base de datos
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Configuración de Archivos Estáticos
// Permite que el navegador lea los estilos, imágenes y archivos PDF generados
app.use(express.static(path.join(__dirname, '../public')));
// NUEVO: Exponer Bootstrap y SweetAlert2 directamente desde node_modules (100% Offline)
app.use('/bootstrap', express.static(path.join(__dirname, '../node_modules/bootstrap/dist')));
// Exponer jsPDF y AutoTable (100% Offline)
app.use('/jspdf', express.static(path.join(__dirname, '../node_modules/jspdf/dist')));
app.use('/autotable', express.static(path.join(__dirname, '../node_modules/jspdf-autotable/dist')));
app.use('/sweetalert2', express.static(path.join(__dirname, '../node_modules/sweetalert2/dist')));

// 5. Middlewares de Procesamiento de Datos
// Permiten que el servidor entienda la información que viene de los formularios HTML y formato JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);
const docenteRoutes = require('./routes/docenteRoutes');
app.use('/docente', docenteRoutes);

// 6. Ruta Principal (Dashboard de Navegación Temporal)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Giga-Edu ERP | Menú Principal</title>
            <link href="/bootstrap/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body class="bg-light d-flex align-items-center justify-content-center" style="height: 100vh;">
            <div class="container text-center">
                <h1 class="mb-2 text-primary fw-bold">Giga-Edu ERP</h1>
                <p class="text-muted mb-5">Sistema Integral de Gestión Educativa</p>
                
                <div class="row justify-content-center g-4">
                    <div class="col-md-4"><a href="/admin/configuracion" class="btn btn-dark btn-lg w-100 py-4 shadow-sm">1. Configuración Institucional</a></div>
                    <div class="col-md-4"><a href="/admin/academico" class="btn btn-primary btn-lg w-100 py-4 shadow-sm">2. Plan de Estudios</a></div>
                    <div class="col-md-4"><a href="/admin/asignacion" class="btn btn-success btn-lg w-100 py-4 shadow-sm">3. Personal y Carga Académica</a></div>
                    
                    <div class="col-md-4"><a href="/admin/matriculas" class="btn btn-info btn-lg w-100 py-4 shadow-sm text-white">4. Matricular Estudiantes</a></div>
                    <div class="col-md-4"><a href="/docente/planillas" class="btn btn-warning btn-lg w-100 py-4 shadow-sm">5. Panel Docente (Notas)</a></div>
                    <div class="col-md-4"><a href="/admin/boletines" class="btn btn-danger btn-lg w-100 py-4 shadow-sm">6. Generar Boletines PDF</a></div>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 7. Arrancar el Servidor Local
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`======================================================`);
    console.log(`🚀 SERVIDOR GIGA-EDU EJECUTÁNDOSE EN EL PUERTO ${PORT}`);
    console.log(`🌐 Visita: http://localhost:${PORT}`);
    console.log(`======================================================`);
});

module.exports = app;