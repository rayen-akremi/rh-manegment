# 🏗️ ARCHITECTURE & FLUX DE DONNÉES - RH MANAGEMENT

## 📐 Architecture Générale

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        SYSTÈME RH MANAGEMENT COMPLET                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────┐              ┌──────────────────────┐              │
│  │   UTILISATEUR      │              │   ADMINISTRATEUR RH  │              │
│  │   - Manager HR     │              │   - Responsable SIRH │              │
│  │   - Dir. Général   │              │   - Gestionnaire Paie│              │
│  └────────────────────┘              └──────────────────────┘              │
│           │                                      │                         │
│           └──────────────────┬───────────────────┘                         │
│                              ↓                                             │
│      ┌──────────────────────────────────────────────────┐                 │
│      │      INTERFACE UTILISATEUR (React Frontend)      │                 │
│      │         URL: http://localhost:3000               │                 │
│      ├──────────────────────────────────────────────────┤                 │
│      │                                                  │                 │
│      │  ┌─────────────────────────────────────────┐   │                 │
│      │  │  Pages Principales                     │   │                 │
│      │  ├─────────────────────────────────────────┤   │                 │
│      │  │ 1. Login.tsx                           │   │                 │
│      │  │ 2. Dashboard.tsx         (KPI, charts) │   │                 │
│      │  │ 3. employee.tsx          (CRUD emp.)   │   │                 │
│      │  │ 4. AbsenceManagement.tsx (Congés)      │   │                 │
│      │  │ 5. WorkloadManagement.tsx(Charge)      │   │                 │
│      │  │ 6. AIPrediction.tsx      (Prédictions) │   │                 │
│      │  │ 7. import.tsx 🎯        (AUTOMAPPER) │   │                 │
│      │  │ 8. ExportFile.tsx        (Exports)     │   │                 │
│      │  │ 9. Turnover.tsx          (Rotation)    │   │                 │
│      │  │ 10. settings.tsx         (Config)      │   │                 │
│      │  └─────────────────────────────────────────┘   │                 │
│      │                                                  │                 │
│      │  AuthContext.tsx ← Gestion sessions            │                 │
│      │                                                  │                 │
│      └──────────────────────────────────────────────────┘                 │
│                     ↓ Fetch / REST API                                    │
│      ┌──────────────────────────────────────────────────┐                 │
│      │    API EXPRESS BACKEND                           │                 │
│      │    URL: http://localhost:5000/api               │                 │
│      ├──────────────────────────────────────────────────┤                 │
│      │                                                  │                 │
│      │  Routes Layer:                                  │                 │
│      │  ├─ /auth           → authRoutes.js             │                 │
│      │  ├─ /employees      → employeRoutes.js          │                 │
│      │  ├─ /absences       → absenceRoutes.js          │                 │
│      │  ├─ /workloads      → workloadRoutes.js         │                 │
│      │  ├─ /dashboard      → dashboardRoutes.js        │                 │
│      │  ├─ /import-history → importHistoryRoutes.js    │                 │
│      │  ├─ /export-history → exportHistoryRoutes.js    │                 │
│      │  ├─ /turnover-history → turnoverHistoryRoutes.js│                 │
│      │  ├─ /monthly-recap  → monthlyRecapRoutes.js     │                 │
│      │  └─ /ai             → aiRoutes.js               │                 │
│      │                                                  │                 │
│      │  Controllers Layer:                             │                 │
│      │  ├─ employeController       (CRUD employés)     │                 │
│      │  ├─ absenceController       (Gestion absences)  │                 │
│      │  ├─ workloadController      (Charge travail)    │                 │
│      │  ├─ dashboardController     (KPI calculations)  │                 │
│      │  ├─ importHistoryController (Log imports)       │                 │
│      │  ├─ turnoverController      (Rotation)          │                 │
│      │  └─ exportHistoryController (Log exports)       │                 │
│      │                                                  │                 │
│      │  Services Layer:                                │                 │
│      │  └─ aiPythonClient.js (Communication Python)    │                 │
│      │                                                  │                 │
│      └──────────────────────────────────────────────────┘                 │
│                     ↓ Mongoose ODM                                        │
│      ┌──────────────────────────────────────────────────┐                 │
│      │     MODELS / SCHÉMAS (9 collections)            │                 │
│      ├──────────────────────────────────────────────────┤                 │
│      │                                                  │                 │
│      │  📍 Employe.js                                  │                 │
│      │     └─ Employés actifs du système               │                 │
│      │  📍 Absence.js                                  │                 │
│      │     └─ Absences, congés, congé maladie          │                 │
│      │  📍 Workload.js                                 │                 │
│      │     └─ Charge de travail, heures supp           │                 │
│      │  📍 MonthlyRecap.js 🔑                          │                 │
│      │     └─ Récapitulatif mensuel importé            │                 │
│      │  📍 TurnoverDeparture.js 🔑                     │                 │
│      │     └─ Départs importés                         │                 │
│      │  📍 TurnoverHistory.js                          │                 │
│      │     └─ Historique rotation mensuel              │                 │
│      │  📍 User.js                                     │                 │
│      │     └─ Utilisateurs + sessions                  │                 │
│      │  📍 ImportHistory.js                            │                 │
│      │     └─ Log de tous les imports                  │                 │
│      │  📍 ExportHistory.js                            │                 │
│      │     └─ Log de tous les exports                  │                 │
│      │                                                  │                 │
│      └──────────────────────────────────────────────────┘                 │
│                     ↓ MongoDB Driver                                      │
│      ┌──────────────────────────────────────────────────┐                 │
│      │         MONGODB DATABASE                        │                 │
│      │    URL: mongodb://127.0.0.1:27017               │                 │
│      │    Database: RH_management                      │                 │
│      ├──────────────────────────────────────────────────┤                 │
│      │                                                  │                 │
│      │  Collection Statistics:                         │                 │
│      │  ├─ employes              : 10+ documents       │                 │
│      │  ├─ absences              : 50+ documents       │                 │
│      │  ├─ workloads             : 10+ documents       │                 │
│      │  ├─ monthlyrecaps         : 10+ documents       │                 │
│      │  ├─ turnoverdepartures    : 20+ documents       │                 │
│      │  ├─ turnoverhistories     : 6+ documents        │                 │
│      │  ├─ users                 : 1-2 documents       │                 │
│      │  ├─ importhistories       : Audit trail         │                 │
│      │  └─ exporthistories       : Audit trail         │                 │
│      │                                                  │                 │
│      │  WiredTiger Storage Engine                      │                 │
│      │  - Data files: /data/*.wt                       │                 │
│      │  - Indexes optimisées                           │                 │
│      │  - Snapshots périodiques                        │                 │
│      │                                                  │                 │
│      └──────────────────────────────────────────────────┘                 │
│                            ↓                                              │
│      ┌──────────────────────────────────────────────────┐                 │
│      │   PYTHON AI SERVICE (Optionnel)                 │                 │
│      │   URL: http://localhost:5001                    │                 │
│      ├──────────────────────────────────────────────────┤                 │
│      │                                                  │                 │
│      │  Flask Application                              │                 │
│      │  ├─ /health                (Vérification)       │                 │
│      │  ├─ /predict/absence/:id   (Prédire absences)  │                 │
│      │  ├─ /predict/turnover/:id  (Prédire départ)    │                 │
│      │  ├─ /predict/workload/:id  (Prédire surcharge) │                 │
│      │  ├─ /batch-predict         (Batch prédictions) │                 │
│      │  └─ /turnover-trend        (Tendance)          │                 │
│      │                                                  │                 │
│      │  Services:                                      │                 │
│      │  ├─ ai_predictor.py        (Algorithmes IA)    │                 │
│      │  └─ database.py            (Utilitaires BD)    │                 │
│      │                                                  │                 │
│      │  Données Consommées:                            │                 │
│      │  ├─ employes               (Profils)           │                 │
│      │  ├─ absences               (Historique)        │                 │
│      │  ├─ workloads              (Charges)           │                 │
│      │  └─ turnover-departures    (Départs hist.)     │                 │
│      │                                                  │                 │
│      └──────────────────────────────────────────────────┘                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux Données: Importation Turnover

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    FLUX COMPLET IMPORTATION TURNOVER                      │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  UTILISATEUR SÉLECTIONNE FICHIER TURNOVER (Excel/CSV/ODS)               │
│                        ↓                                                 │
│  FRONTEND (import.tsx)                                                  │
│  ├─ FileReader.readAsArrayBuffer() / readAsText()                       │
│  ├─ XLSX.read() OU Papa.parse()                                         │
│  └─ processWorkbook()                                                   │
│                        ↓                                                 │
│  DÉTECTION DU TYPE                                                      │
│  ├─ detectHeaderRow() [Cherche "Nom et Prénom", etc.]                   │
│  ├─ Score minimum ≥ 4 champs reconnus                                   │
│  └─ Résultat: TYPE = "turnover" ✓                                       │
│                        ↓                                                 │
│  EXTRACTION DONNÉES                                                     │
│  ├─ rowsToObjects(rows, headerIndex)                                    │
│  ├─ Crée tableau d'objets {col1: val1, col2: val2, ...}                │
│  └─ Filtre lignes vides                                                 │
│                        ↓                                                 │
│  NORMALISATION EN-TÊTES 🔑 AUTOMAPPER                                    │
│  ├─ Pour chaque colonne source:                                         │
│  │  ├─ normalize() → minuscules + sans accents                          │
│  │  └─ Exemple: "Date d'embauche" → "date d embauche"                 │
│  └─ Crée liste EN-TÊTES NORMALISÉS                                      │
│                        ↓                                                 │
│  MAPPAGE AUTOMATIQUE 🎯 (CŒUR DE L'AUTOMAPPER)                           │
│  ├─ Pour chaque champ système (turnoverFields):                         │
│  │  ├─ normalize(systemField)                                           │
│  │  ├─ Cherche meilleur match dans colonnes source normalisées         │
│  │  │  └─ Critère: "nom et prenom" in "nom et prénom" = MATCH ✓       │
│  │  ├─ Ajoute à ColumnMapping[]                                        │
│  │  │  └─ { systemField: "Nom et Prénom", sourceColumn: "NOM COMPLET" }│
│  │  └─ Si pas de match: sourceColumn = ""                              │
│  │                                                                       │
│  │  Exemple mapping Turnover:                                          │
│  │  ├─ Mois → "MOIS" (match trouvé ✓)                                 │
│  │  ├─ Nom et Prénom → "NOM COMPLET" (match trouvé ✓)                │
│  │  ├─ Position → "POSTE" (match trouvé ✓)                            │
│  │  ├─ Département → "DEPT" (match trouvé ✓)                          │
│  │  ├─ Date d'embauche → "DATE_EMBAUCHE" (match trouvé ✓)           │
│  │  ├─ Date de départ → "DATE_DEPART" (match trouvé ✓)              │
│  │  └─ [autres champs...]                                             │
│  │                                                                       │
│  └─ Résultat: ColumnMapping[] complet                                   │
│                        ↓                                                 │
│  VALIDATION DONNÉES                                                     │
│  ├─ Vérifier ranges (ex: absences 0-365 jours)                          │
│  ├─ Vérifier doublons (noms, IDs)                                       │
│  ├─ Vérifier formats (dates, nombres)                                   │
│  └─ Collecter erreurs[] s'il y en a                                     │
│                        ↓                                                 │
│  SUGGESTIONS IA                                                         │
│  ├─ runAIChecks(rows, cols, fileType='turnover')                        │
│  ├─ Vérifier colonnes manquantes                                        │
│  ├─ Détecter doublons suspects                                          │
│  ├─ Valider domaines/départements                                       │
│  └─ Générer suggestions[]                                               │
│                        ↓                                                 │
│  AFFICHAGE APERÇU À L'UTILISATEUR                                       │
│  ├─ Tableau preview (premières 10 lignes)                              │
│  ├─ Mappage affiché (systemField ← sourceColumn)                        │
│  ├─ Erreurs validation en rouge                                         │
│  ├─ Suggestions IA en orange/jaune                                      │
│  └─ Bouton "Importer" activé si pas d'erreur                           │
│                        ↓                                                 │
│  UTILISATEUR VALIDE L'IMPORT                                            │
│  └─ Clique "Importer"                                                   │
│                        ↓                                                 │
│  ENVOI AU BACKEND                                                       │
│  ├─ FormData contenant file                                             │
│  ├─ POST /api/turnover-history/departures/import                        │
│  └─ setUploading(true) - Affiche progression                            │
│                        ↓                                                 │
│  BACKEND TRAITEMENT                                                     │
│  ├─ Réceptionne FormData + file                                         │
│  ├─ Re-parse le fichier (validation côté serveur)                       │
│  ├─ Re-normalise les en-têtes (double-check)                            │
│  ├─ Pour chaque ligne:                                                  │
│  │  ├─ Crée document TurnoverDeparture                                 │
│  │  ├─ Utilise mappage pour extraire bonnes colonnes                   │
│  │  ├─ Valide données                                                  │
│  │  ├─ Upsert en BD (update si existe, sinon create)                  │
│  │  └─ Sauvegarde metadata (sourceSheet, sourceRow, importOrder)       │
│  │                                                                       │
│  ├─ Créé enregistrement dans ImportHistory:                             │
│  │  ├─ filename: nom_fichier.xlsx                                       │
│  │  ├─ type: "Turnover"                                                 │
│  │  ├─ rows: nombre lignes importées                                    │
│  │  ├─ status: "Success" / "Partial" / "Failed"                         │
│  │  └─ createdAt: timestamp                                             │
│  │                                                                       │
│  └─ Retourne { message, imported: N, detectedRows: M }                  │
│                        ↓                                                 │
│  FRONTEND REÇOIT RÉPONSE                                                │
│  ├─ Affiche confirmation: "N lignes importées"                          │
│  ├─ Rafraîchit ImportHistory                                            │
│  ├─ Dispatche événement: 'data-imported'                                │
│  └─ Dashboard se rafraîchit automatiquement                             │
│                        ↓                                                 │
│  DATABASE MISE À JOUR                                                   │
│  ├─ Collections TurnoverDeparture: +N documents                         │
│  ├─ Collection ImportHistory: +1 document                               │
│  └─ Indexes recalculés                                                  │
│                        ↓                                                 │
│  ✅ IMPORT COMPLET - DONNÉES ACCESSIBLES AUX PRÉDICTIONS IA             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Flux Données: Dashboard KPI

```
┌─────────────────────────────────────────────────────────────────────┐
│              FLUX CALCUL KPI & AFFICHAGE DASHBOARD                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UTILISATEUR CLIQUE SUR "DASHBOARD"                               │
│                        ↓                                           │
│  REACT COMPONENT MONTAGE                                          │
│  └─ Dashboard.tsx → useEffect()                                   │
│                        ↓                                           │
│  REQUÊTE API                                                      │
│  └─ GET /api/dashboard/kpi                                        │
│                        ↓                                           │
│  BACKEND TRAITEMENT                                               │
│  ├─ dashboardController.getKpi()                                  │
│  │                                                                 │
│  │  1. Compter total employés:                                   │
│  │     ├─ MonthlyRecap.countDocuments() [Si importé]            │
│  │     ├─ Sinon: Employe.countDocuments()                        │
│  │     └─ Résultat: totalEmployees = 50                          │
│  │                                                                 │
│  │  2. Calculer absences totales:                                │
│  │     ├─ Absence.aggregate({ $sum: "$days" })                   │
│  │     ├─ MonthlyRecap.aggregate({ $sum: "$absenceDays" })      │
│  │     ├─ Fallback: Employe.aggregate({ $sum: "$absenceDays" }) │
│  │     └─ Résultat: totalAbsenceDays = 120                       │
│  │                                                                 │
│  │  3. Calculer heures supplémentaires:                          │
│  │     ├─ MonthlyRecap aggregate:                                │
│  │     │  ├─ Sum(overtime25) + Sum(overtime50) + Sum(overtime100)│
│  │     │  └─ Résultat: overtimeHours = 450                       │
│  │     └─ Fallback: Workload aggregate overtime                  │
│  │                                                                 │
│  │  4. Calculer taux d'absence:                                  │
│  │     ├─ Formule: (totalAbsenceDays / (totalEmployees * 30)) *100│
│  │     ├─ Calcul: (120 / (50 * 30)) * 100 = 8%                  │
│  │     └─ Résultat: absenceRate = 8.0                            │
│  │                                                                 │
│  │  5. Calculer taux de turnover:                                │
│  │     ├─ TurnoverHistory.findOne().sort({year: -1, month: -1})│
│  │     ├─ Ou calculer: TurnoverDeparture.count(derniers 12 mois)│
│  │     ├─ Formule: (departures / totalEmployees) * 100          │
│  │     └─ Résultat: turnoverRate = 12.5                          │
│  │                                                                 │
│  └─ Retour JSON:                                                  │
│     {                                                             │
│       absenceRate: 8.0,          // %                           │
│       turnoverRate: 12.5,        // %                           │
│       totalEmployees: 50,        // count                       │
│       overtimeHours: 450.5       // heures                      │
│     }                                                             │
│                        ↓                                           │
│  FRONTEND REÇOIT DONNÉES                                          │
│  ├─ setKpi(data)                                                  │
│  ├─ Etat React mis à jour                                         │
│  └─ Re-render du composant                                        │
│                        ↓                                           │
│  AFFICHAGE GRAPHIQUES                                             │
│  ├─ KPI Cards:                                                    │
│  │  ├─ Taux absence: 8% (rouge si > 15%)                        │
│  │  ├─ Taux turnover: 12.5% (orange si > 10%)                  │
│  │  ├─ Effectif: 50 employés                                    │
│  │  └─ Heures supp: 450.5h                                      │
│  │                                                                 │
│  ├─ Graphiques mensuels (6 derniers mois):                        │
│  │  ├─ GET /api/dashboard/monthly-data                           │
│  │  ├─ Recharts affiche courbes absence/turnover                │
│  │  └─ Données mises en cache                                    │
│  │                                                                 │
│  └─ Tableau absence par type:                                    │
│     ├─ GET /api/dashboard/absence-reasons                        │
│     ├─ Pie chart: Vacation (40%), Sick (45%), Maternity (15%)  │
│     └─ Donut interactif                                          │
│                        ↓                                           │
│  ✅ DASHBOARD AFFICHÉ À L'UTILISATEUR                            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Flux Données: Prédiction IA

```
┌─────────────────────────────────────────────────────────────────────┐
│        FLUX PRÉDICTION TURNOVER VIA SERVICE PYTHON IA              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UTILISATEUR CLIQUE "PREDICT TURNOVER" POUR EMPLOYÉ               │
│                        ↓                                           │
│  FRONTEND (AIPrediction.tsx)                                       │
│  └─ POST /api/ai/predict-turnover/EMP001                          │
│                        ↓                                           │
│  BACKEND (aiRoutes → aiPythonClient.js)                            │
│  ├─ aiPythonClient.predictTurnover(employeeId)                    │
│  ├─ try {                                                          │
│  │   POST http://localhost:5001/predict/turnover/EMP001           │
│  │   timeout: 5000ms                                              │
│  │ } catch {                                                       │
│  │   // Fallback: calculateLocalTurnoverTrend()                   │
│  │ }                                                               │
│                        ↓                                           │
│  PYTHON SERVICE (http://localhost:5001)                           │
│  ├─ app.py reçoit: /predict/turnover/EMP001                       │
│  │                                                                 │
│  │  1. Récupère profil employé:                                  │
│  │     └─ db.employes.findOne({employee_id: "EMP001"})          │
│  │                                                                 │
│  │  2. Récupère historique d'absences (3 derniers mois):         │
│  │     └─ db.absences.find({employee_id: "EMP001"})             │
│  │                                                                 │
│  │  3. Récupère charge de travail:                               │
│  │     └─ db.workloads.find({employee_id: "EMP001"})            │
│  │                                                                 │
│  │  4. Récupère départs similaires:                              │
│  │     └─ db.turnoverdepartures.find({department: dept})        │
│  │                                                                 │
│  │  5. Calcule factors de risque (ai_predictor.py):             │
│  │     ├─ absence_factor: absences récentes vs moyenne           │
│  │     ├─ workload_factor: heures supp vs moyenne                │
│  │     ├─ seniority_factor: ancienneté du salarié                │
│  │     ├─ age_factor: groupes d'âge problématiques               │
│  │     ├─ department_factor: rotation par département             │
│  │     └─ tenure_factor: pattern: risque > après 2-3 ans         │
│  │                                                                 │
│  │  6. Combine factors → Score de risque (0-100):                │
│  │     ├─ riskScore = weighted_sum(factors)                      │
│  │     └─ Exemple: 65 = RISQUE MOYEN                             │
│  │                                                                 │
│  │  7. Classifie risque:                                         │
│  │     ├─ 0-30: Low (Vert) ✅                                    │
│  │     ├─ 31-60: Medium (Orange) ⚠️                              │
│  │     ├─ 61-85: High (Rouge) 🔴                                 │
│  │     └─ 86-100: Critical (Noir) ⚫                              │
│  │                                                                 │
│  │  8. Retourne prédiction JSON:                                 │
│  │     {                                                          │
│  │       employeeId: "EMP001",                                   │
│  │       employeeName: "Jean Dupont",                            │
│  │       riskScore: 65,                                          │
│  │       riskLevel: "HIGH",                                      │
│  │       factors: {...},                                         │
│  │       recommendations: [...]                                  │
│  │     }                                                          │
│  │                                                                 │
│  └─ Envoie réponse au backend                                     │
│                        ↓                                           │
│  BACKEND REÇOIT RÉPONSE PYTHON                                    │
│  ├─ Si succès (200): Retourne prédiction au frontend            │
│  └─ Si erreur/timeout: Utilise fallback local                   │
│                        ↓                                           │
│  FRONTEND AFFICHE RÉSULTAT                                        │
│  ├─ Affiche score 65 en RED (HIGH RISK)                         │
│  ├─ Affiche raisons détaillées                                   │
│  ├─ Graphique radar des factors                                  │
│  ├─ Recommandations d'action:                                    │
│  │  ├─ "Augmenter compensation"                                  │
│  │  ├─ "Réduire heures supplémentaires"                         │
│  │  ├─ "Envisager mobilité interne"                             │
│  │  └─ "Améliorer environnement travail"                        │
│  │                                                                 │
│  └─ Permet export rapport                                        │
│                        ↓                                           │
│  ✅ PRÉDICTION AFFICHÉE                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Flux Authentification

```
┌─────────────────────────────────────────────────────────────────────┐
│            FLUX AUTHENTIFICATION & GESTION SESSIONS                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  UTILISATEUR ARRIVE SUR /login                                    │
│                        ↓                                           │
│  FRONTEND (Login.tsx)                                              │
│  ├─ Formulaire avec champs:                                        │
│  │  ├─ Email: manage@rh.com                                       │
│  │  └─ Mot de passe: ••••••••                                     │
│  │                                                                 │
│  └─ Click SUBMIT                                                   │
│                        ↓                                           │
│  REQUÊTE POST /api/auth/login                                     │
│  ├─ Body: { email, password }                                     │
│  └─ Headers: Content-Type: application/json                       │
│                        ↓                                           │
│  BACKEND (authRoutes.js)                                           │
│  ├─ 1. Valider email/password non vides                           │
│  │                                                                 │
│  ├─ 2. Vérifier email == "manage@rh.com"                          │
│  │     └─ Si différent: return 401 "Invalid credentials"          │
│  │                                                                 │
│  ├─ 3. Rechercher user en BD:                                     │
│  │     └─ User.findOne({ email: ADMIN_EMAIL })                   │
│  │                                                                 │
│  ├─ 4. Comparer mot de passe:                                     │
│  │     ├─ user.comparePassword(password)                          │
│  │     ├─ Utilise crypto.scryptSync() + salt                      │
│  │     └─ Si invalid: return 401 "Invalid credentials"            │
│  │                                                                 │
│  ├─ 5. Créer session token:                                       │
│  │     ├─ token = crypto.randomBytes(32).toString('hex')         │
│  │     ├─ Exemple: "a7f8b2c1d9e3f4g6h8i0j2k4l6m8n0o2p4q6"        │
│  │     └─ Sauvegarder en user.sessions[]                          │
│  │                                                                 │
│  ├─ 6. Sauvegarder user:                                          │
│  │     └─ user.save()                                             │
│  │                                                                 │
│  └─ 7. Retourner réponse:                                         │
│     {                                                             │
│       message: "Login successful",                               │
│       token: "a7f8b2c1d9e3f4g6h8i0j2k4l6m8n0o2p4q6",            │
│       user: {                                                    │
│         _id: ObjectId,                                           │
│         username: "Admin",                                       │
│         email: "manage@rh.com",                                  │
│         avatar: null                                             │
│       }                                                          │
│     }                                                             │
│                        ↓                                           │
│  FRONTEND REÇOIT RÉPONSE                                          │
│  ├─ localStorage.setItem('token', token)  ← Stockage persistant  │
│  ├─ AuthContext.setToken(token)                                   │
│  ├─ Affiche: "Login successful!"                                  │
│  └─ Navigate('/dashboard')                                        │
│                        ↓                                           │
│  REQUÊTE API SUIVANTE                                             │
│  ├─ GET /api/dashboard/kpi                                        │
│  ├─ Headers:                                                       │
│  │  Authorization: Bearer a7f8b2c1d9e3f4g6h8i0j2k4l6m8n0o2p4q6 │
│  └─ [...contenus backend...]                                      │
│                        ↓                                           │
│  BACKEND VÉRIFIE TOKEN (verifyToken middleware)                   │
│  ├─ Extraire token du header:                                     │
│  │  └─ Authorization: "Bearer {token}"                            │
│  │                                                                 │
│  ├─ Chercher user avec ce token:                                  │
│  │  └─ User.findOne({ 'sessions.token': token })                 │
│  │                                                                 │
│  ├─ Si trouve: req.user = user, next()                            │
│  └─ Si pas trouve: return 401 "Invalid or expired session"        │
│                        ↓                                           │
│  LOGOUT                                                           │
│  ├─ Frontend POST /api/auth/logout                                │
│  │  Headers: Authorization: Bearer {token}                        │
│  │                                                                 │
│  ├─ Backend:                                                       │
│  │  ├─ Trouver user                                               │
│  │  ├─ Supprimer token de sessions[]                              │
│  │  ├─ Sauvegarder user                                           │
│  │  └─ Retourner 200 "Logout successful"                          │
│  │                                                                 │
│  └─ Frontend:                                                      │
│     ├─ localStorage.removeItem('token')                           │
│     ├─ AuthContext.setToken(null)                                 │
│     └─ Navigate('/login')                                         │
│                        ↓                                           │
│  ✅ SESSION FERMÉE                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Dépendances & Versions

### Frontend Dependencies
```json
{
  "react": "19.2.5",
  "typescript": "4.9.5",
  "react-router-dom": "7.14.2",
  "framer-motion": "12.38.0",
  "recharts": "2.15.0",
  "lucide-react": "1.14.0",
  "react-hot-toast": "2.6.0",
  "papaparse": "5.5.3",
  "xlsx": "0.18.5"
}
```

### Backend Dependencies
```json
{
  "express": "5.2.1",
  "mongoose": "9.6.1",
  "cors": "2.8.6",
  "dotenv": "17.4.2",
  "multer": "2.1.1",
  "axios": "1.16.0",
  "simple-statistics": "7.8.9",
  "xlsx": "0.18.5"
}
```

### Python Dependencies
```
Flask
Flask-CORS
pymongo
numpy
pandas
scikit-learn
python-dotenv
```

---

**Document créé:** 2026-06-09  
**Version:** 1.0  
**Format:** Architecture Visuelle
