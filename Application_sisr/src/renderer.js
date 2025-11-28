// GSB Infrastructure Manager - Renderer Process
// Gère l'interface utilisateur et communique avec le main process

// ==================== STATE MANAGEMENT ====================
let servers = [];
let selectedServerId = null;
let isEditMode = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 GSB Manager - Initialisation...');

    // Charger les informations système
    const sysInfo = await window.electronAPI.getSystemInfo();
    document.getElementById('app-version').textContent = `v${sysInfo.appVersion} | Electron ${sysInfo.electronVersion}`;

    // Charger les serveurs
    await loadServers();

    // Initialiser les event listeners
    initializeEventListeners();

    showToast('success', '✅ Application chargée avec succès!');
});

// ==================== LOAD & SAVE SERVERS ====================
async function loadServers() {
    try {
        showLoading(true);
        servers = await window.electronAPI.loadServers();
        console.log(`📦 ${servers.length} serveurs chargés`);
        renderServers();
        updateStatusBar();
    } catch (error) {
        console.error('Erreur chargement serveurs:', error);
        showToast('error', '❌ Erreur de chargement des serveurs');
    } finally {
        showLoading(false);
    }
}

async function saveServers() {
    try {
        const result = await window.electronAPI.saveServers(servers);
        if (result.success) {
            showToast('success', '💾 Données sauvegardées');
            return true;
        } else {
            showToast('error', `❌ Erreur: ${result.error}`);
            return false;
        }
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('error', '❌ Erreur de sauvegarde');
        return false;
    }
}

// ==================== RENDER FUNCTIONS ====================
function renderServers() {
    const grid = document.getElementById('servers-grid');
    const emptyState = document.getElementById('empty-state');

    // Filtrer les serveurs selon les critères de recherche/filtre
    const filtered = getFilteredServers();

    if (filtered.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    // Optimisation: Utilisation de DocumentFragment pour réduire les reflows
    const fragment = document.createDocumentFragment();

    filtered.forEach(server => {
        const card = createServerCard(server);
        fragment.appendChild(card);
    });

    // Nettoyage et insertion unique
    grid.innerHTML = '';
    grid.appendChild(fragment);
}

function createServerCard(server) {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.dataset.id = server.ID;

    // Ajout de la classe selected si nécessaire
    if (selectedServerId === server.ID) {
        card.classList.add('selected');
    }

    // Icône selon l'OS
    const osIcon = server.OS === 'Windows' ? '🪟' : '🐧';

    // Badge de zone avec couleur
    const zoneClass = getZoneClass(server.Zone);

    // Construction du HTML sans event listeners individuels (Event Delegation)
    card.innerHTML = `
    <div class="card-header">
      <span class="os-icon">${osIcon}</span>
      <h3>${server.Name}</h3>
      <span class="status-badge unknown">● INCONNU</span>
    </div>
    <div class="card-body">
      <p><strong>ID:</strong> <span>${server.ID}</span></p>
      <p><strong>IP:</strong> <span>${server.IP}</span></p>
      <p><strong>User:</strong> <span>${server.User}</span></p>
      <p><strong>Zone:</strong> <span class="zone-badge ${zoneClass}">${server.Zone}</span></p>
      <p><strong>OS:</strong> <span>${server.OS}</span></p>
    </div>
    <div class="card-actions">
      <button class="btn btn-success btn-connect" title="Connexion RDP/SSH" data-action="connect">
        🖥️
      </button>
      <button class="btn btn-info btn-web" title="Ouvrir dans navigateur" data-action="web">
        🌐
      </button>
      <button class="btn btn-secondary btn-edit" title="Modifier" data-action="edit">
        ✏️
      </button>
      <button class="btn btn-danger btn-delete" title="Supprimer" data-action="delete">
        🗑️
      </button>
    </div>
  `;

    return card;
}

// Gestionnaire d'événements délégué pour la grille
function handleGridClick(e) {
    const card = e.target.closest('.server-card');
    if (!card) return;

    const serverId = parseInt(card.dataset.id);
    const server = servers.find(s => s.ID === serverId);

    if (!server) return;

    // Vérifier si un bouton a été cliqué
    const button = e.target.closest('button');
    if (button) {
        e.stopPropagation();
        const action = button.dataset.action;

        switch (action) {
            case 'connect':
                connectToServer(server);
                break;
            case 'web':
                openWebInterface(server);
                break;
            case 'edit':
                editServer(serverId);
                break;
            case 'delete':
                deleteServer(serverId);
                break;
        }
    } else {
        // Clic sur la carte elle-même -> Sélection
        selectServer(serverId);
    }
}

function getZoneClass(zone) {
    if (zone.toLowerCase().includes('dmz_intern')) return 'zone-dmz_intern';
    if (zone.toLowerCase().includes('dmz')) return 'zone-dmz';
    if (zone.toLowerCase().includes('vlan')) return 'zone-vlan';
    return '';
}

// ==================== SERVER SELECTION ====================
function selectServer(id) {
    selectedServerId = id;

    // Mettre à jour l'affichage visuel
    document.querySelectorAll('.server-card').forEach(card => {
        if (parseInt(card.dataset.id) === id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
}

function getSelectedServer() {
    return servers.find(s => s.ID === selectedServerId);
}

// ==================== FILTER & SEARCH ====================
function getFilteredServers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const osFilter = document.getElementById('filter-os').value;
    const zoneFilter = document.getElementById('filter-zone').value;

    return servers.filter(server => {
        const matchSearch = !searchTerm ||
            server.Name.toLowerCase().includes(searchTerm) ||
            server.IP.includes(searchTerm) ||
            server.Zone.toLowerCase().includes(searchTerm) ||
            server.User.toLowerCase().includes(searchTerm);

        const matchOS = !osFilter || server.OS === osFilter;
        const matchZone = !zoneFilter || server.Zone === zoneFilter;

        return matchSearch && matchOS && matchZone;
    });
}

// ==================== CRUD OPERATIONS ====================
function addServer() {
    isEditMode = false;
    const nextID = servers.length > 0 ? Math.max(...servers.map(s => s.ID)) + 1 : 1;

    document.getElementById('modal-title').textContent = 'Ajouter un serveur';
    document.getElementById('input-id').value = nextID;
    document.getElementById('input-name').value = '';
    document.getElementById('input-ip').value = '';
    document.getElementById('input-user').value = '';
    document.getElementById('input-zone').value = '';
    document.getElementById('input-os').value = 'Linux';

    openModal();
}

function editServer(id) {
    const server = servers.find(s => s.ID === id);
    if (!server) return;

    isEditMode = true;
    selectedServerId = id;

    document.getElementById('modal-title').textContent = 'Modifier le serveur';
    document.getElementById('input-id').value = server.ID;
    document.getElementById('input-name').value = server.Name;
    document.getElementById('input-ip').value = server.IP;
    document.getElementById('input-user').value = server.User;
    document.getElementById('input-zone').value = server.Zone;
    document.getElementById('input-os').value = server.OS;

    openModal();
}

async function deleteServer(id) {
    const server = servers.find(s => s.ID === id);
    if (!server) return;

    const confirmed = confirm(`Supprimer le serveur "${server.Name}" (ID: ${id})?\n\nCette action est irréversible.`);
    if (!confirmed) return;

    servers = servers.filter(s => s.ID !== id);
    await saveServers();
    renderServers();
    updateStatusBar();
    showToast('success', `🗑️ Serveur ${server.Name} supprimé`);
}

async function saveCurrentServer() {
    const formData = {
        ID: parseInt(document.getElementById('input-id').value),
        Name: document.getElementById('input-name').value.trim(),
        IP: document.getElementById('input-ip').value.trim(),
        User: document.getElementById('input-user').value.trim(),
        Zone: document.getElementById('input-zone').value.trim(),
        OS: document.getElementById('input-os').value,
        Color: 'White'
    };

    // Validation
    if (!formData.Name || !formData.IP || !formData.User || !formData.Zone) {
        showToast('error', '❌ Veuillez remplir tous les champs');
        return;
    }

    // Validation IP basique
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipPattern.test(formData.IP)) {
        showToast('error', '❌ Format IP invalide');
        return;
    }

    if (isEditMode) {
        // Modifier serveur existant
        const index = servers.findIndex(s => s.ID === formData.ID);
        if (index !== -1) {
            servers[index] = formData;
            showToast('success', `✏️ Serveur ${formData.Name} modifié`);
        }
    } else {
        // Ajouter nouveau serveur
        servers.push(formData);
        showToast('success', `➕ Serveur ${formData.Name} ajouté`);
    }

    await saveServers();
    renderServers();
    updateStatusBar();
    closeModal();
}

// ==================== NETWORK OPERATIONS ====================
async function scanNetwork() {
    showToast('info', '🔍 Scan réseau en cours...');
    showLoading(true);

    const cards = document.querySelectorAll('.server-card');

    for (let i = 0; i < servers.length; i++) {
        const server = servers[i];
        const card = Array.from(cards).find(c => parseInt(c.dataset.id) === server.ID);
        if (!card) continue;

        const statusBadge = card.querySelector('.status-badge');
        statusBadge.textContent = '⏳ TEST...';
        statusBadge.className = 'status-badge unknown';

        try {
            const result = await window.electronAPI.pingServer(server.IP);

            if (result.online) {
                statusBadge.textContent = '● EN LIGNE';
                statusBadge.className = 'status-badge online';
            } else {
                statusBadge.textContent = '● HORS LIGNE';
                statusBadge.className = 'status-badge offline';
            }
        } catch (error) {
            statusBadge.textContent = '● ERREUR';
            statusBadge.className = 'status-badge offline';
        }
    }

    showLoading(false);
    const onlineCount = document.querySelectorAll('.status-badge.online').length;
    showToast('success', `✅ Scan terminé: ${onlineCount}/${servers.length} en ligne`);
}

async function connectToServer(server) {
    try {
        let result;

        if (server.OS === 'Windows') {
            result = await window.electronAPI.connectRDP(server.IP);
            if (result.success) {
                showToast('success', `🖥️ Connexion RDP vers ${server.Name}`);
            }
        } else {
            result = await window.electronAPI.connectSSH(server.User, server.IP);
            if (result.success) {
                showToast('success', `🖥️ Connexion SSH vers ${server.Name}`);
            }
        }

        if (!result.success) {
            showToast('error', `❌ ${result.error}`);
        }
    } catch (error) {
        showToast('error', `❌ Erreur de connexion: ${error.message}`);
    }
}

async function openWebInterface(server) {
    try {
        const result = await window.electronAPI.openWeb(server.IP);
        if (result.success) {
            showToast('info', `🌐 Ouverture de http://${server.IP}`);
        } else {
            showToast('error', `❌ ${result.error}`);
        }
    } catch (error) {
        showToast('error', `❌ Erreur: ${error.message}`);
    }
}

// ==================== MODAL MANAGEMENT ====================
function openModal() {
    document.getElementById('modal-server').classList.add('active');
}

function closeModal() {
    document.getElementById('modal-server').classList.remove('active');
}

// ==================== TOAST NOTIFICATIONS ====================
function showToast(type, message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;

    container.appendChild(toast);

    // Auto-remove après 4 secondes
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// ==================== LOADING OVERLAY ====================
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = show ? 'flex' : 'none';
}

// ==================== STATUS BAR ====================
function updateStatusBar() {
    document.getElementById('server-count').textContent = servers.length;
    document.getElementById('status-text').innerHTML = `✅ Prêt | <span id="server-count">${servers.length}</span> serveurs chargés`;
}

// ==================== EVENT LISTENERS ====================
function initializeEventListeners() {
    // Délégation d'événements pour la grille de serveurs
    document.getElementById('servers-grid').addEventListener('click', handleGridClick);

    // Boutons toolbar
    document.getElementById('btn-add').addEventListener('click', addServer);

    document.getElementById('btn-edit').addEventListener('click', () => {
        if (selectedServerId) {
            editServer(selectedServerId);
        } else {
            showToast('warning', '⚠️ Veuillez sélectionner un serveur');
        }
    });

    document.getElementById('btn-delete').addEventListener('click', () => {
        if (selectedServerId) {
            deleteServer(selectedServerId);
        } else {
            showToast('warning', '⚠️ Veuillez sélectionner un serveur');
        }
    });

    document.getElementById('btn-scan').addEventListener('click', scanNetwork);

    document.getElementById('btn-connect').addEventListener('click', () => {
        const server = getSelectedServer();
        if (server) {
            connectToServer(server);
        } else {
            showToast('warning', '⚠️ Veuillez sélectionner un serveur');
        }
    });

    document.getElementById('btn-web').addEventListener('click', () => {
        const server = getSelectedServer();
        if (server) {
            openWebInterface(server);
        } else {
            showToast('warning', '⚠️ Veuillez sélectionner un serveur');
        }
    });

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('btn-cancel').addEventListener('click', closeModal);

    // Fermer modal en cliquant en dehors
    document.getElementById('modal-server').addEventListener('click', (e) => {
        if (e.target.id === 'modal-server') {
            closeModal();
        }
    });

    // Formulaire
    document.getElementById('server-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveCurrentServer();
    });

    // Recherche et filtres
    document.getElementById('search-input').addEventListener('input', renderServers);
    document.getElementById('filter-os').addEventListener('change', renderServers);
    document.getElementById('filter-zone').addEventListener('change', renderServers);

    // ESC pour fermer modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

console.log('🎨 Renderer script chargé');
