# Roadmap & Changelog (Backend-focused)

**Last Updated:** 2025-10-30

Purpose
-------
This file captures backend milestones, migration guidance, and a concise changelog. Frontend tasks are intentionally excluded — the backend is the source of truth for schema, RLS, and seed data so future frontends can be rebuilt reliably.

Milestones (backend-first)
--------------------------
- Phase 1: Core backend and auth
  - Supabase Auth (email/password)
  - Core DB schema and RLS (profiles, clients, projects, project_memories, memory_assignments, audit_logs)
  - Seed data and migration scripts

- Phase 2: Calculation data plumbing
  - Define per-calculation JSONB schemas and migrations
  - Create example Postgres functions to normalize common operations (versioning, patching)

- Phase 3: Ops & integrations
  - CI-driven migrations and seeding (use service role key in CI securely)
  - Monitoring & alerting for DB errors
  - OAuth/SSO providers (optional)

Changelog (selected)
--------------------
- 2025-10-25 - Project initialise; core docs created
- 2025-10-26 - DB schema & RLS drafted
- 2025-10-27 - Frontend scaffold (archived); Supabase client wiring
- 2025-10-29 - Fixed dev build CSS parse errors; made Supabase client singleton
- 2025-10-30 - Converted core docs to backend-first guides (preserve DB & types)
- 2025-10-30 - Added minimal Next.js frontend at repo root (auth UI, theme, parallax) and an example server API route `pages/api/projects.js` using the admin client; removed duplicate `frontend/` copy.
- 2025-10-30 - Implemented color palette (primary `#85B726`, secondary `#858688`) and exported it via `lib/theme.js`; added global CSS in `styles/globals.css` containing the parallax rectangles and animations.
 - 2025-10-30 - Added minimal Next.js frontend at repo root (auth UI, theme, parallax) and an example server API route `pages/api/projects.js` using the admin client; removed duplicate `frontend/` copy.
 - 2025-10-30 - Implemented color palette (primary `#85B726`, secondary `#858688`) and exported it via `lib/theme.js`; added global CSS in `styles/globals.css` containing the parallax rectangles and animations.
 - 2025-10-30 - Frontend POC expanded: added project gallery UI, `ProjectCard` (fixed-height), admin `⋯` menu (top-right placeholder), `AddProjectCard` (appears at end of grid), `BackgroundRects` decorative clump, and a full-width footer. Dashboard layout was adjusted so footer sits at page bottom and main content scrolls when long.

Developer notes
---------------
- Always use migrations for schema changes; do not edit production DB manually.
- Keep seed data under `supabase/seed.sql` and run with the service role key via CI or local scripts.
- Clear malformed cookies in browsers when debugging auth flows — malformed Supabase cookies may cause server-side parsing errors.

Recommended next steps
----------------------
1. Finalise backend-first docs and move frontend code to a new `frontend/` workspace when ready.
2. Add a CI job to run migrations and seeds (use encrypted secrets for service role key).
3. Add integration tests that validate RLS behavior using test users (admin vs employee).

End of Roadmap
