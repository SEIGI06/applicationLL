# 🚀 GSB Infrastructure Manager v2.3 - Guide d'Installation

## 📦 Contenu du Package

Ce dossier contient l'application **GSB Infrastructure Manager** - une application desktop moderne pour gérer votre infrastructure de serveurs.

## ⚡ Installation Rapide

### 🎯 Premier lancement (Installation automatique)

1. **Double-cliquez sur** `start.bat`
2. Les dépendances s'installent automatiquement au premier lancement
3. L'application démarre !

> **Note** : L'installation automatique nécessite **Node.js** installé sur votre machine.  
> Téléchargez-le depuis : https://nodejs.org/ (version LTS recommandée)

### Option manuelle (si besoin)

Si vous préférez installer manuellement les dépendances :

```powershell
# Installer les dépendances
npm install

# Puis lancer l'application
.\\start.bat
```

## 📁 Structure des Fichiers

```
Application_sisr/
├── start.bat              # 🚀 Lanceur de l'application (DOUBLE-CLIQUER ICI)
├── install.bat            # 📦 Installateur manuel des dépendances
├── main.js                # Process principal Electron
├── preload.js             # Bridge sécurisé
├── package.json           # Configuration
├── servers.json           # ⚠️ BASE DE DONNÉES serveurs (NE PAS SUPPRIMER)
├── .gitignore             # Configuration Git
├── README.md              # Cette documentation
├── src/                   # Interface utilisateur
│   ├── index.html
│   ├── styles.css
│   └── renderer.js
├── assets/                # Ressources
│   └── icon.png
└── node_modules/          # Dépendances Electron (auto-installées)
    └── electron/
```

## 🎯 Utilisation

### Lancer l'application
- **Méthode simple** : Double-cliquez sur `start.bat`
- **Méthode PowerShell** : `.\\start.bat`

### Gestion des serveurs
- ➕ **Ajouter** : Bouton "Ajouter" dans la toolbar
- ✏️ **Modifier** : Cliquez sur un serveur puis "Modifier"
- 🗑️ **Supprimer** : Sélectionnez un serveur et cliquez "Supprimer"
- 🔍 **Scanner** : Tester la connectivité réseau de tous les serveurs
- 🖥️ **Connexion** : RDP (Windows) ou SSH (Linux)
- 🌐 **Web** : Ouvrir l'interface web du serveur

### Recherche et filtres
- Barre de recherche : Tapez nom, IP, zone ou utilisateur
- Filtre OS : Windows / Linux
- Filtre Zone : DMZ, VLAN, etc.

## ⚠️ IMPORTANT

### Fichier `servers.json`
Ce fichier contient **toutes vos données de serveurs**. 

**NE JAMAIS SUPPRIMER `servers.json`** sauf si vous voulez réinitialiser complètement la base de données.

**Sauvegarde recommandée** :
```powershell
Copy-Item servers.json servers.json.backup
```

## 🔧 Dépannage

### L'application ne se lance pas
1. Vérifiez que **Node.js** est installé : `node --version`
2. Si Node.js manque, téléchargez-le depuis https://nodejs.org/
3. Relancez `start.bat` (installation automatique)
4. Si problème persiste : exécutez `npm install` manuellement

### Connexion RDP ne fonctionne pas
- Vérifiez que Remote Desktop est activé sur le serveur cible
- Vérifiez les règles firewall

### Connexion SSH ne fonctionne pas
- Vérifiez que SSH est installé sur votre PC
- Test : `ssh user@ip` dans PowerShell

## 📊 Données par Défaut

L'application contient actuellement vos serveurs configurés :
- Serveurs Web (DMZ)
- Serveurs BDD (DMZ interne)
- Serveur AD, GLPI, IPAM (VLAN 100)
- PC utilisateurs (VLAN 10, 20, 30)

Toutes les informations sont dans `servers.json` et sont modifiables depuis l'interface.

## 💾 Sauvegarde et Restauration

### Sauvegarder vos serveurs
```powershell
Copy-Item servers.json C:\\Backup\\servers_$(Get-Date -Format 'yyyyMMdd').json
```

### Restaurer une sauvegarde
```powershell
Copy-Item C:\\Backup\\servers_20250127.json servers.json
```

## 🔄 Copier vers un autre PC

Pour installer sur un autre PC :

1. **Copiez tout le dossier `Application_sisr`** sur le PC cible
2. Assurez-vous que **Node.js** est installé sur le PC cible
3. Double-cliquez sur `start.bat`
4. Les dépendances s'installent automatiquement au premier lancement
5. L'application démarre !

## 📤 Publier sur GitHub

Les fichiers suivants sont automatiquement exclus via `.gitignore` :
- `node_modules/` (trop volumineux)
- Fichiers de build et exécutables
- Sauvegardes personnelles (`.backup`, `servers_*.json`)

Pour commiter votre code :

```powershell
# Naviguer vers le dossier
cd Application_sisr

# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer un commit
git commit -m "Version initiale de GSB Infrastructure Manager"

# Ajouter votre repository GitHub
git remote add origin https://github.com/votre-username/votre-repo.git

# Pousser vers GitHub
git push -u origin main
```

## 📝 Version

**Version** : 2.3.0  
**Technologie** : Electron 28.0.0  
**Système** : Windows 10/11  

---

**Développé pour GSB** | Infrastructure Management
