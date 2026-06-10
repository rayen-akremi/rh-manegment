# 📊 ANALYSE COMPLÈTE DU PROJET RH-MANAGEMENT

---

## 1. 🎯 VUE D'ENSEMBLE DU PROJET

### Type d'Application
**Application Web Full-Stack pour la Gestion des Ressources Humaines (SIRH)**

### Objectif Principal
Système complet de gestion des ressources humaines avec:
- Gestion centralisée des employés
- Suivi des absences et congés
- Analyse des charges de travail
- Prédictions IA (risque de départ, absences, surcharge)
- Importation/exportation de données
- Tableaux de bord analytiques
- Analyse du turnover (rotation du personnel)

### Utilisation
Plateforme destinée à:
- Les responsables RH
- Les directeurs de département
- L'administration centrale
- Les gestionnaires de paie

---

## 2. 🛠️ ANALYSE DU TECH STACK

### Frontend (React/TypeScript)
```
Framework:     React 19.2.5
Langage:       TypeScript 4.9.5
Routage:       React Router 7.14.2
Animations:    Framer Motion 12.38.0
Graphiques:    Recharts 2.15.0
Icônes:        Lucide React 1.14.0
Toast:         React Hot Toast 2.6.0
Traitement:    PapaParse 5.5.3, XLSX 0.18.5
```

### Backend (Node.js/Express)
```
Runtime:       Node.js
Framework:     Express 5.2.1
SGBD:          MongoDB + Mongoose 9.6.1
Upload:        Multer 2.1.1
Requêtes:      Axios 1.16.0
CORS:          CORS 2.8.6
Statistiques:  Simple Statistics 7.8.9
Import/Export: XLSX 0.18.5
```

### Intelligence Artificielle (Python)
```
Framework:     Flask
Language:      Python 3.x
Base de données: MongoDB (PyMongo)
Port:          5001
```

### Infrastructure
```
Base de données: MongoDB local (127.0.0.1:27017)
Nom BD:          RH_management
Frontend Port:   3000
Backend Port:    5000
IA Port:         5001
```

### Outils de Développement
```
Frontend:      React Scripts, Jest
Backend:       Nodemon (dev), npm
Package mgr:   npm
Versioning:    Git
```

---

## 3. 📁 STRUCTURE DE DOSSIERS

```
RH-manegment/
├── backend/                     # API Express.js
│   ├── models/                  # Schémas MongoDB
│   │   ├── Employe.js          # Employés
│   │   ├── User.js             # Utilisateurs/Authentification
│   │   ├── Absence.js          # Absences et congés
│   │   ├── Workload.js         # Charges de travail
│   │   ├── MonthlyRecap.js     # Récapitulatif mensuel
│   │   ├── TurnoverDeparture.js # Départs
│   │   ├── TurnoverHistory.js  # Historique de rotation
│   │   ├── ImportHistory.js    # Historique d'importation
│   │   ├── ExportHistory.js    # Historique d'exportation
│   │   └── User.js             # Utilisateurs
│   │
│   ├── controllers/             # Logique métier
│   │   ├── employeController.js
│   │   ├── absenceController.js
│   │   ├── workloadController.js
│   │   ├── dashboardController.js
│   │   ├── importHistoryController.js
│   │   ├── exportHistoryController.js
│   │   └── turnoverController.js
│   │
│   ├── routes/                  # Endpoints API
│   │   ├── authRoutes.js       # /api/auth
│   │   ├── employeRoutes.js    # /api/employees
│   │   ├── absenceRoutes.js    # /api/absences
│   │   ├── workloadRoutes.js   # /api/workloads
│   │   ├── dashboardRoutes.js  # /api/dashboard
│   │   ├── importHistoryRoutes.js
│   │   ├── exportHistoryRoutes.js
│   │   ├── turnoverHistoryRoutes.js
│   │   ├── monthlyRecapRoutes.js
│   │   └── aiRoutes.js         # /api/ai
│   │
│   ├── services/                # Services externes
│   │   └── aiPythonClient.js   # Client pour Python IA
│   │
│   ├── uploads/                 # Fichiers uploadés
│   ├── server.js                # Point d'entrée Express
│   ├── package.json
│   └── .env                     # Variables d'environnement
│
├── frontend/                    # Application React
│   ├── src/
│   │   ├── components/          # Composants React
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── employee.tsx
│   │   │   ├── AbsenceManagement.tsx
│   │   │   ├── WorkloadManagement.tsx
│   │   │   ├── AIPrediction.tsx
│   │   │   ├── import.tsx       # 🔑 Système d'importation
│   │   │   ├── ExportFile.tsx
│   │   │   ├── Turnover.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   ├── ThemeToggle.tsx
│   │   │   └── settings.tsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Gestion d'authentification
│   │   │
│   │   ├── style/               # CSS stylesheets
│   │   ├── App.tsx              # Routeur principal
│   │   └── index.tsx            # Point d'entrée
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── hr-ai-predictor/             # Service Python IA
│   ├── app.py                   # Application Flask
│   ├── requirements.txt
│   └── services/
│       ├── ai_predictor.py      # Algorithmes d'IA
│       └── database.py          # Utilitaires BD
│
├── data/                        # MongoDB database files
├── .env                         # Config root
└── package.json                 # Dependencies root
```

### Pattern Architectural: MVC
```
Route (Frontend/API) → Controller → Service/Model → Database
```

---

## 4. 📋 MODÈLES & ENTITÉS PRINCIPALES

### 1. **Employe (Employé)**
```javascript
{
  employee_id: String (unique),      // ID unique
  matricule: String (unique),         // Numéro de matricule
  prenom: String,                     // Prénom
  nom: String,                        // Nom
  email: String (unique),             // Email
  age: Number,                        // Âge
  departement: String,                // Département
  poste: String,                      // Poste
  status: Enum ['Actif', 'En congé', 'Absent'],
  joinDate: Date,                     // Date d'embauche
  // Champs du récapitulatif mensuel
  regime: String,                     // Régime de travail
  workforceType: String,              // Type d'effectif
  gender: String,                     // Genre
  htHours: Number,                    // Heures normales
  overtime25/50/100: Number,          // Heures de majoration
  nightHours: Number,                 // Heures de nuit
  absenceDays/Hours: Number           // Jours/Heures d'absence
}
```

### 2. **Absence**
```javascript
{
  absence_id: String (unique),
  employee_id: String,
  name: String,
  department: String,
  type: Enum ['Sick leave', 'Vacation', 'Maternity', 'Other'],
  days: Number,
  startDate: Date
}
```

### 3. **Workload (Charge de Travail)**
```javascript
{
  workload_id: String (unique),
  employee_id: String,
  name: String,
  department: String,
  weeklyHours: Number (défaut: 40),
  overtimeHours: Number (défaut: 0),
  status: Enum ['Normal', 'High', 'Critical']
}
```

### 4. **MonthlyRecap (Récapitulatif Mensuel)** 🔑
```javascript
{
  matricule: String (unique),        // Clé d'import
  employeeName: String,
  regime: String,
  department: String,
  workforceType: String,
  gender: String,
  hireDate: Date,
  htHours: Number,                   // H. T
  overtime25/50/100: Number,         // Majorations
  nightHours: Number,                // H. NUIT
  absenceDays/Hours: Number,         // ABS./jour
  sourceSheet: String,               // Feuille source
  sourceRowNumber: Number,           // N° ligne source
  importOrder: Number                // Ordre d'importation
}
```

### 5. **TurnoverDeparture (Départ)**
```javascript
{
  month: Date,
  employeeName: String,
  position: String,
  department: String,
  hireDate: Date,
  departureDate: Date,
  seniority: String,                 // Ancienneté
  gender: String,
  organizationType: String,
  college: String,
  workforceType: String,
  departureReason: String,           // Motif
  departureCause: String,            // Cause
  cumulative: Number,                // Cumul
  sourceYear/Sheet/Row/Order: ...    // Métadonnées d'import
}
```

### 6. **TurnoverHistory (Historique Rotation)**
```javascript
{
  month: String ['Jan', 'Fév', 'Mar', ...],
  year: Number,
  turnoverRate: Number,
  departures: Number,
  hires: Number
}
```

### 7. **User (Utilisateur)**
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashé avec salt),
  avatar: String,                    // Base64 ou URL
  sessions: [{
    token: String,
    createdAt: Date
  }],
  createdAt/updatedAt: Date
}
```

### 8. **ImportHistory & ExportHistory**
```javascript
{
  filename: String,
  type: String,                      // Turnover, MonthlyRecap, etc.
  rows: Number,                      // Nombre de lignes
  status: Enum ['Success', 'Partial', 'Failed'],
  createdAt: Date
}
```

---

## 5. 🔑 MODULES & FONCTIONNALITÉS

### Module 1: Gestion des Employés
**Routes:**
- `GET  /api/employees` - Tous les employés
- `POST /api/employees` - Créer un employé
- `PUT  /api/employees/:id` - Modifier
- `DELETE /api/employees/:id` - Supprimer simple
- `POST /api/employees/bulk/delete` - Suppression multiple

**Fonctionnalités:**
- Création/modification/suppression d'employés
- Import en masse
- Suppression multiple avec nettoyage en cascade
- Synchronisation avec données importées

---

### Module 2: Gestion des Absences
**Routes:**
- `GET  /api/absences` - Lister
- `POST /api/absences` - Créer absence
- `PUT  /api/absences/:id` - Modifier
- `DELETE /api/absences/:id` - Supprimer

**Types d'absences:**
- Sick leave (Congé maladie)
- Vacation (Vacances)
- Maternity (Congé maternité)
- Other (Autre)

---

### Module 3: Gestion de la Charge de Travail
**Routes:**
- `GET  /api/workloads` - Lister
- `POST /api/workloads` - Créer
- `PUT  /api/workloads/:id` - Modifier
- `DELETE /api/workloads/:id` - Supprimer

**Statuts:**
- Normal (< 40h/semaine)
- High (40-50h/semaine)
- Critical (> 50h/semaine)

---

### Module 4: Dashboard & KPI
**Routes:**
- `GET /api/dashboard/kpi` - Indicateurs clés
- `GET /api/dashboard/monthly-data` - Données mensuelles
- `GET /api/dashboard/absence-reasons` - Raisons d'absence

**Indicateurs:**
- Taux d'absence
- Taux de rotation (turnover)
- Nombre total d'employés
- Heures de majoration totales
- Données mensuelles (6 derniers mois)

---

### Module 5: Prédictions IA 🤖
**Routes:**
- `POST /api/ai/predict-absence/:employeeId` - Prédire absences
- `POST /api/ai/predict-turnover/:employeeId` - Risque de départ
- `POST /api/ai/predict-workload/:employeeId` - Surcharge
- `POST /api/ai/batch-predict` - Prédictions batch

**Algorithmes:**
- Analyse des tendances historiques
- Scoring de risque
- Classification du personnel
- Prédictions 6 mois

**Service Python (port 5001):**
- Traitement des données
- Calcul des scores
- Analyse de tendances

---

### Module 6: Importation de Fichiers 🔑 (LE PLUS IMPORTANT)
**Routes:**
- `POST /api/turnover-history/departures/import` - Importer turnover
- `POST /api/monthly-recap/import` - Importer récapitulatif mensuel
- `GET  /api/import-history` - Historique

**Formats supportés:**
- `.xlsx` (Excel)
- `.xls` (Excel ancien)
- `.ods` (OpenDocument Calc)
- `.csv` (Texte virgule)

**Système d'Automapper:** 🎯 (voir section 6)

---

### Module 7: Exportation de Fichiers
**Routes:**
- `GET /api/export-history/employees` - Exporter employés
- `GET /api/export-history/absences` - Exporter absences
- `GET /api/export-history/history` - Historique exports

---

### Module 8: Authentification
**Routes:**
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/logout-all` - Fermer toutes sessions
- `GET  /api/auth/me` - Profil utilisateur
- `PUT  /api/auth/profile` - Modifier profil

**Admin par défaut:**
- Email: `manage@rh.com`
- Mot de passe: `admin123`

**Sécurité:**
- Tokens de session
- Hachage de mot de passe avec salt
- Authentification Bearer Token

---

## 6. 🎯 SYSTÈME D'AUTOMAPPER D'IMPORTATION

### Qu'est-ce que l'Automapper?
Système intelligent qui **détecte automatiquement les colonnes** d'un fichier importé et les **mappe aux champs système** sans intervention manuelle.

### Détection Automatique (import.tsx)
```typescript
// 1. Détection du type de fichier
detectHeaderRow()            // Détecte format Turnover
detectMonthlyRecapHeaderRow() // Détecte format Récap mensuel

// 2. Normalisation des en-têtes
normalize(value)  // Supprime accents, minuscules, espaces

// 3. Mappage automatique
autoMapColumns(cols, fileType) // Mappe chaque colonne
```

### Fonctionnement Détaillé

#### Étape 1: Reconnaissance des colonnes
```typescript
const turnoverFields = [
  'Mois', 'Nom et Prénom', 'Position', 'Département',
  "Date d'embauche", 'Date de départ', 'Ancienneté', 'Genre',
  "Type d'organisation", 'Collège', "Type d'effectif",
  'Motif de départ', 'Cause de départ', 'Cumul'
];

const monthlyRecapFields = [
  'Matricule', 'Nom & Prénom', 'Régime',
  'Département (New)', "Type d'effectif", 'Genre',
  "Date d'embauche", 'H. T', '25 %', '50 %', '100 %',
  'H. NUIT', 'ABS./jour'
];
```

#### Étape 2: Normalisation
```typescript
const normalize = (value: string) =>
  value
    .toLowerCase()                          // Minuscules
    .normalize('NFD')                       // Décomposition accents
    .replace(/[\u0300-\u036f]/g, '')       // Suppression accents
    .replace(/['']/g, "'")                 // Unification apostrophes
    .trim();

// Exemples:
normalize("Nom et Prénom")  → "nom et prenom"
normalize("DÉPARTEMENT")     → "departement"
normalize("Date d'embauche") → "date d embauche"
```

#### Étape 3: Correspondance des colonnes
```typescript
autoMapColumns(cols: string[], fileType: DetectedFileType) {
  const newMapping: ColumnMapping[] = [];
  const fields = fileType === 'turnover' ? turnoverFields : 
                 fileType === 'monthlyRecap' ? monthlyRecapFields : 
                 systemFields;

  fields.forEach((systemField) => {
    const normalizedField = normalize(systemField);
    
    // Cherche la colonne qui match
    const matchedCol = cols.find((col) => {
      const normalizedCol = normalize(col);
      return normalizedCol.includes(normalizedField) || 
             normalizedField.includes(normalizedCol);
    });
    
    newMapping.push({ 
      systemField, 
      sourceColumn: matchedCol || '' 
    });
  });

  setMapping(newMapping);
}
```

### Exemple de Mappage Automatique

**Fichier source (colonnes désordonnées):**
| MOIS    | NOM COMPLET        | POSTE        | DEPT       |
|---------|-------------------|--------------|-----------|
| 2026-04 | Jean Dupont      | Manager      | Ventes    |
| 2026-04 | Marie Martin     | Développeur  | IT        |

**Détection:**
1. Colonne "MOIS" → Champ "Mois" ✓
2. Colonne "NOM COMPLET" → Champ "Nom et Prénom" ✓
3. Colonne "POSTE" → Champ "Position" ✓
4. Colonne "DEPT" → Champ "Département" ✓

**Résultat de mappage:**
```javascript
[
  { systemField: "Mois", sourceColumn: "MOIS" },
  { systemField: "Nom et Prénom", sourceColumn: "NOM COMPLET" },
  { systemField: "Position", sourceColumn: "POSTE" },
  { systemField: "Département", sourceColumn: "DEPT" }
]
```

### Types de Fichiers Reconnus

#### 1. **Format Turnover** (Rotation du personnel)
**Critères de détection:**
- Contient "Nom et Prénom"
- Minimum 4 champs turnover reconnus
- Champs typiques: Mois, Date d'embauche, Date de départ, Ancienneté

**Utilisé pour:** Analyser les départs volontaires/involontaires

#### 2. **Format Monthly Recap** (Récapitulatif mensuel)
**Critères de détection:**
- Contient "Matricule" ET "Nom & Prénom"
- Minimum 6 champs récap reconnus
- Champs typiques: H.T, Majorations (25%, 50%, 100%), ABS./jour

**Utilisé pour:** Importer heures, majorations, absences

#### 3. **Format Générique** (Autre)
- Employés génériques
- Données personnalisées
- Format libre

### Validation Après Import
```typescript
const validateData = (rows: RawRow[]) => {
  const errors: string[] = [];
  rows.forEach((row, idx) => {
    const absenceDays = parseFloat(row['Absence Days'] || '0');
    const overtime = parseFloat(row['Overtime Hours'] || '0');
    
    if (absenceDays < 0) 
      errors.push(`Ligne ${idx + 2}: Absence négative (${absenceDays})`);
    if (overtime < 0) 
      errors.push(`Ligne ${idx + 2}: Heures sup négatives (${overtime})`);
    if (absenceDays > 365) 
      errors.push(`Ligne ${idx + 2}: Absence irréaliste (${absenceDays} jours)`);
    if (overtime > 100) 
      errors.push(`Ligne ${idx + 2}: Heures sup excessives (${overtime}h)`);
  });
  setValidationErrors(errors);
};
```

### Suggestions IA Pendant l'Import
```typescript
const runAIChecks = (rows: RawRow[], cols: string[], fileType: DetectedFileType) => {
  const suggestions: string[] = [];

  if (fileType === 'turnover') {
    const missingHeaders = turnoverFields.filter((field) =>
      !cols.some((col) => normalize(col) === normalize(field))
    );
    if (missingHeaders.length) {
      suggestions.push(`Colonnes manquantes: ${missingHeaders.join(', ')}`);
    } else {
      suggestions.push('Format Turnover détecté avec succès');
    }
  }

  // Vérifie les doublons
  const duplicates = [...];
  if (duplicates.length) 
    suggestions.push(`Doublons détectés: ${duplicates.join(', ')}`);

  // Valide les domaines/départements
  rows.forEach((row, idx) => {
    if (row['Department'] && !standardDepts.includes(row['Department'])) {
      suggestions.push(`Département non standard: ${row['Department']}`);
    }
  });
};
```

### Flux Complet d'Importation

```
┌─────────────────────────────────────────────────────────┐
│ 1. SÉLECTION DU FICHIER                                 │
│    └─ Formats: .xlsx, .xls, .ods, .csv                │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 2. LECTURE & PARSING                                    │
│    ├─ XLSX/ODS: XLSX.read()                            │
│    └─ CSV: PapaParse                                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 3. DÉTECTION DU TYPE DE FICHIER                         │
│    ├─ detectHeaderRow() → Type Turnover               │
│    ├─ detectMonthlyRecapHeaderRow() → Type Recap      │
│    └─ Sinon → Type Générique                          │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 4. NORMALISATION DES EN-TÊTES                           │
│    └─ normalize(header) → minuscules, sans accents     │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 5. AUTOMAPPING DES COLONNES 🎯                          │
│    ├─ Cherche les champs système                       │
│    ├─ Mappe chaque colonne source                      │
│    └─ Crée ColumnMapping[]                             │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 6. VALIDATION DES DONNÉES                               │
│    ├─ Contrôles de plages (absences, heures)          │
│    └─ Détection de doublons                            │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 7. SUGGESTIONS IA                                       │
│    ├─ Champs manquants                                 │
│    ├─ Formats incorrects                               │
│    └─ Données suspectes                                │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 8. APERÇU ET CONFIRMATION                               │
│    └─ Utilisateur valide l'import                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 9. ENVOI AU BACKEND                                     │
│    └─ POST /api/[type]/import                          │
└────────────────┬────────────────────────────────────────┘
                 │
┌─────────────────────────────────────────────────────────┐
│ 10. SAUVEGARDE EN BD                                    │
│     ├─ MonthlyRecap / TurnoverDeparture               │
│     └─ Enregistrement dans ImportHistory              │
└──────────────────────────────────────────────────────────┘
```

---

## 7. 📡 ENDPOINTS API PRINCIPAUX

### Authentication
```
POST   /api/auth/login              - Connexion
POST   /api/auth/logout             - Déconnexion
POST   /api/auth/logout-all         - Fermer toutes sessions
GET    /api/auth/me                 - Profil utilisateur
PUT    /api/auth/profile            - Modifier profil
```

### Employees
```
GET    /api/employees               - Lister tous
POST   /api/employees               - Créer
PUT    /api/employees/:id           - Modifier
DELETE /api/employees/:id           - Supprimer
POST   /api/employees/bulk/delete   - Supprimer multiple
```

### Absences
```
GET    /api/absences                - Lister
POST   /api/absences                - Créer
PUT    /api/absences/:id            - Modifier
DELETE /api/absences/:id            - Supprimer
```

### Workloads
```
GET    /api/workloads               - Lister
POST   /api/workloads               - Créer
PUT    /api/workloads/:id           - Modifier
DELETE /api/workloads/:id           - Supprimer
```

### Dashboard
```
GET    /api/dashboard/kpi           - KPI (absence, turnover, etc.)
GET    /api/dashboard/monthly-data  - Données 6 derniers mois
GET    /api/dashboard/absence-reasons - Répartition absences
```

### Turnover & Rotation
```
GET    /api/turnover-history                    - Historique
POST   /api/turnover-history/departures/import  - Importer
```

### Monthly Recap (Récap. Mensuel)
```
GET    /api/monthly-recap                       - Lister
POST   /api/monthly-recap/import                - Importer
```

### Import/Export History
```
GET    /api/import-history                      - Historique imports
GET    /api/import-history/type/:type           - Par type
DELETE /api/import-history/:id                  - Supprimer

GET    /api/export-history/employees            - Export employés
GET    /api/export-history/absences             - Export absences
```

### AI Predictions
```
POST   /api/ai/predict-absence/:employeeId      - Prédire absences
POST   /api/ai/predict-turnover/:employeeId     - Risque turnover
POST   /api/ai/predict-workload/:employeeId     - Surcharge
POST   /api/ai/batch-predict                    - Batch prédictions
GET    /api/ai/turnover-trend                   - Tendance turnover
```

### Test
```
GET    /api/test                    - Test connectivité
```

---

## 8. 📁 FICHIERS CLÉS À COMPRENDRE

### Backend
| Fichier | Rôle | Priorité |
|---------|------|----------|
| `server.js` | Point d'entrée Express | 🔴 CRITIQUE |
| `models/Employe.js` | Schéma employé | 🔴 CRITIQUE |
| `models/MonthlyRecap.js` | Schéma récap mensuel | 🔴 CRITIQUE |
| `controllers/employeController.js` | Logique employé | 🟡 IMPORTANT |
| `controllers/dashboardController.js` | Calcul KPI | 🟡 IMPORTANT |
| `routes/authRoutes.js` | Authentification | 🟡 IMPORTANT |
| `services/aiPythonClient.js` | Client IA | 🟡 IMPORTANT |

### Frontend
| Fichier | Rôle | Priorité |
|---------|------|----------|
| `App.tsx` | Routeur principal | 🔴 CRITIQUE |
| `components/import.tsx` | **🎯 Système d'importation** | 🔴 CRITIQUE |
| `components/Dashboard.tsx` | Tableau de bord | 🟡 IMPORTANT |
| `context/AuthContext.tsx` | Gestion auth | 🟡 IMPORTANT |
| `components/employee.tsx` | Gestion employés | 🟢 UTILE |
| `components/AIPrediction.tsx` | Prédictions IA | 🟢 UTILE |

### Python IA
| Fichier | Rôle |
|---------|------|
| `app.py` | Application Flask |
| `services/ai_predictor.py` | Algorithmes IA |
| `services/database.py` | Utils MongoDB |

---

## 9. ⚙️ CONFIGURATION & SETUP

### Variables d'Environnement (Backend)
```env
# backend/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/RH_management
JWT_SECRET=6f958de72e70bcda8f94822bcbbbb3a...
```

### Variables d'Environnement (Frontend)
```env
# frontend/.env
DANGEROUSLY_DISABLE_HOST_CHECK=true
PORT=3000
BROWSER=none
```

### Configuration MongoDB
```
URL:      mongodb://127.0.0.1:27017
Base:     RH_management
Port:     27017
Auth:     (aucune configurée)
```

### Configuration Python IA
```
URL:      http://localhost:5001
Framework: Flask
Timeout:  30 secondes (batch)
Fallback: Calcul local si service indisponible
```

---

## 10. 🚀 INSTRUCTIONS DE SETUP & LANCEMENT

### Prérequis
```
✓ Node.js 14+ installé
✓ MongoDB lancé (local ou distant)
✓ Python 3.x (pour IA)
✓ npm ou yarn
✓ Git
```

### Étape 1: Initialisation MongoDB
```bash
# S'assurer que MongoDB est lancé
# Windows: Services MongoDB ou mongod.exe
# Linux/Mac: brew services start mongodb-community

# Vérifier la connexion
mongo mongodb://127.0.0.1:27017
```

### Étape 2: Installation Backend
```bash
cd backend
npm install
```

### Étape 3: Installation Frontend
```bash
cd frontend
npm install
```

### Étape 4: Installation Python IA
```bash
cd hr-ai-predictor
pip install -r requirements.txt
```

### Étape 5: Lancement du Backend
```bash
cd backend
npm start          # Production
npm run dev        # Développement avec Nodemon
```
✓ Serveur écoute sur `http://localhost:5000`

### Étape 6: Lancement du Frontend
```bash
cd frontend
npm start
```
✓ Application accèssible sur `http://localhost:3000`

### Étape 7: Lancement Python IA (optionnel)
```bash
cd hr-ai-predictor
python app.py
```
✓ Service IA écoute sur `http://localhost:5001`

### Connexion Initiale
```
Email:           manage@rh.com
Mot de passe:    admin123
```

---

## 11. ⚠️ PROBLÈMES IDENTIFIÉS & POINTS À AMÉLIORER

### 1. **Fichiers de Configuration Manquants**
- ❌ `.env.example` non fourni
- ❌ README.md absent
- ❌ Documentation d'installation incomplète
- ✅ **Action:** Créer `.env.example` et README

### 2. **Authentification Simplifiée**
- ⚠️ Email admin en dur (`manage@rh.com`)
- ⚠️ Mot de passe en dur (`admin123`)
- ⚠️ JWT_SECRET exposé dans le code
- ✅ **Action:** Utiliser JWT, rôles RBAC

### 3. **Gestion d'Erreurs Incomplète**
- ⚠️ Pas de try-catch uniforme
- ⚠️ Messages d'erreur génériques
- ✅ **Action:** Middleware centralisé de gestion d'erreurs

### 4. **Validation Insuffisante**
- ⚠️ Peu de validation côté serveur
- ⚠️ Pas de sanitization des entrées
- ✅ **Action:** Utiliser `joi` ou `zod`

### 5. **Service Python IA Décentralisé**
- ⚠️ Pas de gestion de session
- ⚠️ Peut timeout sans fallback gracieux
- ✅ **Action:** Intégrer directement ou meilleure gestion

### 6. **Pas de Logging Structuré**
- ⚠️ Pas de logs persistent
- ❌ Logs uniquement en console
- ✅ **Action:** Winston ou Pino

### 7. **Système d'Importation à Améliorer**
- ⚠️ Détection header basée sur regex
- ⚠️ Pas de gestion des fichiers corrompus
- ⚠️ Import type turnover pas d'endpoint backend visible
- ✅ **Action:** Meilleure détection, gestion d'erreurs

### 8. **Performance**
- ⚠️ Pas de pagination sur `/api/employees`
- ⚠️ Pas d'index sur les queries fréquentes
- ⚠️ MongoDB indexes incomplets
- ✅ **Action:** Pagination, caching Redis

### 9. **Sécurité**
- ⚠️ CORS pas protégé `cors()`
- ⚠️ Pas de rate limiting
- ⚠️ Pas de validation CSRF
- ✅ **Action:** Helmet, express-rate-limit

### 10. **Tests**
- ❌ Aucun test unitaire
- ❌ Aucun test d'intégration
- ✅ **Action:** Jest + Supertest

---

## 12. 📚 FLUX DE DONNÉES COMPLET

### Importation Turnover
```
Frontend (import.tsx)
    ↓ Sélectionne fichier
    ↓ processWorkbook() / parseCSV()
    ↓ detectHeaderRow()
    ↓ rowsToObjects()
    ↓ autoMapColumns() 🎯
    ↓ validateData()
    ↓ runAIChecks()
    ↓ Affiche aperçu + suggestions
    ↓ Utilisateur valide
    ↓ POST /api/turnover-history/departures/import
    
Backend (turnoverController)
    ↓ Parse FormData
    ↓ Traite lignes
    ↓ Upsert dans TurnoverDeparture
    ↓ Enregistre dans ImportHistory
    ↓ Retourne résumé
    
Frontend
    ↓ Affiche confirmation
    ↓ Dispatche événement 'data-imported'
    ↓ Dashboard se rafraîchit
```

### Affichage Dashboard
```
React Component (Dashboard.tsx)
    ↓ useEffect(() => fetch('/api/dashboard/kpi'))
    ↓ dashboardController.getKpi()
    
Backend
    ↓ Count MonthlyRecap ou Employe
    ↓ Aggregate absences (Absence / MonthlyRecap)
    ↓ Aggregate overtime (MonthlyRecap / Workload)
    ↓ Query TurnoverHistory ou TurnoverDeparture
    ↓ Calcule taux (absence, turnover)
    ↓ Retourne { absenceRate, turnoverRate, ...}
    
Frontend
    ↓ Met à jour état
    ↓ Recharts affiche graphiques
```

### Prédictions IA
```
Frontend (AIPrediction.tsx)
    ↓ Clique "Predict Turnover"
    ↓ POST /api/ai/predict-turnover/:employeeId
    
Backend (aiRoutes → aiPythonClient)
    ↓ POST http://localhost:5001/predict/turnover/:employeeId
    
Python Service
    ↓ db.employes.find_one()
    ↓ db.absences.find()
    ↓ db.workloads.find()
    ↓ Calcule risk_score
    ↓ Retourne { riskScore, riskLevel, ... }
    
Backend
    ↓ Cache résultat
    ↓ Retourne à Frontend
    
Frontend
    ↓ Affiche score avec couleur (vert/orange/rouge)
```

---

## 13. 🎓 RECOMMANDATIONS D'ÉTUDE

### Pour Maîtriser le Projet

1. **Commencer par Frontend**
   - `App.tsx` - Comprendre routage
   - `components/Login.tsx` - Authentification
   - `components/Dashboard.tsx` - Affichage données
   - `components/import.tsx` - Système d'importation 🎯

2. **Puis Backend**
   - `server.js` - Point d'entrée
   - `models/` - Schémas BD
   - `controllers/employeController.js` - CRUD
   - `controllers/dashboardController.js` - Calculs

3. **Puis Intégration**
   - Comment les routes s'appellent
   - Flow des données
   - Gestion d'authentification

4. **Puis Avancé**
   - Prédictions IA (Python)
   - Importation fichiers
   - Optimisations DB

---

## 14. 📊 STATISTIQUES DU PROJET

| Métrique | Valeur |
|----------|--------|
| Fichiers JS/TS | ~30+ |
| Modèles MongoDB | 9 |
| Routes API | 30+ |
| Endpoints | 40+ |
| Composants React | 13 |
| Services Python | 1 |
| Lignes de code | ~10,000+ |
| Tech Frontend | React + TypeScript |
| Tech Backend | Express + Mongoose |
| Tech IA | Python + Flask |

---

## 15. 📝 CONCLUSION

**RH-Management** est une application SIRH complète avec:
- ✅ Gestion complète des ressources humaines
- ✅ Système intelligent d'importation avec détection auto
- ✅ Prédictions IA (turnover, absences, surcharge)
- ✅ Tableaux de bord analytiques
- ✅ Architecture MVC bien structurée
- ✅ Tech stack moderne (React, Express, MongoDB)

**Domaines clés à maîtriser:**
1. **Automapper d'importation** - Système de détection/mappage
2. **Modèle de données** - 9 collections interdépendantes
3. **Flux API** - 40+ endpoints interconnectés
4. **Authentification** - Session tokens
5. **Prédictions IA** - Service Python décentralisé

---

**Document généré:** 2026-06-09
**Version:** 1.0
**Langue:** Français
