# Roadmap & Changelog (Backend-focused)

**Last Updated:** 2025-11-15
**Last Updated (local edits):** 2025-12-01
**Last Updated (local edits):** 2025-12-02

<!-- Circuit Dimension POC Quick Next Steps (added 2025-12-02) -->
- Circuit Dimension POC implemented locally. Short next steps for roadmap:
  1. Add unit tests for the calculation helpers in `lib/calculations.ts`.
  2. Define JSONB schema + migration for server-side per-memory config (if
    persistence is desired) and document API contract in `system_sync_ref.md`.
  3. Run the dev server and smoke-test placeholder UI and verification flags
    before committing/pushing.

POC UPDATE (2025-12-03)
----------------------
- **Calculation fixes:** corrected three-phase Vdrop (×√3) and made REG/LOS percent-semantics explicit in the calculation helpers. Add unit tests for `calculateVoltageDrop`, `calculateRegulation`, and `calculateLossesPerc` as high priority.
- **UI & layout:** equipment gallery layout fixes applied (ancestor `min-h-0`, internal `flex-1 overflow-auto`), header sticky while body scrolls, and vertical scrollbar visually hidden using `.hide-scrollbar`. Horizontal overflow remains native.
- **Action items (short):** add unit tests for the calculation helpers; draft a JSONB schema + migration if modal-config persistence moves to the backend; run the dev server to verify visual fixes.


POC Update (2025-12-02)
-----------------------
- Per-memory persistence: circuit modal config is stored per-memory at `localStorage` key `circuit_config:<memoryId>`; DraftControls remain local until server persistence is defined.
- ProjectInfoPanel & CommonInputs were added in the POC; ProjectInfoPanel fetches project and memory metadata when provided `projectId`/`memoryId` and renders read-only metadata. CommonInputs sources `data/conductor_types.json` for conductor type options.
- Next roadmap items (short): implement `lib/auth.js`, draft modal-config JSONB schema and migration, add API endpoints to persist per-memory config, and create an integration test that validates per-memory load/save behavior.

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
- 2025-10-30 - Added minimal Next.js frontend at repo root (auth UI, theme, parallax) and example server API route `pages/api/projects.js` using the admin client; removed duplicate `frontend/` copy
- 2025-10-30 - Implemented color palette and global styles; added project gallery POC UI
- 2025-11-01 - POC API & UX deltas: `pages/api/project_memories.js`, `components/NewProjectModal.jsx`, and `lib/cache.js` (local staging + sync)
- 2025-11-04 - Assignment API & UI: update-or-insert assignment POST; `AssignMemoryModal.jsx` and `MemoryCard.jsx` wiring; memory types mapping (`data/memory_types.json`)
- 2025-11-05 - Audit migration & audit behavior: `audit_logs` table + trigger-based assignment audit; docs updated
- 2025-11-11 - Deployment platform selection: Vercel chosen; removed QNAP/ARM workarounds
- 2025-11-14 - Circuit Dimension: Added `/calc/circuit-dimension-main` page, 7-question modal configuration, `MemoryCard` navigation fix for `memory_type='circuit'`, `localStorage` persistence for modal config, and a scaffolded secondary 4-container layout (Dark Blue header, Emerald Green project info, Purple tabs & gallery, White draft controls)

- 2025-11-26 - POC increments: finalized `/projects` as canonical in-repo gallery, converted `/dashboard` to a placeholder, updated sign-in redirect to `/projects`, added Tailwind/PostCSS guidance (prefer static classes), documented dynamic client-only imports for browser-dependent components, and noted that the POC uses an internal `.projects-scroll` max-height (~`60vh`) rather than explicit `--header-height`/`--footer-height` CSS variables.

- 2025-11-27 - Circuit Dimension UI rebuild (local): Rewrote `pages/calc/circuit-dimension-main.tsx` container-by-container (dark-blue header implemented, background rectangles replaced with `rect-a..rect-h`, `main` made transparent, per-page `body.no-footer-reserve` override added, and a fixed white DraftControls bar scaffolded). TypeScript checks were run locally with no diagnostics. These edits are local and pending commit/push.

- 2025-12-01 - Local UX & integration deltas: Updated circuit-dimension modal to include labels, helper text, accessible inputs and aria attributes; modal resized to `50vw` by `80vh`. Scoped CSS override applied in `styles/globals.css` to prevent a global `.grid>div { min-height: 160px }` rule from stretching dialog rows; modal-scoped rule sets `padding:6px !important` for inner grid children. Projects page now persists authenticated display values to `localStorage` keys (`mecalapp_user_name`, `mecalapp_user_role`) and the circuit-dimension page reads these to show consistent user info. Per-memory dev endpoints were added locally to support client probes (`pages/api/project_memories/[id]/metadata.js` and `.../data.js`).

- 2025-12-03 - Calculation & docs delta: Corrected 3φ voltage-drop and standardized percentage units in the calculation engine (`lib/calculations.ts`). `calculateRegulation()` and `calculateLossesPerc()` now return percent units; Equipment table UI appends `%` and formats to 2 decimals. Suggestion helper `suggestCaliber()` and resistance/Xl placeholders were added to the Equipment table (visual-only). See branch `circuit-dimension-memory`, commit `c3de3dc` for dependency upgrade details (Next.js → 16.0.7).

Additional UI & data delta (POC — 2025-12-01):

- Added `components/CommonInputs.tsx` (3x3 labeled input grid) and `components/ProjectInfoPanel.tsx` (right-side scaffold) to the Circuit Dimension POC. `CommonInputs` now sources conductor-type options from `data/conductor_types.json` and auto-updates the conductor-type select when material or temperature change.
- Added `data/conductor_types.json` (Cu/Al × 60/75/90°C) as a local cache for conductor-type options used by the POC UI.

Pending next steps (short):
- Wire DraftControls persistence handlers (`onPushToDatabase`, `onLoadFromDatabase`, `onExport`) and define API / JSONB contract if persistence moves to the backend.
- Implement Emerald Green `ProjectInfoPanel` and the purple/red/gray containers as per the architecture spec.

Short-term action items (2025-12-03):
- Add unit tests for `lib/calculations.ts` functions: `calculateVoltageDrop`, `calculateRegulation`, and `calculateLossesPerc` to guard against regressions.
- Update `calculation_guidelines/circuit_dimmension_architecture.md` to reflect that REG and LOS values are expressed in percent (
  e.g., 3.88 for 3.88%). I can apply that doc edit now if you want.

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
