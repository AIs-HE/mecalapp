### ProjectContext
*** Frontend Concepts Guide (ARCHIVAL) ***

**Last Updated:** 2025-10-30

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
Although this file is intentionally framework-agnostic, a minimal Next.js implementation now exists in this repository at the repo root. The implemented pieces are intentionally minimal and intended as a POC:

- Routes and files (repo root): `pages/index.js` (auth / entry), `pages/dashboard.js` (placeholder), `pages/api/projects.js` (server API for projects).
- Helpers: `lib/supabaseClient.js` (browser/client supabase client), `lib/supabaseAdmin.js` (server/admin client, reads `SUPABASE_SERVICE_ROLE_KEY`).
- Theme & styles: `styles/globals.css` (contains the locked color palette and parallax rectangle CSS) and `lib/theme.js` (exports colors for JS use).

When rebuilding a new frontend from this guide, you can either re-use those files as examples or re-implement components following the concepts in this document.

Routes (logical)
-----------------
- / : entry — redirect to authentication or to the application dashboard based on session
- /login : authentication (email/password)
- /dashboard : projects overview (project summaries)
- /project/:projectId : list of memories belonging to a project
- /memory/:memoryId : memory details / placeholder UI

Component responsibilities (conceptual)
-------------------------------------
- Header: display app title, current user's display name + role, and sign out action
- ProjectCard: displays project metadata; triggers selection/navigation
- MemoryCard: displays memory metadata and role-based actions
- Modal: focus-trapped dialog used for create/edit forms
- Forms: client-side minimal validation and surface server validation results

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
