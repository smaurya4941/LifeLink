
# 🩸 LifeLink – AI-Powered Blood Donation Matcher (v1.0)

**Tech Stack:** Django (Backend) + React 19 (Frontend) + Scikit-learn (ML) + Tailwind CSS + JWT Authentication  

---

## 🏗️ Project Structure Overview

```
- LifeLink_extracted/
  - LifeLink-main/
    - .gitignore
    - DEPLOYMENT_GUIDE.md
    - PROJECT_SUMMARY.md
    - README.md
    - LifeLink/
      - requirements.txt
      - lifelink_backend/
        - db.sqlite3
        - manage.py
        - __pycache__/
          - __init__.cpython-310.pyc
          - settings.cpython-310.pyc
          - urls.cpython-310.pyc
          - wsgi.cpython-310.pyc
        - api/
          - __init__.py
          - admin.py
          - apps.py
          - models.py
          - serializers.py
          - test_api.py
          - tests.py
          - urls.py
          - views.py
          - __pycache__/
            - __init__.cpython-310.pyc
            - admin.cpython-310.pyc
            - apps.cpython-310.pyc
            - models.cpython-310.pyc
            - serializers.cpython-310.pyc
            - urls.cpython-310.pyc
            - views.cpython-310.pyc
          - migrations/
            - __init__.py
            - __pycache__/
              - __init__.cpython-310.pyc
        - core/
          - __init__.py
          - admin.py
          - apps.py
          - models.py
          - tests.py
          - urls.py
          - views.py
          - __pycache__/
            - __init__.cpython-310.pyc
            - admin.cpython-310.pyc
            - apps.cpython-310.pyc
            - models.cpython-310.pyc
            - urls.cpython-310.pyc
            - views.cpython-310.pyc
          - migrations/
            - 0001_initial.py
            - 0002_donor_city_donor_emergency_contact_donor_height_and_more.py
            - 0003_recipient.py
            - __init__.py
            - __pycache__/
              - 0001_initial.cpython-310.pyc
              - 0002_donor_city_donor_emergency_contact_donor_height_and_more.cpython-310.pyc
              - 0003_recipient.cpython-310.pyc
              - __init__.cpython-310.pyc
          - templates/
            - Home.html
        - lifelink_backend/
          - __init__.py
          - asgi.py
          - settings.py
          - urls.py
          - wsgi.py
          - __pycache__/
            - __init__.cpython-310.pyc
            - settings.cpython-310.pyc
            - urls.cpython-310.pyc
            - wsgi.cpython-310.pyc
      - lifelink_frontend/
        - .gitignore
        - README.md
        - eslint.config.js
        - index.html
        - package-lock.json
        - package.json
        - postcss.config.js
        - tailwind.config.js
        - vite.config.js
        - public/
          - vite.svg
        - src/
          - App.css
          - App.jsx
          - index.css
          - main.jsx
          - assets/
            - react.svg
          - components/
            - BloodRequestForm.jsx
            - BloodRequestsList.jsx
            - DonorProfile.jsx
            - ErrorBoundary.jsx
            - LoadingSpinner.jsx
            - MatchesList.jsx
            - ProtectedRoute.jsx
            - RecipientProfile.jsx
          - contexts/
            - AuthContext.jsx
          - pages/
            - Dashboard.jsx
            - ForgotPassword.jsx
            - Home.jsx
            - Login.jsx
            - Register.jsx
            - ResetPassword.jsx
          - services/
            - api.js
```

---

## ⚙️ Backend (Django)

**Path:** `LifeLink/lifelink_backend/`

### Key Components:
- **manage.py** – Django management script  
- **settings.py** – Configured for REST API, CORS, JWT, and database setup (SQLite currently)  
- **urls.py** – Central route dispatcher connecting APIs and core routes  
- **wsgi.py / asgi.py** – Server interfaces for deployment  

### Main Apps:
#### 1. `api/`
Handles all REST API endpoints and business logic.
- **models.py:** Defines donor, recipient, and matching-related models  
- **serializers.py:** Converts Django models to JSON for React frontend  
- **views.py:** Core API logic including CRUD, authentication, and matching endpoints  
- **urls.py:** Maps all API endpoints  
- **test_api.py:** Contains test scripts for API validation  

#### 2. `core/`
Handles system-level models and landing page.
- **models.py:** Core entities like `Donor`, `Recipient`, etc.  
- **views.py:** Defines homepage and basic routes  
- **templates/Home.html:** Basic landing page  

### Authentication:
- JWT-based authentication integrated with Django REST Framework.
- Tokens stored on frontend using `localStorage`.
- Custom middleware ensures secure route access.

### ML Integration:
- Located inside the `api/` or dedicated ML script directory.
- Uses **Scikit-learn** for donor–recipient matching based on compatibility and distance metrics.
- Integration happens in API views (prediction endpoint).

---

## 💻 Frontend (React 19 + Vite + Tailwind CSS)

**Path:** `LifeLink/lifelink_frontend/`

### Structure:
- **`src/`** – Main source directory  
  - `App.jsx` / `main.jsx`: Entry points  
  - `contexts/AuthContext.jsx`: Global authentication context with JWT handling  
  - `components/`: Reusable UI components (e.g., forms, lists, spinners, protected routes)  
  - `pages/`: App screens (Dashboard, Home, Login, Register, etc.)  
  - `services/api.js`: Axios setup with token interceptor and base API URL  

### Core Features:
- JWT-based login & registration system  
- Role-based dashboard (Donor, Recipient, Admin)  
- Protected routes using `<ProtectedRoute />`  
- Form validation & async API handling with loading spinners  
- Responsive design powered by Tailwind CSS  
- Error boundaries for graceful fallback  

---

## 🧠 Machine Learning Module

- **Library:** scikit-learn  
- **Purpose:** Match donors and recipients using blood group, location, and availability.  
- **Process Flow:**
  1. User submits donor/recipient data  
  2. Data preprocessed → ML model predicts best matches  
  3. API returns compatible donor list  
  4. Frontend displays AI-recommended matches  

---

## 🗄️ Database
- Default: SQLite (configurable to PostgreSQL/MySQL in production)  
- Models: Donor, Recipient, Request, Match  
- Includes migrations under both `core/migrations/` and `api/migrations/`  

---

## 🔒 Security & Auth
- JWT Authentication with refresh tokens  
- CORS handled for `localhost:5173` (React frontend)  
- Role-based access control for dashboards  
- Input validation and error handling in both layers  

---

## 🚀 Deployment & Config
- **Frontend:** Configured with Vite and Tailwind  
- **Backend:** Django + WSGI compatible  
- **Deployment Guide:** Refer to `DEPLOYMENT_GUIDE.md` in root for steps  
- **CORS & Static files:** Set in `settings.py`  

---

## 📊 Future Roadmap (v2.0 Suggestions)
- 🧠 Smarter donor matching (add health data, time-based scoring)  
- 🏥 Hospital dashboard with blood stock tracking  
- 🗺️ Live donor map (Google Maps API / LeafletJS)  
- 🔔 Real-time notifications (Socket.io or Django Channels)  
- 📈 Analytics dashboard for admin  
- 📱 PWA version for offline access  
- 💬 Real-time donor–recipient chat  

---

**Author:** Sachin Maurya  
**Version:** 1.0  
**Generated by:** GPT-5 (AI Dev Partner) 🧠✨
 