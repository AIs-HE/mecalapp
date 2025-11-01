# Complete Reference - MecalApp Project (Backend/Architecture Focus)

**Last Updated:** 2025-11-01
**Project Phase:** Phase 1 - Core Infrastructure

Purpose
-------
This file is the single source of truth for global architecture, role model, environment configuration, and the database-oriented view of the system. It avoids frontend implementation specifics and is intended to guide future frontend rebuilds against the existing backend.

Key concerns documented here
---------------------------
- Project vision and scope
- High-level architecture and integration boundaries
- Role hierarchy and permission rationale
- Environment variables and deployment notes
- Where to find detailed DB schemas and RLS (see `backend_ref.md`)

Vision & scope
--------------
MecalApp is a platform to manage calculation memories for electrical consulting workflows. Phase 1 builds the backend, auth, and the minimal UI backbone required to manage projects and memories. Calculation engines are out of scope for Phase 1 and will be added as separate modules.

High-level architecture
-----------------------
- Client (any SPA/SSR framework) — interacts with Supabase client SDK or a thin API layer.
- Supabase Backend — PostgreSQL database with RLS policies, Supabase Auth, and hosted Postgres functions/triggers.

User flows (conceptual)
------------------------
- Admin/Director: login → manage projects and memories → assign employees → view audit logs
- Employee: login → view assigned projects/memories → update assigned memory data

Authentication strategy
------------------------
- Primary: Supabase Auth (email/password for Phase 1)
- Session management: tokens/cookies managed by Supabase helpers; sessions are validated server-side via RLS-aware helpers where needed

Role hierarchy & permission rationale
-----------------------------------
- Admin/Director: full CRUD on projects and memories; manage assignments
- Employee: limited to assigned memories and related undo actions
- Enforcement: rely primarily on DB-level RLS policies (see `backend_ref.md`) so that permissions are enforced regardless of frontend implementation

Database architecture overview
-----------------------------
Core tables (summary): profiles, clients, projects, project_memories, memory_assignments, audit_logs. Detailed SQL, indexes, and triggers are documented in `backend_ref.md`.

Environment & deployment
------------------------
Required environment variables (stored in `.env.local` for local dev):
- NEXT_PUBLIC_SUPABASE_URL — your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY — public anon key (for browser client)
- SUPABASE_SERVICE_ROLE_KEY — server-only, for migrations/seeds (DO NOT expose in browser)

Repository notes (local dev)
---------------------------
- For this repository the Next.js app is located at the repo root. During local development the `.env.local` file should be present at the repo root so Next can pick up the `NEXT_PUBLIC_*` variables. The `SUPABASE_SERVICE_ROLE_KEY` must be set in the environment for server routes (CI / hosting) and must not be committed.
- Server-only operations (migrations, seeds) should use the service role key via the Supabase CLI or in CI with secrets; do not embed it in code.

Current repository POC (frontend notes)
-------------------------------------
There is a small Next.js frontend implemented in-repo as a proof-of-concept. It is intentionally minimal and showcases integration patterns with Supabase and the DB policies. The POC files to reference are:

- `pages/index.js` (auth entry, rectangle entrance animations)
- `pages/dashboard.js` (projects grid, add-card, scrolling main area, footer)
- `pages/api/projects.js` (example server-side route using `lib/supabaseAdmin.js`)
- `lib/supabaseClient.js` and `lib/supabaseAdmin.js` (client and admin helpers)
- `lib/theme.js` and `styles/globals.css` (color palette and global styles including decorative rectangles)
- Components in `components/` for header, cards, background rects and footer (visual examples)

Recent frontend POC updates (2025-10-30 / 2025-11-01)
---------------------------------------
A small Next.js frontend POC was added at the repository root to provide visual validation of integration patterns with Supabase. It is intentionally minimal and non-production. Key applied updates:

- Bootstrapped Tailwind entry files and PostCSS adapter; installed `autoprefixer` and the Tailwind PostCSS adapter to resolve Next postcss pipeline issues.
- POC files of interest: `pages/index.js`, `pages/dashboard.js`, `pages/api/projects.js`, `lib/supabaseClient.js`, `lib/supabaseAdmin.js`, `lib/theme.js`, `styles/globals.css`, and the `components/` folder.
- UI adjustments: project cards are uniform height (13rem), left primary accent stripe, top-right admin menu placeholder, an Add card at the end of the grid, and a centered projects panel (`.projects-panel`) containing a white `.projects-inner`.
- Scroll UX: the projects list uses a scroll container that hides the native scrollbar by default and reveals a thin styled scrollbar while the user scrolls (JS toggles a `.scrolling` class; CSS rules reveal the thumb).
- Header: increased the app title size and the Projects heading for clearer hierarchy.

Additional deltas (2025-11-01)
----------------------------
- `pages/api/project_memories.js` was added/iterated as a server-side example for listing/creating/deleting project memory rows. The handler was corrected to use the actual seeded column `memory_type` and to normalize a `type` property in responses for frontend convenience.
- `components/NewProjectModal.jsx` implements the Create/Edit modal used by the POC. It prefetches project memories on open and maps DB rows (either `memory_type` or `type`) to a normalized `type` key used by the UI memory gallery.
- Local cache & sync: `lib/cache.js` was added to provide a localStorage-backed cache and an ops queue; toggle operations from the modal enqueue create/delete ops and a background `syncQueue()` pushes them to the example API endpoints.
- Debugging aids: the New Project modal contains a temporary debug panel that shows the raw API response and the normalized map so developers can quickly validate mapping behavior during iteration.

Dev note: server-side environment variables (for example `SUPABASE_SERVICE_ROLE_KEY`) must be present in the running environment — restart the Next.js dev server after `.env.local` edits so server routes pick up updated values.

Reminder: this POC is for reference only — backend RLS, migrations, and schema remain authoritative and unchanged by the POC.

Notes:
- The POC intentionally uses server-side admin client only in `pages/api/*` to demonstrate how admin-only actions could be performed; these routes bypass RLS and therefore must be treated carefully and protected in production.
- The POC UI includes details that are intentionally superficial (no persistent create/edit flows yet). Use it as a visual reference, not a production-ready implementation.

Design decisions (rationale summary)
-----------------------------------
- Use RLS and DB policies as the primary security surface.
- Keep calculation data extensible via JSONB tables per calculation type.
- Use a modular approach where calculation UIs are independent modules integrated into the platform.

Where to find implementation details
-----------------------------------
- DB schemas and RLS policies: `backend_ref.md`
- Integration contracts and canonical types: `system_sync_ref.md`
- Frontend concepts for future rebuilding: `frontend_ref.md`
- Project roadmap and deployment notes: `roadmap.md`

End of Complete Reference
