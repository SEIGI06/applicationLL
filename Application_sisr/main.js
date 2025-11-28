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
    return await pingIP(ip);
});

// Scan d'une plage d'IPs
ipcMain.handle('scan-range', async (event, startIP, endIP) => {
    try {
        const ips = generateIPRange(startIP, endIP);
        const results = [];
        const BATCH_SIZE = 50; // Nombre de pings simultanés

        // Traitement par lots pour ne pas surcharger le système
        for (let i = 0; i < ips.length; i += BATCH_SIZE) {
            const batch = ips.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (ip) => {
                const status = await pingIP(ip);
                if (status.online) {
                    return { ip, status: 'online' };
                }
                return null;
            });

            const batchResults = await Promise.all(promises);
            results.push(...batchResults.filter(r => r !== null));
        }

        return results;
    } catch (error) {
        console.error('Erreur scan:', error);
        return [];
    }
});

// Fonction helper pour ping (réutilisée)
async function pingIP(ip) {
    try {
        // Windows utilise -n pour le nombre de paquets, -w pour timeout (ms)
        // Linux utilise -c pour le nombre de paquets, -W pour timeout (s)
        const command = process.platform === 'win32'
            ? `ping -n 1 -w 500 ${ip}`
            : `ping -c 1 -W 1 ${ip}`;

        await execAsync(command);
        return { online: true };
    } catch (error) {
        return { online: false };
    }
}

// Générateur de plage IP (Supporte uniquement le dernier octet pour l'instant pour simplifier)
function generateIPRange(start, end) {
    const startParts = start.split('.').map(Number);
    const endParts = end.split('.').map(Number);
    const ips = [];

    // On suppose que seuls le dernier octet change pour cette version simple
    // ou on itère simplement si c'est le même sous-réseau
    if (startParts[0] === endParts[0] && startParts[1] === endParts[1] && startParts[2] === endParts[2]) {
        for (let i = startParts[3]; i <= endParts[3]; i++) {
            ips.push(`${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`);
        }
    } else {
        // Fallback: retourne juste le start et end si trop complexe pour l'instant
        ips.push(start);
        if (start !== end) ips.push(end);
    }
    return ips;
}

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
