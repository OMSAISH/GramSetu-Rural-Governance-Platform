# GramSetu — Production Deployment Guide

This document provides step-by-step instructions for deploying GramSetu across production-ready cloud services (Vercel, Render/Railway, Supabase).

---

## Architecture Topology in Production

```mermaid
graph LR
    Client["Citizen / Official Browser"] --> Vercel["Frontend (Vercel)"]
    Vercel --> Render["FastAPI Backend (Render / Railway)"]
    Render --> Supabase["PostgreSQL (Supabase / Railway Postgres)"]
```

---

## 1. Database Setup (Supabase or Railway Postgres)

### Option A: Supabase (Recommended Free Tier)
1. Go to [supabase.com](https://supabase.com) and create a new project named `gramsetu-db`.
2. Under **Project Settings** $\rightarrow$ **Database**, copy the **URI Connection String** under "Transaction pooler" or "Session mode" (e.g. `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).
3. Note: If your password contains special characters (like `#`, `@`), URL-encode them.
4. The GramSetu backend automatically normalizes `postgres://` or `postgresql://` into `postgresql+asyncpg://`.

---

## 2. Backend Deployment (Render or Railway)

### Deploying to Render via Docker
1. Fork or push this repository to GitHub.
2. Log in to [render.com](https://render.com) and click **New +** $\rightarrow$ **Web Service**.
3. Select your repository.
4. Configure the service settings:
   - **Name:** `gramsetu-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Docker` (Render will detect `backend/Dockerfile` automatically)
   - **Region:** Singapore or Frankfurt (closest to target audience)
   - **Plan:** Free
5. Set Environment Variables under **Environment**:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | *Your Supabase or Railway Postgres connection string* |
   | `SECRET_KEY` | *A secure 64-character random string* |
   | `CORS_ORIGINS` | `https://gramsetu.vercel.app,http://localhost:3000` *(Add your deployed frontend URL)* |
6. Click **Create Web Service**.
7. Render will build the container, install dependencies, run migrations & seed data, and expose the service at:
   `https://gramsetu-backend.onrender.com`
8. Verify health endpoint: `https://gramsetu-backend.onrender.com/api/health`

---

## 3. Frontend Deployment (Vercel)

1. Go to [vercel.com](https://vercel.com) and click **Add New...** $\rightarrow$ **Project**.
2. Select your GitHub repository.
3. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Configure Environment Variables:
   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://gramsetu-backend.onrender.com/api` |
5. Click **Deploy**.
6. Vercel will build the frontend and output a public live URL (e.g. `https://gramsetu.vercel.app`).
7. Update the `CORS_ORIGINS` in your Render backend settings to include your new Vercel domain.

---

## 4. Verifying End-to-End Live Connectivity

Once deployed:
1. Open the Vercel URL in your smartphone or desktop browser.
2. Verify language switcher: switch between English, Hindi (हिंदी), and Marathi (मराठी).
3. Test conversational AI Sahayak: type "Check my eligibility for schemes".
4. Evaluate Scheme Eligibility: test socioeconomic form and click **Download Pre-filled PDF Form**.
5. Submit a Grievance: file a complaint regarding water supply or streetlights; receive official Tracking ID (e.g. `GS-2026-XXXXX`).
6. Track Grievance: track by ID and inspect live resolution timeline.
7. Official Dashboard: log in with `9822001122` / `Official@123` to view real-time systemic issue analytics and update grievance status.
