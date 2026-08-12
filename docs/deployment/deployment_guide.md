# Deployment Guide

SentinelCore-SecureOps is architected to run seamlessly across various container environments and hosting providers (such as Docker, Render, and Vercel).

---

## 💻 Local Development with Docker Compose

A pre-configured `docker-compose.yml` file is provided in the repository root to simplify database and backend bootstrapping.

### Prerequisites
- Docker and Docker Compose installed.
- Brevo and Grok API credentials.

### Command Execution
1. Navigate to the repository root:
   ```bash
   cd SentinelCore-SecureOps
   ```
2. Run database and backend services:
   ```bash
   docker-compose up --build
   ```
3. Verify containers:
   - Database service container: `sentinelcore-db` (on port `5432`).
   - Spring Boot backend container: `sentinelcore-backend` (on host port `8081`, mapping to container port `8080`).

---

## ☁️ Production Backend Deployment (Render)

The Spring Boot backend is packaged using a multi-stage Docker build config located at `backend/Dockerfile` and maps directly via `render.yaml`.

### 1. Structure Mapping
- **System Config File**: `render.yaml` (positioned at root).
- **Properties Configured**:
  - `rootDir`: `backend` (points to the Spring Boot subfolder).
  - `dockerfilePath`: `./Dockerfile`.
  - `healthCheckPath`: `/health` (provisions cold-start checks).

### 2. Environment Variables Required on Render
Set these keys under **Environment Variables** in the Render dashboard:
- `SPRING_DATASOURCE_URL`: PostgreSQL connection URL (e.g., `jdbc:postgresql://<neon-host>/sentinelcore?sslmode=require`).
- `SPRING_DATASOURCE_USERNAME`: Database username.
- `SPRING_DATASOURCE_PASSWORD`: Database password.
- `FRONTEND_URL`: URL of the deployed frontend on Vercel (e.g., `https://sentinelcore.vercel.app`).
- `BREVO_API_KEY`: Key generated in Brevo control panels.
- `BREVO_SENDER_EMAIL`: Configured Brevo sender email.
- `XAI_API_KEY`: Grok API validation secret.

---

## 🎨 Production Frontend Deployment (Vercel)

The React single-page client built via Vite is deployed to Vercel.

### 1. Vercel Project Setup Coordinates
Configuring Vercel to build the project from the monorepo root:
- **Root Directory**: Select **`frontend`** (crucial for Vercel to context-scope builds to `/frontend` rather than root).
- **Build Command**: `vite build`
- **Output Directory**: `dist`
- **Framework Preset**: `Vite`

### 2. Rewrites Config (`vercel.json`)
The `frontend/vercel.json` file dictates SPA routing handlers to ensure requests resolve without 404 errors:
```json
{
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 3. Environment Environment Variable
- **VITE_API_URL**: Set this variable in Vercel to point to your backend url (e.g., `https://sentinelcore-backend.onrender.com`). Do not append a trailing slash.
