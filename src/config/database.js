const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// DETECCIÓN INTELIGENTE: ¿Estamos compilados en producción?
const isPackaged = __dirname.includes('app.asar');

let dataDir;
if (isPackaged) {
    // PRODUCCIÓN: En el instalador, usamos %appdata% para evitar bloqueos de Windows
    dataDir = path.join(process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share"), 'GigaEduSystem');
} else {
    // DESARROLLO: En VSCode, usamos la carpeta local 'data'
    dataDir = path.join(__dirname, '../../data');
}

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new Database(dbPath);

function inicializarBaseDeDatos() {
    try {
        const initScriptPath = path.join(__dirname, '../models/init_db.sql');
        const initScript = fs.readFileSync(initScriptPath, 'utf8');
        db.exec(initScript);
        console.log(isPackaged ? '✅ BD lista en AppData (Producción)' : '✅ BD lista en /data (Desarrollo)');
    } catch (error) { 
        console.error('❌ Error inicializando la BD:', error); 
    }
}

inicializarBaseDeDatos();
module.exports = db;