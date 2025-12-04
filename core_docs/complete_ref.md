# Complete Reference - MecalApp Project (Backend/Architecture Focus)

**Last Updated:** 2025-12-04
**Last Updated (local edits):** 2025-12-04
**Last Updated (updated):** 2025-12-04
**Project Phase:** Phase 1 - Core Infrastructure

<!-- Circuit Dimension POC Summary (added 2025-12-02) -->
- Circuit Dimension POC added a configuration-first UI at
	`/calc/circuit-dimension-main` and a small calculation engine wired into
	the frontend POC. Architectural notes:
	- The POC computes placeholders (R, Xl) from ampacity lookups and
		displays a caliber suggestion; these behaviors are UI-only until a
		server-side JSONB contract and migration are agreed.
	- For productionize: define JSONB schema for per-memory config and add
		RLS-aware endpoints in `system_sync_ref.md` before moving persistence
		off `localStorage`.

<!-- Circuit Dimension POC Update (added 2025-12-03) -->
- 2025-12-03: calculation & UI deltas

- 2025-12-04: UI validation and CSS lint updates
	- Added per-row `inductiveReactance` controlled input validation to `components/EquipmentTableGallery.tsx` (decimal up to 3 places, > 0). Preserves typing buffers and shows inline tooltips on error.
	- Applied a small CSS lint-compatible update to `styles/globals.css` for number inputs (`appearance: textfield`) and annotated `styles/tailwind.css` to reduce unknown-at-rule linter warnings.
	- **Calculation correctness:** fixed three-phase voltage-drop (multiply by sqrt(3)) and updated `calculateRegulation()`/`calculateLossesPerc()` to return percent units; consumers should interpret REG/LOS as percent values.
	- **UI behavior:** suggested-caliber helper (`suggestCaliber()`), resistance and Xl shown as `placeholder` attributes (visual-only). Equipment table now keeps native horizontal overflow and the native horizontal scrollbar; wheel-to-horizontal experiments were removed to preserve vertical wheel behavior.
	- **Layout fixes:** added `min-h-0` and internal `flex-1 overflow-auto` scroll container so the equipment gallery no longer overflows its parent; table header remains sticky while the tbody scrolls.
	- **Files touched:** `pages/calc/circuit-dimension-main.tsx`, `components/EquipmentTableGallery.tsx`, `components/CircuitTabs.tsx`, `lib/calculations.ts`, and `styles/globals.css` (used `.hide-scrollbar`). Branch: `circuit-dimension-memory`.


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

Deployment Strategy (2025-11-11)
--------------------------------
**Selected Platform: Vercel**

After evaluating multiple deployment options including self-hosted solutions (QNAP ARM), the team selected Vercel as the production deployment platform for the following reasons:

**Why Vercel:**
- Perfect Next.js integration (made by Next.js creators)
- Zero configuration deployment
- Global CDN with excellent performance
- FREE tier sufficient for project needs (100GB bandwidth/month)
- Automatic deployments from GitHub
- Built-in SSL certificates and custom domains
- No ARM binary compatibility issues

**Abandoned Options:**
- QNAP self-hosting: Complex ARM architecture compatibility issues with SWC and LightningCSS native binaries
- Other platforms: More expensive or less optimized for Next.js

**Deployment Process:**
1. Push code to GitHub repository
2. Connect Vercel to GitHub repo
3. Configure environment variables in Vercel dashboard
4. Automatic deployment on git push
5. Continue using existing Supabase backend (no migration needed)

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
 - Local cache & sync: `lib/cache.js` was added to provide a localStorage-backed cache and an ops queue; toggle operations from the modal enqueue create/delete ops and a background `syncQueue()` pushes them to the example API endpoints.
 - Assignment behaviour (API): `pages/api/memory_assignments.js` was updated so POST operations perform an update-if-exists for the same `memory_id` (ensuring one active assignment per memory) and will remove duplicate older rows if present. Audit/history is recommended to be stored in `audit_logs` rather than keeping multiple assignment rows.
 - Memory types mapping: A small local lookup `data/memory_types.json` was added and `components/MemoryCard.jsx` now uses this mapping to display the canonical full memory name (e.g., `CIRCUIT` -> `CIRCUIT DIMENSION`). The POC removed the previously visible 'Help' link from the card title.
- Debugging aids: the New Project modal contains a temporary debug panel that shows the raw API response and the normalized map so developers can quickly validate mapping behavior during iteration.

Recent POC delta (2025-11-14)
-----------------------------
- Circuit Dimension implementation: Added a configuration-first calculation entry point at `/calc/circuit-dimension-main` with a 7-question modal and localStorage persistence. Navigation from memory cards was updated so `memory_type='circuit'` routes to the new page. A scaffolded secondary layout (4-container) is present to host calculation UI and will be wired to the documented calculation engine (see `calculation_guidelines/circuit_dimmension_architecture.md`).

POC security & API hardening (2025-11-04)
---------------------------------------
- Server APIs used by the POC were hardened so the server derives the requesting user's id from an Authorization Bearer token or the `sb-access-token` cookie. The example routes no longer accept a `user_id` query parameter for user-scoped results. Assignment POSTs require an authenticated actor and set `assigned_by` server-side to ensure proper attribution.
- Assignment semantics: the example `memory_assignments` POST performs update-or-insert semantics keyed by `memory_id` and removes older duplicate rows when detected. It is recommended to run a DB migration to dedupe existing rows and add a UNIQUE index on `memory_id` if you plan to enforce one-active-assignment at the DB level; persist history in `audit_logs`.
- Local developer note: a small local smoke test was executed during POC iteration to validate end-to-end example flows (project + memory creation and memory counts). When changing server-only environment variables (for example `SUPABASE_SERVICE_ROLE_KEY`) restart the Next.js dev server so routes pick up updated values — several transient 500s found during development were caused by stale server env/state.

Dev note: server-side environment variables (for example `SUPABASE_SERVICE_ROLE_KEY`) must be present in the running environment — restart the Next.js dev server after `.env.local` edits so server routes pick up updated values.

-Reminder: this POC is for reference only — backend RLS, migrations, and schema remain authoritative and unchanged by the POC.

Audit logging & request propagation (2025-11-05)
------------------------------------------------
- Migration state: an `audit_logs` table and helper RPC were applied in the Supabase project during POC iteration (migration executed by the operator in the Supabase SQL editor).
- Current repo behaviour:
	- Example API routes for projects and project_memories insert API-level audit rows for higher-level business events.
	- For `memory_assignments` audit rows are produced by a DB trigger (`trg_audit_memory_assignments`) and API-level audit writes for assignments were removed to avoid duplicates; the trigger is canonical for assignment events.

- If you require HTTP-level traceability in trigger-originated audit rows, propagate a per-request `request_id` from the API into the PostgreSQL session before DML. Example server-side call (once per request before DML):

		SELECT set_config('request.request_id', '<uuid-v4>', true);

	Triggers can then call `current_setting('request.request_id', true)` and persist that value into audit rows so audit logs include both the DB-level event and HTTP request correlation.

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
- Production deployment guide: `deployment_guide.md`

End of Complete Reference
 
Additional UI & data delta (POC — 2025-12-01):

- Added `components/CommonInputs.tsx` (3x3 grid of labeled inputs) and `components/ProjectInfoPanel.tsx` (right-side scaffold) as part of the Circuit Dimension POC UI. `CommonInputs` now consumes `data/conductor_types.json` and provides a conductor-type `<select>` that updates when `conductorMaterial` or `conductorTemperature` change.
- Added `data/conductor_types.json` to cache conductor-type options (Cu/Al × 60/75/90°C) for the UI; this JSON is used client-side by the POC only.
- Added per-memory dev example endpoints under `pages/api/project_memories/[id]/metadata.js` and `pages/api/project_memories/[id]/data.js` to support lightweight client probes. These are development-only example routes and must be secured for production.
- Minor CSS scoping: `styles/globals.css` includes modal-scoped overrides to avoid broad `.grid>div` layout regressions affecting dialog content.
---

POC Implementation Update (2025-11-26)
------------------------------------
Summary of repository-level choices made during POC iteration that are useful for architects and integrators.

- Repo layout & canonical choices:
	- The in-repo Next.js POC lives at the repository root and is intentionally minimal; use it as a visual/integration reference only. Consider moving a production frontend into a separate `frontend/` workspace when ready.
	- `lib/supabaseClient.js` (browser) and `lib/supabaseAdmin.js` (server-only) are the canonical helpers in the repo; do not expose the service role key in client code.

- UX & frontend implementation notes that affect architecture:
	- Navigation: `/projects` is the canonical projects gallery route; `/dashboard` was converted to a placeholder during POC and `/projects` hosts the projects UI.
	- The dev POC uses dynamic client-only imports for heavy components (avoid SSR load issues); this approach was used in `pages/projects.js` to keep the SSR surface minimal.
	- Tailwind/PostCSS build: prefer static class strings to ensure utilities are emitted in compiled CSS; ensure `autoprefixer` and the Tailwind PostCSS adapter are configured in `postcss.config.js`.

- Tokens & layout constants (for system-level style alignment):
	- Colors: primary `#85B726`, muted `#858688` exported in `lib/theme.js` and referenced in `styles/globals.css`.
	- Layout tokens: The POC does not define `--header-height`/`--footer-height` CSS variables in `styles/globals.css`. The projects scroll area uses a `max-height` of ~`60vh` in the POC; consider adding explicit header/footer tokens in production frontends to reserve space when using fixed header/footer bars.

- Circuit Dimension & calculation module:
	- A POC calculation entry point exists at `/calc/circuit-dimension-main` (configuration-first modal with localStorage persistence). When productionizing, plan for a dedicated storage strategy (JSONB column or a related table) and an API contract for calculation runs.

POC Update (2025-12-01)
-----------------------
- UI: `/calc/circuit-dimension-main` was updated locally with a labeled, accessible 7-question modal (four toggles + three numeric inputs), persisted to `localStorage` under `circuit_config:<memoryId>`. The modal was restyled (compact grid, labeled inputs) and resized to `50vw` x `80vh` for a centered dialog experience.
- Styling: a global CSS rule was scoped for dialogs to avoid a `.grid>div { min-height: 160px }` global effect. The modal uses `.circuit-modal` as a container and `styles/globals.css` includes a modal-scoped override setting `min-height:0` and `padding:6px !important` for `.circuit-modal .grid>div`. This is a local UI fix and does not alter canonical styles elsewhere.
- Auth display sync: the Projects page now persists authenticated display name and role into `localStorage` keys `mecalapp_user_name` and `mecalapp_user_role`; pages such as the circuit-dimension POC read these keys and show the same user display information.
- API routes: per-memory example endpoints were added locally to support client probes: `pages/api/project_memories/[id]/metadata.js` and `pages/api/project_memories/[id]/data.js`. These are dev-only admin routes.

POC Incremental Update (2025-11-27)
----------------------------------
- Local UI delta: the Circuit Dimension page (`/calc/circuit-dimension-main`) was reimplemented container-by-container in TypeScript. Key UI notes for architects:
	- Header: dark-blue header uses the theme token `--color-main` and is content-driven (no fixed height).
	- Background: the page preserves the `bg-clump` decorative wrapper but now uses the project-style rectangles `rect-a`..`rect-h` so the look matches the projects page.
	- Footer reservation: page toggles `body.no-footer-reserve` on mount to set `--footer-height: 0` for this page only; this is a per-page CSS override and does not change DB policies.
	- DraftControls: a fixed white bottom DraftControls bar was added to the scaffold (placeholder action handlers). The `main` area is transparent and uses bottom padding so content is not occluded by the fixed bar.

Notes & next steps for architecture:
- These are UI-only changes; if persistence is added (save/load from DB) define the JSONB contract and update `backend_ref.md` migrations before applying DB changes.
- The page was validated locally with `npx tsc --noEmit`; no TypeScript errors reported. No commits/pushes were performed — changes remain local until instructed to commit.

Memory types (POC)
------------------
- Canonical column: `memory_type` (the DB column used in `project_memories`). The POC intentionally keeps the DB column named `memory_type` and the server responses reflect that field.
- Known values observed in the POC / seeded data: `circuit`, `ducts`, `protection`.
- Frontend normalization: the POC client normalizes rows to expose a `type` property for UI convenience (i.e., `memory_type` -> `type`). The canonical source-of-truth remains the `memory_type` DB column.
- Mapping file: A small lookup is included in the repo at `data/memory_types.json` that maps the canonical values to display names (e.g., `"circuit": "CIRCUIT DIMENSION"`). Components such as `components/MemoryCard.jsx` use this mapping to render friendly names.


Use these notes to align system-level decisions (deployment, environment, infra) with the POC's in-repo choices. For production work, prefer separate, testable frontend workspaces and CI jobs that run migrations and type generation as part of the deploy pipeline.

POC Update (2025-12-02)
-----------------------
- The Circuit Dimension POC now persists per-memory configuration to `localStorage` under `circuit_config:<memoryId>` and reads `mecalapp_user_name`/`mecalapp_user_role` from `localStorage` for header display consistency.
- `components/ProjectInfoPanel.tsx` was added and wires to fetch project/client/memory metadata when `projectId`/`memoryId` are provided; it renders read-only Cost Center, Project Name, Client and Version fields.
- `components/CommonInputs.tsx` implements the 3×3 inputs grid and uses `data/conductor_types.json` for conductor-type options; selection auto-corrects when conductor material or temperature change.
- Recommended next architectural steps: add `lib/auth.js` to centralize localStorage auth reads/writes and design a JSONB schema + migration for server-side modal-config persistence before enabling DB saves in production.

POC Delta (2025-12-03): calculation + UI deltas
-----------------------------------------------
- Calculation fixes: the in-repo calculation helpers were corrected — three-phase voltage drop formula fixed (multiply by sqrt(3)), and `calculateRegulation()` and `calculateLossesPerc()` now return percent units to align with UI thresholds and display.
- UI & placeholders: `suggestCaliber()` helper added; resistance and Xl are shown as input `placeholder` attributes when the model fields are empty (visual-only). The equipment table now allows native horizontal overflow and displays the native horizontal scrollbar; wheel-to-horizontal behavior was removed.
- Dev dependency: `next` was upgraded to `16.0.7` to address a security advisory (see branch `circuit-dimension-memory`, commit `c3de3dc`).

Implication: these are frontend and calculation-engine changes only. If you plan to persist any of the UI modal-configs or placeholder-derived values server-side, define a JSONB schema and migration and update the API contracts in `system_sync_ref.md` before applying DB changes.
