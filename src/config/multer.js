const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento local temporal
const storage = multer.diskStorage({
    // ¿Dónde guardar temporalmente el archivo?
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../public/uploads/'));
    },
    // ¿Qué nombre ponerle para que no choque con otros archivos?
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato no soportado. Solo se permiten imágenes.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB por imagen
});

module.exports = upload;