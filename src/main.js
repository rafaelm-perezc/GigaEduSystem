const { app, BrowserWindow } = require('electron');
const path = require('path');
const server = require('./app'); // Importamos nuestro servidor Express

let mainWindow;

function createWindow() {
    // 1. Configuramos las dimensiones y aspecto de la ventana
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: "Giga-Edu ERP",
        icon: path.join(__dirname, '../public/img/icono.png'), // Opcional: Si luego le pones un ícono
        webPreferences: {
            nodeIntegration: false, // Por seguridad
            contextIsolation: true
        }
    });

    // 2. Quitamos el menú superior clásico por defecto para que se vea moderno
    mainWindow.setMenuBarVisibility(false);

    // 3. Le decimos a la ventana que cargue nuestro servidor local
    const PORT = process.env.PORT || 3000;
    mainWindow.loadURL(`http://localhost:${PORT}`);
    mainWindow.webContents.openDevTools();

    // 4. Si la ventana se cierra, limpiamos la memoria
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Cuando Electron esté listo, abrimos la ventana
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Cerrar el programa completo cuando se cierren todas las ventanas
// Cerrar el programa completo cuando se cierren todas las ventanas
app.on('window-all-closed', () => {
    app.quit();
    process.exit(0); // MATA el servidor Node.js y destruye cualquier sesión activa de inmediato
});