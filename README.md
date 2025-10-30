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

4. Backend

This project uses Supabase for the backend (database, auth, RLS, functions). There is no local backend server in this repo. Use the Supabase dashboard or the Supabase CLI for migrations/seeding and server-side operations.

Example: run migrations locally (requires `supabase` CLI and `SUPABASE_SERVICE_ROLE_KEY` set in environment)

```powershell
supabase db reset
supabase db push
```

## Frontend Supabase integration (what I added)

- `frontend/lib/supabaseClient.js` — client-side Supabase singleton using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `frontend/lib/supabaseAdmin.js` — server-side Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (only use in API routes).
- `frontend/pages/api/projects.js` — example Next.js API route that lists and creates `projects` using the admin client.
- `frontend/pages/index.js` — minimal page with sign-in form and a button that calls `/api/projects` to fetch projects.

## Local testing guide

1) Install dependencies (from repository root):

```powershell
npm install
```

2) Create a local env file at the repository root (do NOT commit it). Example variables are in `.env.example` — copy them to `.env.local` and fill with your values.

```powershell
copy .env.example .env.local
# then edit .env.local and set:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
```

3) Run the dev server for the frontend:

```powershell
npm run dev:frontend
```

4) Open `http://localhost:3000` in your browser. Use an existing Supabase Auth user (from your Supabase project) to sign in via the page and click "Fetch Projects" to call the server API.

## Testing with Postman

You can test the server API endpoints directly with Postman. Below are example HTTP requests.

1) GET projects (server API) — uses the service role key server-side, so call the Next.js API route:

- URL: `http://localhost:3000/api/projects`
- Method: GET

Response: JSON { projects: [...] }

2) Create a project (server API) — POST

- URL: `http://localhost:3000/api/projects`
- Method: POST
- Headers: `Content-Type: application/json`
- Body (raw JSON):

```json
{
	"name": "New Project",
	"client_id": "11111111-1111-1111-1111-111111111111",
	"status": "active"
}
```

3) Calling Supabase REST (directly) — use this to test RLS behavior from the frontend (requires anon key)

- URL (example): `https://<PROJECT_REF>.supabase.co/rest/v1/projects`
- Method: GET
- Headers:
	- `apikey: <NEXT_PUBLIC_SUPABASE_ANON_KEY>`
	- `Authorization: Bearer <ANON_KEY>`

Note: Replace `<PROJECT_REF>.supabase.co` with your Supabase project URL (from `NEXT_PUBLIC_SUPABASE_URL`). When calling directly from Postman, use the anon key for read operations. RLS policies will apply, so you will only see rows permitted by the signed-in user's role when using anon key.

### Postman collection included

There is a Postman collection in the repository root: `postman_collection_mecalapp.json`.

It contains these requests:

- `GET /api/projects` — calls the local Next.js API route
- `POST /api/projects` — creates a project via the API route
- `GET Supabase REST /projects` — direct REST call to Supabase (requires anon key)

Import instructions:

1. Open Postman → Import → File → choose `postman_collection_mecalapp.json` from the repo root.
2. Set the collection variables or environment variables:
	- `local_base_url` (default: `http://localhost:3000`)
	- `SUPABASE_URL` (e.g. `https://your-project-ref.supabase.co`)
	- `SUPABASE_ANON_KEY` (your anon key)
3. Run the requests.


## Security notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code or commit it to the repo. The `frontend/pages/api` endpoints run server-side and can safely use the service role key from environment variables.
- For production deployments (Vercel, Netlify), set `SUPABASE_SERVICE_ROLE_KEY` and other secrets in the project environment/secret settings.


Notes
- I did not delete or modify any of your existing source files. If you want to wipe the current repo history and reinitialize with this scaffold, tell me and I'll provide the exact `git`/PowerShell steps (I will not run destructive commands without your confirmation).
- The `frontend` and `backend` package.json files are minimal placeholders; when you confirm the stack we can install exact packages and scaffold a working Next.js app and/or Node server.
