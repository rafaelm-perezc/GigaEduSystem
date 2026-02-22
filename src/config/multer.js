const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurarnos de que exista la carpeta temporal para subidas
const uploadDir = path.join(__dirname, '../../data/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento temporal
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Renombramos el archivo con la fecha para evitar colisiones
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// El "Portero": Filtro de archivos permitidos
const fileFilter = (req, file, cb) => {
    // Lista Blanca de formatos permitidos
    const allowedMimeTypes = [
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (.xlsx)
        'application/vnd.ms-excel', // Excel antiguo (.xls)
        'text/csv' // Archivos separados por comas (.csv)
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true); // Deja pasar el archivo
    } else {
        cb(new Error('Formato no soportado. Solo se permiten imágenes y archivos de Excel/CSV.')); // Lo bloquea
    }
};

// Crear el middleware final de subida con un límite de 10MB
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 Megabytes
});

module.exports = upload;