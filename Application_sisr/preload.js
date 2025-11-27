// GSB Infrastructure Manager - Preload Script
// Bridge sécurisé entre le frontend et Node.js

const { contextBridge, ipcRenderer } = require('electron');

// Expose les APIs au renderer de manière sécurisée
contextBridge.exposeInMainWorld('electronAPI', {
    // Gestion des serveurs
    loadServers: () => ipcRenderer.invoke('load-servers'),
    saveServers: (servers) => ipcRenderer.invoke('save-servers', servers),

    // Tests de connectivité
    pingServer: (ip) => ipcRenderer.invoke('ping-server', ip),

    // Connexions
    connectRDP: (ip) => ipcRenderer.invoke('connect-rdp', ip),
    connectSSH: (user, ip) => ipcRenderer.invoke('connect-ssh', user, ip),
    openWeb: (ip) => ipcRenderer.invoke('open-web', ip),

    // Informations système
    getSystemInfo: () => ipcRenderer.invoke('get-system-info')
});

console.log('🚀 GSB Infrastructure Manager - Preload script chargé');
