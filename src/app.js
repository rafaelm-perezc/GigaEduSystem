const express = require('express');
const path = require('path');
require('dotenv').config();
const session = require('express-session');
const bcrypt = require('bcryptjs'); // Lo usaremos para crear el admin por defecto

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
// Enrutamiento inteligente de imágenes
const isPackaged = __dirname.includes('app.asar');
let uploadsDir;
if (isPackaged) {
    const userDataPath = path.join(process.env.APPDATA || process.env.HOME + '/.local/share', 'GigaEduSystem');
    uploadsDir = path.join(userDataPath, 'uploads');
} else {
    uploadsDir = path.join(__dirname, '../public/uploads');
}
app.use('/uploads', express.static(uploadsDir));
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
// Configuración de Sesiones (Memoria de usuario)
app.use(session({
    secret: 'giga_edu_super_secreto_123',
    resave: false,
    saveUninitialized: false
}));

// Crear Super Administrador por defecto si no existe
const adminCount = db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'ADMIN'").get();
if(adminCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('admin123', salt);
    // Ahora inyectamos los datos respetando las nuevas columnas atómicas
    db.prepare("INSERT INTO usuarios (id, documento, primer_nombre, primer_apellido, rol, password_hash) VALUES ('admin-uuid', 'admin', 'SUPER', 'ADMINISTRADOR', 'ADMIN', ?)").run(hash);
    console.log("🔑 Usuario administrador por defecto creado. (Usuario: admin / Clave: admin123)");
}

const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes);
const docenteRoutes = require('./routes/docenteRoutes');
app.use('/docente', docenteRoutes);

// 6. Ruta Principal (Dashboard de Navegación Temporal)
// Conectar rutas de Login
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Rutas de Estudiantes
const estudianteRoutes = require('./routes/estudianteRoutes');
app.use('/estudiante', estudianteRoutes);

// Ruta Protegida: Menú Principal (Dashboard)
app.get('/dashboard', (req, res) => {
    // Si no hay sesión, lo devolvemos a la puerta (Login)
    if (!req.session.usuario) {
        return res.redirect('/');
    }
    
    // Le pasamos los datos del usuario a la vista para que diga "Hola, Carlos"
    res.render('dashboard', { usuario: req.session.usuario });
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