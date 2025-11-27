// GSB Infrastructure Manager - Main Process
// Gère la fenêtre Electron et la communication avec le backend

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

let mainWindow;

// Chemins
const JSON_FILE = path.join(__dirname, 'servers.json');

// Création de la fenêtre principale
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 600,
        backgroundColor: '#0F172A',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        frame: true,
        titleBarStyle: 'default'
    });

    mainWindow.loadFile('src/index.html');

    // Ouvrir DevTools en développement (optionnel)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Événements Electron
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ==================== IPC HANDLERS ====================

// Charger les serveurs depuis JSON
ipcMain.handle('load-servers', async () => {
    try {
        let data = await fs.readFile(JSON_FILE, 'utf8');

        // Supprimer le BOM (Byte Order Mark) si présent
        if (data.charCodeAt(0) === 0xFEFF) {
            data = data.slice(1);
        }

        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur chargement servers.json:', error);
        // Retourner tableau vide si fichier n'existe pas
        return [];
    }
});

// Sauvegarder les serveurs dans JSON
ipcMain.handle('save-servers', async (event, servers) => {
    try {
        await fs.writeFile(JSON_FILE, JSON.stringify(servers, null, 4), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Erreur sauvegarde servers.json:', error);
        return { success: false, error: error.message };
    }
});

// Ping d'un serveur (test de connectivité)
ipcMain.handle('ping-server', async (event, ip) => {
    try {
        // Windows utilise -n pour le nombre de paquets
        const command = process.platform === 'win32'
            ? `ping -n 1 -w 1000 ${ip}`
            : `ping -c 1 -W 1 ${ip}`;

        await execAsync(command);
        return { online: true };
    } catch (error) {
        return { online: false };
    }
});

// Connexion RDP (Remote Desktop) pour Windows
ipcMain.handle('connect-rdp', async (event, ip) => {
    try {
        if (process.platform === 'win32') {
            exec(`mstsc /v:${ip}`);
            return { success: true };
        } else {
            return { success: false, error: 'RDP disponible uniquement sur Windows' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Connexion SSH pour Linux
ipcMain.handle('connect-ssh', async (event, user, ip) => {
    try {
        if (process.platform === 'win32') {
            // Ouvre PowerShell avec la commande SSH
            exec(`start powershell -NoExit -Command "ssh ${user}@${ip}"`);
            return { success: true };
        } else {
            // Sur Linux/Mac, ouvre le terminal par défaut
            exec(`gnome-terminal -- ssh ${user}@${ip}` || `xterm -e ssh ${user}@${ip}`);
            return { success: true };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Ouvrir navigateur web
ipcMain.handle('open-web', async (event, ip) => {
    try {
        await shell.openExternal(`http://${ip}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Obtenir les informations système
ipcMain.handle('get-system-info', async () => {
    return {
        platform: process.platform,
        appVersion: app.getVersion(),
        electronVersion: process.versions.electron,
        nodeVersion: process.versions.node
    };
});
