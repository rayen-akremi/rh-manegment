# 🚀 GUIDE DE DÉMARRAGE RAPIDE - RH MANAGEMENT

## 📋 TL;DR (Résumé Exécutif)

**Qu'est-ce que c'est?** Application web HR avec gestion d'employés, absences, IA prédictive
**Tech:** React (frontend) + Express (backend) + Python IA + MongoDB
**Temps setup:** 15 minutes
**Statut:** Fonctionnel, prêt pour développement

---

## ⚡ Setup en 5 Minutes

### 1️⃣ Prérequis
```bash
✓ Node.js 14+
✓ MongoDB lancé
✓ Python 3.x (optionnel, pour IA)
✓ Git
```

### 2️⃣ Cloner & Installer
```bash
cd RH-manegment

# Backend
cd backend
npm install

# Frontend (dans nouveau terminal)
cd frontend
npm install

# Python IA (optionnel, nouveau terminal)
cd hr-ai-predictor
pip install -r requirements.txt
```

### 3️⃣ Lancer les Services
```bash
# Terminal 1 - Backend
cd backend
npm run dev          # Écoute port 5000

# Terminal 2 - Frontend
cd frontend
npm start           # Écoute port 3000

# Terminal 3 - Python IA (optionnel)
cd hr-ai-predictor
python app.py       # Écoute port 5001
```

### 4️⃣ Accéder l'App
```
Frontend: http://localhost:3000
Backend API: http://localhost:5000/api
```

### 5️⃣ Connexion
```
Email: manage@rh.com
Mot de passe: admin123
```

---

## 🗂️ Structure Essentielle à Connaître

```
backend/
├── models/           ← Schémas BD (9 collections)
├── routes/           ← Endpoints API
├── controllers/      ← Logique métier
└── server.js         ← Point d'entrée

frontend/
├── components/       ← Pages React (13 composants)
├── context/          ← Auth context
└── App.tsx           ← Routeur principal

hr-ai-predictor/
└── app.py            ← Service prédictions
```

---

## 🔑 5 Concepts Clés

### 1. **Automapper d'Importation** 🎯
Le système détecte et mappe **automatiquement** les colonnes des fichiers importés.

**Processus:**
```
Fichier Excel → Détection type → Normalisation → Mappage → Import ✓
```

**Types détectés:** Turnover | Monthly Recap | Générique

**En-têtes normalisés:** "NOM ET PRÉNOM" = "nom et prenom" = "Nom et Prénom" ✓

---

### 2. **9 Collections MongoDB**

| Collection | Rôle |
|-----------|------|
| Employe | Employés actifs |
| Absence | Absences/congés |
| Workload | Charge de travail |
| MonthlyRecap | Import récapitulatif mensuel 🔑 |
| TurnoverDeparture | Import départs |
| TurnoverHistory | Historique rotation |
| User | Utilisateurs/Auth |
| ImportHistory | Log imports |
| ExportHistory | Log exports |

---

### 3. **Architecture MVC**

```
Frontend (React)
    ↓
Routes (Express)
    ↓
Controllers (Logique)
    ↓
Models (MongoDB)
    ↓
Database
```

**Exemple:** Afficher employés
```
App.tsx → GET /api/employees → employeController.getAllEmployees → Employe.find() → BD
```

---

### 4. **Prédictions IA** 🤖

Service Python qui prédit:
- **Turnover Risk:** Risque de départ employé
- **Absence:** Jours absence probables
- **Workload:** Détection surcharge

**Si Python indisponible:** Calcul local en fallback

---

### 5. **Authentification**

- Système de **session tokens** (pas JWT)
- Un seul utilisateur par défaut: `manage@rh.com`
- Mot de passe hashé avec **salt**

```javascript
// Login flow
POST /api/auth/login
├─ Vérifier email/password
├─ Générer session token
├─ Sauvegarder en User.sessions[]
└─ Retourner token au client
```

---

## 📊 Endpoints API Essentiels

### Auth
```
POST   /api/auth/login         Login utilisateur
POST   /api/auth/logout        Logout
GET    /api/auth/me            Profil current user
```

### Employés
```
GET    /api/employees          Lister tous
POST   /api/employees          Créer
PUT    /api/employees/:id      Modifier
DELETE /api/employees/:id      Supprimer
POST   /api/employees/bulk/delete  Supprimer multiple
```

### Tableau de Bord
```
GET    /api/dashboard/kpi                  KPI (absences, turnover, etc.)
GET    /api/dashboard/monthly-data        Données 6 derniers mois
GET    /api/dashboard/absence-reasons     Répartition absences
```

### Importation 🔑
```
POST   /api/turnover-history/departures/import      Import turnover
POST   /api/monthly-recap/import                    Import récap mensuel
GET    /api/import-history                         Historique imports
```

### Prédictions IA
```
POST   /api/ai/predict-turnover/:employeeId        Prédire risque départ
POST   /api/ai/predict-absence/:employeeId         Prédire absences
POST   /api/ai/batch-predict                       Prédictions batch
```

---

## 🎯 Fichiers Prioritaires à Étudier

### Backend
1. **server.js** - Point d'entrée ← COMMENCER ICI
2. **models/Employe.js** - Schéma principal
3. **controllers/employeController.js** - CRUD employés
4. **controllers/dashboardController.js** - Calculs KPI
5. **services/aiPythonClient.js** - Client prédictions

### Frontend
1. **App.tsx** - Routeur principal ← COMMENCER ICI
2. **components/import.tsx** - **AUTOMAPPER** 🎯
3. **components/Dashboard.tsx** - Affichage données
4. **context/AuthContext.tsx** - Gestion auth

---

## 🧪 Commandes Utiles

### Backend (depuis dossier backend/)
```bash
npm install              Installer dépendances
npm start               Lancer production
npm run dev             Lancer dev (Nodemon)
npm test                Tests (pas implémenté)
```

### Frontend (depuis dossier frontend/)
```bash
npm install              Installer dépendances
npm start               Démarrer dev server
npm run build           Build production
npm test                Tests
```

### Python IA (depuis dossier hr-ai-predictor/)
```bash
pip install -r requirements.txt    Installer dépendances
python app.py                      Lancer service
python -m pytest                   Tests (si existants)
```

---

## 🐛 Troubleshooting Rapide

### ❌ MongoDB connexion échoue
```bash
# Vérifier MongoDB est lancé
mongod --version
# Si pas lancé, lancer MongoDB
# Windows: Services → MongoDB Community
# Mac: brew services start mongodb-community
```

### ❌ Port déjà utilisé
```bash
# Port 5000 (backend)
netstat -tulpn | grep 5000
kill -9 <PID>

# Port 3000 (frontend)
netstat -tulpn | grep 3000
kill -9 <PID>
```

### ❌ Npm packages erreur
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Python dependencies fail
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

---

## 📝 Architecture Détaillée (1 page)

```
┌─────────────────────────────────────────────────────┐
│              FLUX DE DONNÉES COMPLET                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  UTILISATEUR                                        │
│      ↓                                              │
│  [React Frontend - Port 3000]                       │
│  - Login.tsx              → POST /api/auth/login    │
│  - Dashboard.tsx          → GET /api/dashboard/kpi  │
│  - employee.tsx           → GET /api/employees      │
│  - import.tsx (AUTOMAPPER) → POST /api/.../import  │
│      ↓                                              │
│  [Express Backend - Port 5000]                      │
│  - authRoutes            → verifyToken             │
│  - employeRoutes         → employeController       │
│  - dashboardRoutes       → dashboardController     │
│  - importHistoryRoutes   → importHistoryController │
│      ↓                                              │
│  [Controllers]                                      │
│  - Valider données                                  │
│  - Appeler modèles                                  │
│  - Retourner réponse                               │
│      ↓                                              │
│  [MongoDB - Port 27017]                             │
│  Database: RH_management                            │
│  - employes              → 10+ docs                │
│  - absences              → 50+ docs                │
│  - workloads             → 10+ docs                │
│  - monthlyRecaps         → 10+ docs (importés)     │
│  - turnoverDepartures    → 20+ docs (importés)     │
│  - users                 → 1 doc (admin)           │
│      ↓ (optionnel)                                  │
│  [Python IA - Port 5001]                            │
│  - Lire employes, absences, workloads              │
│  - Calculer scores risque                          │
│  - Retourner prédictions                           │
│      ↓                                              │
│  Réponse retournée au Frontend                      │
│  Affichage mis à jour                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎓 Chemin d'Apprentissage Recommandé

### Jour 1: Fondamentaux
- [ ] Lire `server.js` - Point d'entrée
- [ ] Lire `App.tsx` - Frontend routing
- [ ] Lancer application localement
- [ ] Explorer Dashboard

### Jour 2: Données
- [ ] Étudier models/ (Employe, Absence, etc.)
- [ ] Comprendre schema MongoDB
- [ ] Explorer database.js (data/)

### Jour 3: CRUD
- [ ] Lire employeController.js
- [ ] Lire employeRoutes.js
- [ ] Tester endpoints (Postman)

### Jour 4: Automapper 🎯
- [ ] Lire components/import.tsx
- [ ] Comprendre normalisation
- [ ] Comprendre détection + mappage

### Jour 5: Dashboard & IA
- [ ] Lire dashboardController.js
- [ ] Comprendre KPI calculations
- [ ] Explorer Python AI service

---

## 📚 Variables d'Environnement

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/RH_management
JWT_SECRET=6f958de72e70bcda8f94822bcbbbb3a...
```

### Frontend (.env)
```env
DANGEROUSLY_DISABLE_HOST_CHECK=true
PORT=3000
BROWSER=none
```

### MongoDB
- **Host:** 127.0.0.1
- **Port:** 27017
- **Database:** RH_management
- **Auth:** Aucune (local dev)

---

## 🔍 Fonctionnalités Principales

| Fonctionnalité | Statut | Notes |
|---|---|---|
| Gestion Employés | ✅ Complète | CRUD + Bulk |
| Gestion Absences | ✅ Complète | 4 types |
| Charge de Travail | ✅ Complète | Normal/High/Critical |
| Dashboard KPI | ✅ Complète | 6 derniers mois |
| Automapper Import | ✅ Complète | 3 types détectés |
| Export Fichiers | ✅ Partielle | Employés + Absences |
| Prédictions IA | ✅ Intégrée | Via Python |
| Authentification | ✅ Basique | 1 utilisateur |
| Historique Import | ✅ Complète | Log traçabilité |
| UI/Dashboard | ✅ Moderne | React + Recharts |

---

## 🚨 Problèmes Connus & À Améliorer

### Critique 🔴
- [ ] Authentification simplifiée (1 user hardcodé)
- [ ] Pas de gestion d'erreurs uniforme
- [ ] Pas de tests unitaires

### Important 🟡
- [ ] Pas de pagination sur /api/employees
- [ ] Pas de rate limiting
- [ ] Service Python non robuste

### Amélioration 🟢
- [ ] Logging insuffisant
- [ ] Validation côté serveur minimaliste
- [ ] Commentaires code manquants
- [ ] README absent

---

## 💡 Tips & Tricks

### Pour Déboguer Rapidement
```javascript
// Dans import.tsx console:
Object.keys(mapping[0])  // Voir structure mapping

// Dans backend:
console.log('🔍 [DEBUG]', variable)  // Logging stylé
```

### Tester l'Automapper
1. Créer Excel avec colonnes désordonnées
2. Importer via UI
3. Vérifier mappage automatique
4. Valider données
5. Voir suggestions IA

### Vérifier BD
```bash
mongo
use RH_management
db.employes.find().pretty()
db.monthlyrecaps.find().pretty()
```

---

## 📞 Questions Fréquentes

**Q: Où sont les tests?**
A: Aucun test implémenté. À faire!

**Q: Comment ajouter un nouvel endpoint?**
A: Routes → Controller → Model → BD. Suivre pattern existant.

**Q: Peut-on changer le user admin?**
A: Oui, voir authRoutes.js `initializeAdmin()`

**Q: Automapper support d'autres formats?**
A: CSV, XLSX, XLS, ODS supportés. Ajouter support dans `processFile()`

**Q: Service Python est obligatoire?**
A: Non, fallback local implémenté dans `aiPythonClient.js`

---

## 📖 Documentation Supplémentaire

Voir fichiers créés:
- **ANALYSE_COMPLETE_PROJET.md** - Analyse détaillée (20+ pages)
- **GUIDE_AUTOMAPPER_IMPORTATION.html** - Guide spécialisé + imprimable PDF

---

## ✅ Checklist: Prêt à Développer?

- [ ] MongoDB lancé localement
- [ ] Backend démarré (`npm run dev`)
- [ ] Frontend démarré (`npm start`)
- [ ] Connexion réussie (`manage@rh.com / admin123`)
- [ ] Dashboard affiche KPI
- [ ] Au moins 1 employé visible
- [ ] Automapper fonctionne avec Excel

**Si tous ✅:** Vous êtes prêt à contribuer! 🚀

---

**Dernière mise à jour:** 2026-06-09
**Version:** 1.0
**Langue:** Français
