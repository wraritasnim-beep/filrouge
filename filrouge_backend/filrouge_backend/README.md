# 🔴 Fil Rouge — Backend Django

Guide complet pour installer et lancer le backend.

---

## 📋 CE QU'IL FAUT INSTALLER SUR TON PC (une seule fois)

### 1. Python 3.11+
- Va sur https://www.python.org/downloads/
- Télécharge Python 3.11 ou 3.12
- ⚠️ Lors de l'installation, coche "Add Python to PATH"
- Vérifie : ouvre un terminal et tape `python --version`

### 2. VS Code
- Va sur https://code.visualstudio.com/
- Installe VS Code

### 3. Extensions VS Code à installer
Ouvre VS Code → icône Extensions (Ctrl+Shift+X) → installe :
- ✅ **Python** (Microsoft) — indispensable
- ✅ **Pylance** (Microsoft) — autocomplétion Python
- ✅ **Django** (Baptiste Darthenay) — coloration syntaxique Django
- ✅ **REST Client** (Huachao Mao) — tester les APIs directement dans VS Code
- ✅ **GitLens** (GitKraken) — gestion Git avancée
- ✅ **Thunder Client** — alternative à Postman pour tester les APIs

---

## 🚀 INSTALLATION ÉTAPE PAR ÉTAPE

### Étape 1 — Ouvre le projet dans VS Code
```
File → Open Folder → sélectionne le dossier filrouge_backend
```

### Étape 2 — Ouvre le terminal intégré
```
Terminal → New Terminal  (ou Ctrl + `)
```

### Étape 3 — Crée un environnement virtuel Python
```bash
python -m venv venv
```
Tu verras un dossier `venv/` apparaître.

### Étape 4 — Active l'environnement virtuel

**Windows :**
```bash
venv\Scripts\activate
```
**Mac / Linux :**
```bash
source venv/bin/activate
```
✅ Tu verras `(venv)` apparaître au début de la ligne du terminal. C'est bon !

### Étape 5 — Installe les dépendances
```bash
pip install -r requirements.txt
```
Attends que tout s'installe (1-2 minutes).

### Étape 6 — Configure ta base de données Supabase

1. Va sur https://supabase.com → crée un compte gratuit
2. Crée un nouveau projet
3. Va dans **Settings → Database**
4. Copie le mot de passe et le host (ex: `db.abcdefghij.supabase.co`)

Maintenant copie le fichier `.env.example` et crée un `.env` :
```bash
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Ouvre `.env` et remplis tes vraies valeurs :
```
SUPABASE_DB_PASSWORD=le-mot-de-passe-de-ton-supabase
SUPABASE_DB_HOST=db.ton-projet-id.supabase.co
```

### Étape 7 — Dis à Django de lire le .env

Dans `filrouge/settings.py`, ajoute EN HAUT du fichier (après les imports) :
```python
from dotenv import load_dotenv
load_dotenv()
```

### Étape 8 — Crée les tables dans Supabase
```bash
python manage.py makemigrations
python manage.py migrate
```
✅ Tes tables sont créées dans Supabase !

### Étape 9 — Crée un super-utilisateur (admin)
```bash
python manage.py createsuperuser
```
Suis les instructions : entre un nom d'utilisateur, email, mot de passe.

### Étape 10 — Lance le serveur
```bash
python manage.py runserver
```
✅ Le backend tourne sur http://localhost:8000

---

## 🧪 TESTER LES APIs

### Via le navigateur (DRF Browsable API)
Va sur http://localhost:8000/api/projects/ — tu verras une interface graphique !

### Via Thunder Client (VS Code)
Installe l'extension Thunder Client, puis teste :

**Register :**
- POST http://localhost:8000/api/auth/register/
- Body JSON :
```json
{
  "username": "alice",
  "email": "alice@test.com",
  "first_name": "Alice",
  "last_name": "Martin",
  "role": "student",
  "password": "motdepasse123",
  "password2": "motdepasse123"
}
```

**Login :**
- POST http://localhost:8000/api/auth/login/
- Tu reçois un `access` token → copie-le

**Créer un projet :**
- POST http://localhost:8000/api/projects/
- Header : `Authorization: Bearer <ton-token>`
- Body JSON :
```json
{
  "name": "Mon Premier Projet",
  "description": "Description du projet",
  "deadline": "2025-06-30"
}
```

### Via l'admin Django
Va sur http://localhost:8000/admin/ et connecte-toi avec le superuser.
Tu peux voir et modifier toutes les données.

---

## 📁 STRUCTURE DU PROJET

```
filrouge_backend/
├── filrouge/           ← Configuration principale Django
│   ├── settings.py     ← Base de données, JWT, CORS...
│   ├── urls.py         ← Toutes les URLs de l'API
│   ├── asgi.py         ← WebSocket (chat temps réel)
│   └── wsgi.py         ← Déploiement HTTP classique
│
├── core/               ← Notre application principale
│   ├── models.py       ← User, Project, Task, Sprint, Message, Evaluation
│   ├── serializers.py  ← Conversion données ↔ JSON
│   ├── views.py        ← Logique des APIs
│   ├── permissions.py  ← Règles d'accès (étudiant/enseignant)
│   ├── consumers.py    ← WebSocket chat
│   ├── routing.py      ← Routes WebSocket
│   ├── admin.py        ← Interface d'administration
│   └── urls/           ← URLs organisées par fonctionnalité
│       ├── auth_urls.py
│       ├── project_urls.py
│       ├── task_urls.py
│       ├── sprint_urls.py
│       ├── chat_urls.py
│       └── evaluation_urls.py
│
├── requirements.txt    ← Liste des packages Python
├── .env.example        ← Template pour tes variables secrètes
├── .env                ← Tes vraies valeurs (NE PAS COMMIT)
├── .gitignore          ← Fichiers à ignorer par Git
└── manage.py           ← Commandes Django
```

---

## 📡 LISTE COMPLÈTE DES APIs

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | /api/auth/register/ | Inscription |
| POST | /api/auth/login/ | Connexion |
| GET | /api/auth/me/ | Mon profil |
| GET | /api/auth/users/ | Liste utilisateurs |
| GET/POST | /api/projects/ | Mes projets |
| GET/PUT/DELETE | /api/projects/{id}/ | Détail projet |
| POST/DELETE | /api/projects/{id}/members/ | Ajouter/Retirer membre |
| GET | /api/projects/{id}/dashboard/ | Dashboard projet |
| GET/POST | /api/projects/{id}/tasks/ | Tâches du projet |
| GET/PUT/DELETE | /api/tasks/{id}/ | Détail tâche |
| PATCH | /api/tasks/{id}/status/ | Changer statut (drag&drop) |
| GET | /api/my-tasks/ | Mes tâches (dashboard étudiant) |
| GET/POST | /api/projects/{id}/sprints/ | Sprints du projet |
| GET/PUT/DELETE | /api/sprints/{id}/ | Détail sprint |
| GET | /api/projects/{id}/backlog/ | Tâches sans sprint |
| GET/POST | /api/projects/{id}/messages/ | Chat du projet |
| GET/POST | /api/projects/{id}/evaluations/ | Évaluations |
| GET | /api/teacher/dashboard/ | Dashboard enseignant |

---

## ❓ PROBLÈMES FRÉQUENTS

**"ModuleNotFoundError: No module named 'django'"**
→ Tu n'as pas activé le venv. Refais l'étape 4.

**"django.db.utils.OperationalError: could not connect to server"**
→ Ton `.env` n'est pas bien rempli. Vérifie le host et le mot de passe Supabase.

**"django.db.utils.ProgrammingError: relation does not exist"**
→ Tu n'as pas fait les migrations. Refais l'étape 8.

**"CORS error" dans le frontend**
→ Assure-toi que `http://localhost:5173` est dans `CORS_ALLOWED_ORIGINS` dans settings.py.
