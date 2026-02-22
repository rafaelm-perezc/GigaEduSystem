const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 1. Determinar dónde guardar la base de datos de forma segura
let dbFolder;

// Si detectamos que estamos dentro del archivo empaquetado 'app.asar', es el programa instalado (.exe)
if (__dirname.includes('app.asar')) {
    // Usamos la carpeta segura de Windows para datos de usuario (AppData\Roaming\GigaEduSystem)
    dbFolder = path.join(process.env.APPDATA || process.env.USERPROFILE, 'GigaEduSystem');
} else {
    // Si estamos programando en VSCode, usamos la carpeta 'data' normal
    dbFolder = path.join(__dirname, '../../data');
}

// 2. Asegurarnos de que la carpeta exista. Si no existe, la crea.
if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
}

// Armar la ruta final del archivo
const dbPath = path.join(dbFolder, 'giga_edu.sqlite');

// 3. Iniciar la conexión
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// 4. Función para leer el esquema y construir las tablas
function inicializarBaseDeDatos() {
    try {
        const sqlPath = path.join(__dirname, '../models/init_db.sql');
        const sqlSchema = fs.readFileSync(sqlPath, 'utf8');
        db.exec(sqlSchema);
        console.log('✅ Base de datos SQLite inicializada correctamente en:', dbPath);
    } catch (error) {
        console.error('❌ Error crítico al inicializar la base de datos:', error);
    }
}

inicializarBaseDeDatos();

module.exports = db;