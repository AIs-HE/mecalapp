# Complete Reference - MecalApp Project (Backend/Architecture Focus)

**Last Updated:** 2025-10-30
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
