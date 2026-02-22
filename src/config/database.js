const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 1. Definir la ruta física donde se guardará el archivo de la base de datos
// Subimos dos niveles (..) desde 'config' para llegar a la carpeta 'data' en la raíz
const dbPath = path.join(__dirname, '../../data/giga_edu.sqlite');

// 2. Iniciar la conexión (Crea el archivo si no existe)
// La opción verbose nos imprimirá en la consola las consultas SQL que se ejecuten (útil para depurar)
const db = new Database(dbPath, { verbose: console.log });

// Optimización de SQLite para mayor velocidad y seguridad en escritura (ideal para Electron)
db.pragma('journal_mode = WAL');

// 3. Función para leer el esquema y construir las tablas
function inicializarBaseDeDatos() {
    try {
        // Ruta exacta al archivo SQL que creaste en el paso anterior
        const sqlPath = path.join(__dirname, '../models/init_db.sql');
        
        // Leer el contenido del archivo SQL
        const sqlSchema = fs.readFileSync(sqlPath, 'utf8');
        
        // Ejecutar todo el esquema de una sola vez
        db.exec(sqlSchema);
        
        console.log('✅ Base de datos SQLite inicializada y estructurada correctamente.');
    } catch (error) {
        console.error('❌ Error crítico al inicializar la base de datos:', error);
    }
}

// 4. Ejecutar la inicialización al momento de importar este archivo
inicializarBaseDeDatos();

// 5. Exportar la conexión 'db' para que los controladores puedan hacer consultas (SELECT, INSERT, etc.)
module.exports = db;