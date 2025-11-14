### ProjectContext
*** Frontend Concepts Guide (ARCHIVAL) ***

**Last Updated:** 2025-11-14

Purpose
-------
This file is an archival frontend concepts guide intended to document user flows, component responsibilities, and UI data contracts in a framework-agnostic way. It is explicitly not an implementation file and contains no frontend code. Use it when rebuilding the frontend in a new folder; do not reuse existing frontend source files from this repository.

Scope
-----
- Logical routes and navigation flows
- Component responsibilities and data shapes (conceptual)
- UX and accessibility notes
- Minimal validation expectations
- Frontend ↔ backend data contracts (what the backend provides and expects)

Repository implementation note (2025-10-30)
----------------------------------------
Although this file is intentionally framework-agnostic, a minimal Next.js implementation now exists in this repository at the repo root. The implemented pieces are intentionally minimal and intended as a POC. The following is a concise map of what's implemented in the repo (useful when reconciling the conceptual guidance below with the existing POC):

- Routes and files (repo root):
  - `pages/index.js` — authentication entry (email/password), session checks and rectangle entrance/exit animations.
  - `pages/dashboard.js` — minimal dashboard with a project gallery, `AddProjectCard`, decorative background clump, and a full-width footer; projects are fetched from `pages/api/projects.js`.
  - `pages/api/projects.js` — example server API route using the admin client (`lib/supabaseAdmin.js`) to list/create projects (admin/testing flows only).

- Helpers & theme:
  - `lib/supabaseClient.js` — browser/client supabase client (uses `NEXT_PUBLIC_*` env vars).
  - `lib/supabaseAdmin.js` — server/admin supabase client (uses `SUPABASE_SERVICE_ROLE_KEY`) — must remain server-only.
  - `lib/theme.js` — exports the agreed color palette (primary `#85B726`, secondary `#858688`) for use in components.
  - `styles/globals.css` — global styles including color variables, parallax/decorative rectangle styles, card/grid layout helpers, and footer styles.

- Components (examples for visual reference):
  - `components/Header.jsx` — header with navigation and sign out
  - `components/ProjectCard.jsx` — fixed-height project card with left accent stripe and admin three-dots menu (top-right)
  - `components/AddProjectCard.jsx` — accessible add-card ("+") that appears at the end of the grid
  - `components/BackgroundRects.jsx` — small clump of decorative rectangles (replaces earlier single large rects)
  - `components/Footer.jsx` — full-width footer with centered inner content (company info and `company.svg`)

Notes about UI behaviours implemented in the POC:
- Project cards have a uniform height so the grid is visually consistent.
- The admin three-dots control is top-right in each card (placeholder for a menu).
- The `AddProjectCard` appears at the end of the grid and is shown even when no projects exist. The dashboard's main area scrolls when content overflows and the footer remains at page end when content is short.

Recent POC implementation details (delta — 2025-10-30)
-----------------------------------------------------
Below are concise, actionable deltas that reflect the concrete POC implementation in the repository (useful when reconciling the conceptual guidance above with the actual files):

- Tooling: Tailwind bootstrap files were added (`tailwind.config.js`, `styles/tailwind.css`, `postcss.config.js`) and required PostCSS packages were installed (including `autoprefixer` and the Tailwind PostCSS adapter) to satisfy Next's PostCSS pipeline.
- ProjectCard specifics:
  - Fixed height: cards use a fixed visual height (13rem) so the grid remains consistent across variable title lengths.
  - Title area: project title (`name`) wraps within the fixed height; the secondary `HE-XXXX` id sits directly under the title.
  - Bottom metadata: three blocks (memories count, Created, Updated) share equal width, have a small external 1px gap between them, and stack label/date lines for vertical clarity.
  - Admin menu: `⋯` is placed at top-right (inline absolute position) as a visual placeholder.
- Projects panel & inner container: `.projects-panel` is a centered light-gray panel and `.projects-inner` is a white inner container that fills the panel (box-sizing applied to avoid horizontal overflow).
- Scroll UX: the scroll container hides native scrollbars by default and reveals a thin styled scrollbar while scrolling via a `.scrolling` class toggled by JS (short 800ms hide timeout implemented in `pages/dashboard.js`).
- Header/title tweaks: the app title was increased to a larger size (`text-4xl`) and the Projects heading to `text-3xl` for clearer hierarchy.
- Accessibility: `AddProjectCard` is keyboard-accessible (Enter/Space handling) and project cards are focusable (`role="button"`, `tabIndex=0`).

POC deltas & new examples (2025-11-01)
------------------------------------
- NewProjectModal: `components/NewProjectModal.jsx` implements an Edit/Create modal that prefetches `project_memories` for the selected project, shows a vertical memory gallery with toggles, and normalizes backend rows by mapping either `type` or `memory_type` into a lowercase `type` key for the UI.
- Server API: `pages/api/project_memories.js` was added/iterated as an admin-only example route. It now selects/returns `memory_type` (matching seeded CSV fixtures) and the example normalizes a `type` property in responses so frontend code has a stable key (lowercased).
- Local cache & sync: `lib/cache.js` provides a localStorage-backed cache and an ops queue used by the modal to enqueue create/delete memory ops. A background `syncQueue()` pushes staged ops to the example API endpoints to give optimistic/offline-like behavior for the POC.
- Debugging aids: the modal contains a temporary debug panel showing the raw `/api/project_memories` response and the normalized map to help iterate mapping issues quickly during development.
 - Assignment workflow and UI: `components/AssignMemoryModal.jsx` and `components/MemoryCard.jsx` provide a small admin assignment UX. The example assignment API (`pages/api/memory_assignments.js`) was updated so POST behaves as update-or-insert for the same `memory_id` (ensuring one active assignment per memory) and will remove older duplicate rows if present. The MemoryCard displays the assigned user's full name.
  - Frontend fix (2025-11-04/05): `AssignMemoryModal.jsx` now attaches `Authorization: Bearer <access_token>` to user-scoped API requests (for example `/api/memory_assignments` and `/api/profiles`). The server derives `assigned_by` from the token; clients must not send `assigned_by` in the request body. This resolved a 401 seen during POC testing when the header was missing.
  - Audit note: assignment audit events are recorded by a DB trigger in the POC and the API-level audit writes for `memory_assignments` were removed to avoid duplicate audit rows. If you require HTTP-level metadata (request_id) in trigger logs, implement request/session propagation from the API before DML so triggers can capture it.
 - Memory types mapping: a local lookup file `data/memory_types.json` maps memory short types to canonical display names (for example `CIRCUIT` -> `CIRCUIT DIMENSION`). `components/MemoryCard.jsx` now uses this mapping to derive the title shown on cards; the transient Help link was removed from the POC.

POC security & server changes (2025-11-04)
-----------------------------------------
- Server-side auth hardening: example server routes under `pages/api/*` were updated to derive the acting user's id server-side from an Authorization Bearer token or from the `sb-access-token` cookie. The APIs no longer accept a `user_id` query parameter for user-scoped responses. This reduces the risk of client-side spoofing for employee-scoped queries. These `pages/api/*` routes remain admin/testing helpers and bypass RLS — treat them as development-only utilities.
- Assignment semantics: the `memory_assignments` example POST now requires an authenticated acting user (the server sets `assigned_by`) and performs update-or-insert behavior keyed by `memory_id` so a single memory has at most one active assignment in practice. The server also performs lightweight dedupe cleanup when duplicates are detected. For production, run a DB migration to dedupe existing rows and add a UNIQUE index/constraint on `memory_id` and preserve assignment history in `audit_logs`.
- Local cache & ops queue: the New Project modal and memory toggle UI use `lib/cache.js`, a small localStorage-backed staging area plus an ops queue and background `syncQueue()` that pushes operations to example API endpoints for optimistic/offline-like UX during development. Replace or upgrade this approach for production sync needs.

Developer note: after editing server-only environment variables (for example `SUPABASE_SERVICE_ROLE_KEY`) restart the Next.js dev server so server routes pick up the new values; several transient 500s during development were caused by stale server env/state.

Implementation guidance:
- These example API routes run with the admin/service Supabase client and bypass RLS. Treat them as development/admin helpers only — production endpoints should validate session/roles and never expose the service role key in client code.

Implementation note: treat these POC patterns as visual and integration examples only. For production, convert inline styles to reusable CSS/Tailwind utilities, add comprehensive accessibility/keyboard tests, and ensure server routes using the admin client remain behind protected server-only access.

When rebuilding a new frontend from this guide, you can reuse these files as examples or re-implement components following the concepts in this document. Treat the POC as a visual/UX reference; do not assume production readiness (wiring and security checks are minimal in the POC).

Routes (logical)
-----------------
- / : entry — redirect to authentication or to the application dashboard based on session
- /login : authentication (email/password)
- /dashboard : projects overview (project summaries)
- /project/:projectId : list of memories belonging to a project
- /memory/:memoryId : memory details / placeholder UI
- /calc/circuit-dimension-main : Circuit Dimension calculation page with configuration modal (2025-11-05)

Component responsibilities (conceptual)
-------------------------------------
- Header: display app title, current user's display name + role, and sign out action
- ProjectCard: displays project metadata; triggers selection/navigation
- MemoryCard: displays memory metadata and role-based actions; handles navigation to calculation pages based on memory type (circuit → circuit-dimension-main)
- Modal: focus-trapped dialog used for create/edit forms
- Forms: client-side minimal validation and surface server validation results
- CircuitDimensionMain: Configuration page for circuit dimension calculations with 7-question modal interface (2025-11-05)

Key UX flows
------------
- Login: submit credentials → receive session (backend) → redirect to dashboard
- Dashboard: list projects; admin/director see all projects; employees see only projects with assigned memories
- Memory assignment: create assignment server-side, then refresh or optimistically update UI

Frontend ↔ Backend expectations
-------------------------------
- Login request: { email, password } → expects session and user id on success
- Fetch projects: returns projects with client metadata or joins to client table
- Create project: accepts { name, client_id, status } and returns created row
- Create memory: accepts { project_id, memory_type, version } and returns created row
- Assign memory: accepts { memory_id, user_id, assigned_by } and returns assignment entry
- Circuit Dimension Configuration: stores { isHighVoltage, isSubstation, hasManualInputs, hasPresetTemplates, numCircuits, maxVoltage, equipmentType } in localStorage (2025-11-05)

Circuit Dimension Memory Implementation (2025-11-05)
---------------------------------------------------
- Main page: `/calc/circuit-dimension-main` - Configuration interface for circuit dimension calculations
- Modal interface: 7-question configuration form with boolean toggles and numeric inputs
- Configuration schema:
  - isHighVoltage: boolean (toggle)
  - isSubstation: boolean (toggle)
  - hasManualInputs: boolean (toggle)
  - hasPresetTemplates: boolean (toggle)
  - numCircuits: number (numeric input)
  - maxVoltage: number (numeric input)
  - equipmentType: "indoor" | "outdoor" (selection)
- Navigation: MemoryCard with memory_type="circuit" routes to circuit-dimension-main page
- Storage: Configuration persisted in localStorage with project/memory context
- Secondary layout: Placeholder for additional calculation components after configuration

Validation guidance (suggested)
------------------------------
- Project.name: required, 3–100 characters
- Memory.version: semantic-like version (1.0 or 1.0.1)
- Emails: basic RFC-compliant validation

Accessibility and i18n
----------------------
- Forms must be labelled and keyboard-accessible; modals trap focus
- Prepare UI strings for translation (external resource files)

Where to find authoritative backend details
-----------------------------------------
- Exact SQL schema and RLS policies: `backend_ref.md`
- API contract examples and server-side expectations: `system_sync_ref.md`
- Architecture decisions and role hierarchy: `complete_ref.md`

End of Frontend Concepts Guide

**Usage:**
- Wrap in `app/dashboard/layout.tsx`
- Fetch projects on mount based on user role
- `selectProject()` when card clicked → updates `currentProject` and fetches memories

### UIContext

**Location:** `src/contexts/UIContext.tsx`

**State:**
```tsx
interface UIState {
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  notification: {
    type: 'success' | 'error' | 'info';
    message: string;
  } | null;
}
```

**Methods:**
```tsx
const {
  isModalOpen,
  modalContent,
  notification,
  openModal,      // (content: React.ReactNode) => void
  closeModal,     // () => void
  showNotification // (type, message) => void
  hideNotification // () => void
} = useUI();
```

**Usage:**
- Show create project form: `openModal(<CreateProjectForm />)`
- Display success: `showNotification('success', 'Project created!')`
- Notifications auto-hide after 5 seconds

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px (1 column cards)
- Tablet: 640px - 1024px (2 column cards)
- Desktop: > 1024px (3 column cards)

### Card Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards here */}
</div>
```

### Dashboard Layout
- Mobile: Stacked navigation, hamburger menu
- Desktop: Horizontal navigation in header

---

## 🎭 Conditional Rendering Patterns

### Role-Based UI

**Admin/Director View:**
```tsx
// Dashboard shows all projects + create button
{(role === 'admin' || role === 'director') && (
  <CreateCard type="project" onClick={handleCreateProject} />
)}

// Project cards show three-dots menu
<ProjectCard 
  role={role}
  onEdit={handleEdit}     // Only shown if admin/director
  onDelete={handleDelete} // Only shown if admin/director
/>
```

**Employee View:**
```tsx
// Dashboard shows only projects with assigned memories
// No create button
// No three-dots menu on cards

// Memory cards filtered server-side by RLS
// Only assigned memories visible
```

### Loading States
```tsx
{loading ? (
  <div className="flex justify-center items-center h-64">
    <Spinner size="lg" />
  </div>
) : (
  <ProjectCardsGrid projects={projects} />
)}
```

### Empty States
```tsx
{projects.length === 0 && !loading && (
  <div className="text-center py-12">
    <p className="text-gray-500 text-lg">No projects yet</p>
    {role !== 'employee' && (
      <Button onClick={handleCreateProject}>Create First Project</Button>
    )}
  </div>
)}
```

---

## 📝 TypeScript Interfaces

### Frontend State Types
```tsx
// User-related
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'director' | 'employee';
}

// Project-related
interface Project {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  client_id: string;
  client_name: string;  // Joined from clients table
}

interface CreateProjectInput {
  name: string;
  client_id: string;
  status: 'active' | 'completed' | 'archived';
}

// Memory-related
interface Memory {
  id: string;
  project_id: string;
  memory_type: 'circuit' | 'protection' | 'ducts';
  version: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  assigned_to: string | null;  // User full name
  assigned_user_id: string | null;
}

interface CreateMemoryInput {
  memory_type: 'circuit' | 'protection' | 'ducts';
  version: string;
  assign_to?: string;  // User ID
}
```

**Note:** Database types from Supabase are in `system_sync_ref.md`

---

## 🧪 Form Validation Patterns

### Client-Side Validation
- Use `zod` library for schema validation
- Display errors inline below inputs
- Disable submit until valid

**Example Schema:**
```tsx
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  client_id: z.string().uuid(),
  status: z.enum(['active', 'completed', 'archived'])
});
```

### Error Display
```tsx
{errors.name && (
  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
)}
```

---

## 🔔 Notification System

### Notification Component
**Location:** `components/shared/Notification.tsx`

**Display:**
- Fixed position: top-right corner
- Auto-dismiss after 5 seconds
- Click X to dismiss manually
- Slide-in animation from right

**Types:**
- Success: Green background, checkmark icon
- Error: Red background, X icon
- Info: Blue background, info icon

**Usage:**
```tsx
const { showNotification } = useUI();
showNotification('success', 'Project created successfully!');
```

---

## 🔄 Cross-Reference Index

- Database schema details → `backend_ref.md#Database-Schema`
- API call patterns → `system_sync_ref.md`
- RLS policy logic → `backend_ref.md#RLS-Policies`
- Global architecture → `complete_ref.md`
- Development progress → `roadmap.md`

---

**End of Frontend Reference**
