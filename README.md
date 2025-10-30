# MecalApp — Workspace bootstrap

This repository is scaffolded as a minimal monorepo for the MecalApp frontend and backend.

What was added
- Root `package.json` (npm workspaces)
- Root `.gitignore`
- `frontend/package.json` (Next.js + Supabase + TypeScript placeholders)
- `backend/package.json` (supabase migrate/seed scripts placeholder)
- `.env.example` (do NOT commit real secrets)

Quick start (Windows PowerShell)
1. Install dependencies

```powershell
npm install
```

2. Create your local env file from the example

```powershell
copy .env.example .env.local
# then edit .env.local and paste your Supabase values
```

3. Run the frontend dev server

```powershell
npm run dev:frontend
```

4. Run the backend dev placeholder

```powershell
npm run dev:backend
```

Notes
- I did not delete or modify any of your existing source files. If you want to wipe the current repo history and reinitialize with this scaffold, tell me and I'll provide the exact `git`/PowerShell steps (I will not run destructive commands without your confirmation).
- The `frontend` and `backend` package.json files are minimal placeholders; when you confirm the stack we can install exact packages and scaffold a working Next.js app and/or Node server.
