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

// 6. Ruta de Prueba Inicial (Punto de control)
app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
            <h1 style="color: #2c3e50;">🚀 Motor Giga-Edu Inicializado</h1>
            <p style="color: #27ae60;">El servidor local está funcionando y la base de datos SQLite ha sido estructurada.</p>
        </div>
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