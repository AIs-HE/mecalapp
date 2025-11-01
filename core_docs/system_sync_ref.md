# System Sync Reference - MecalApp (Backend-focused)

**Last Updated:** 2025-11-01

Purpose
-------
This document describes the canonical data flows, backend contracts, and integration patterns between any future frontend and the Supabase backend. It does not include frontend implementation code. Use this file to re-create client-side interactions against the existing Supabase database and RLS.

What this file contains
-----------------------
- Supabase usage principles and recommended patterns for server and client interactions
- API/data contract expectations for all key user actions (login, project CRUD, memory CRUD, assignment)
- Recommended error handling and status mappings
- Canonical TypeScript types derived from the database schema (for generating types in a new frontend)

Local implementation notes (repository state as of 2025-10-30)
---------------------------------------------------------
- Frontend location: a minimal Next.js frontend now exists at the repository root and uses the Top-level `pages/`, `lib/`, `styles/`, and `public/` folders. An older duplicate `frontend/` copy was removed; the root app is canonical.
- Client helper: `lib/supabaseClient.js` (reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — intended for browser calls that are RLS-aware.
- Server admin helper: `lib/supabaseAdmin.js` (reads `SUPABASE_SERVICE_ROLE_KEY`) — must be used only server-side (for API routes and migration scripts) and never exposed to the browser.
- Implemented server route: `pages/api/projects.js` — GET returns project list and POST creates a project using the admin client (use for admin/testing flows only; mindful of bypassing RLS).
- Auth UI: `pages/index.js` implements email/password sign-in with `supabase.auth.signInWithPassword`, session checks via `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange`, and a small dashboard flow used for manual testing.
- Theme & styles: `styles/globals.css` contains CSS variables for the agreed color palette (primary `#85B726`, secondary `#858688`) and the parallax rectangle animations; the same palette is exported to JS via `lib/theme.js` for consistent usage across components.

Local implementation notes (UI details)
---------------------------------------------------------
- The repo contains a small in-repo frontend POC (see `frontend_ref.md` for higher-level notes). Key UI/UX details implemented for quick manual testing:
  - `components/ProjectCard.jsx` — fixed-height project cards with a left primary-color accent stripe; three-dots admin menu is positioned at the top-right as a placeholder for edit/delete actions.
  - `components/AddProjectCard.jsx` — accessible add-card with a centered "+" that is rendered at the end of the projects grid. It is shown even when there are no projects.
  - Project grid behavior: projects are rendered first and the add-card is appended at the end; the grid area is vertically scrollable (so the rest of the page layout and footer remain stable when many items are present).
  - Decorative rectangles: `components/BackgroundRects.jsx` implements a small clump of rotated rectangles used on auth and dashboard pages replacing the prior single large rectangles.
  - Footer: `components/Footer.jsx` provides a full-width footer bar with an inner centered `.app-footer` container; the dashboard layout uses a column flex layout so the footer sits at the bottom of the page when content is short.

Implementation deltas (2025-10-30)
--------------------------------
Short, concrete notes about the implemented POC in the repo (useful when wiring a new frontend to the canonical API):

- Card layout: each `ProjectCard` uses a fixed height (13rem) so title length doesn't change card height. Title wraps within the fixed height; the small `HE-XXXX` ID sits under the title.
- Metadata area: the bottom row contains three equal-width blocks (memories count, Created, Updated). They are implemented with `flex: 1` so they share the available width and use a 1px external gap (margin) between them.
- Projects panel: `.projects-panel` is the outer light-gray panel and `.projects-inner` is the white inner container; `box-sizing: border-box` was applied and the inner container uses `width:100%` to prevent horizontal overflow when the panel has padding.
- Scrollbar UX: the projects scroll container hides native scrollbars by default and reveals a thin, styled scrollbar only while the user is scrolling. JS in `pages/dashboard.js` toggles a `.scrolling` class on the scroll container and CSS in `styles/globals.css` provides the visual thumb.
- Header & headings: `MeCalApp` title was increased to `text-4xl` and the Projects heading in the dashboard was increased to `text-3xl` for visual hierarchy.
- Accessibility: `AddProjectCard` is keyboard-accessible and project cards are focusable (`role="button"`, `tabIndex=0`).

Implementation deltas (2025-11-01)
--------------------------------
- API mapping: `pages/api/project_memories.js` was added/iterated as an example server route. The example was corrected to use the seeded column `memory_type` and to avoid referencing non-existent columns (such as `title`). The API normalizes output rows by adding a stable `type` property (lowercased), so frontend code can rely on a consistent key regardless of the DB naming variant.
- Frontend modal: `components/NewProjectModal.jsx` now prefetches `project_memories` for edit mode and normalizes rows that might include `type` or `memory_type`. The modal presents a vertical memory gallery with toggles that stage operations locally.
- Local staging & sync: `lib/cache.js` provides a small localStorage-backed cache and an ops queue. Toggle actions are enqueued locally and a background `syncQueue()` pushes staged create/delete ops to the example API endpoints to provide optimistic/offline-like behaviour in the POC.
- Developer note: during iterations several 500 errors were caused by schema mismatches (expecting `type` vs `memory_type`) and by the dev server not picking up server-only env vars. Restart the Next dev server after editing `.env.local` so server routes pick up `SUPABASE_SERVICE_ROLE_KEY`.

Implementation note: these are UI/tooling conveniences for the POC and do not change the canonical API or RLS policies. When porting to a production frontend, move inline styles to CSS/Tailwind, add aria attributes and keyboard testing, and ensure server routes using the admin client remain server-only.

These notes are implementation pointers — they do not change the canonical API contracts documented in this file but will help frontend engineers find the implemented helpers and example routes in this repo.

Supabase usage notes
---------------------
- Auth: Supabase Auth manages users and sessions. Use server-side helpers where possible to access session cookies in a secure manner.
- Prefer using Supabase server helpers (or server-side SDK integration) to perform actions that require the service_role key (migrations, seeds). Do NOT expose the service role key in the browser.
- Use RLS-aware client SDK calls from the frontend. RLS will enforce permissions based on `auth.uid()` and policy definitions in the database.

Data contracts (canonical)
-------------------------
Below are the expected request and response shapes for the main flows. All requests are standard Supabase client calls; in a custom API they can be wrapped in REST endpoints.

1) Login
  - Request (frontend): { email: string, password: string }
  - Behavior: call Supabase Auth signInWithPassword / token endpoint
  - On success: session and user id available; frontend should then fetch the `profiles` row for that user id
  - Error mapping: invalid credentials → 400 with error { message: 'Invalid login credentials' }

2) Fetch projects (Dashboard)
  - Admin/Director: return all projects with client name and metadata
  - Employee: return projects where the employee has at least one assigned memory (see RLS)
  - Example response shape (array of objects):
    {
      id: string,
      name: string,
      status: 'active' | 'completed' | 'archived',
      created_at: string (ISO),
      client_name?: string
    }

3) Create project
  - Request: { name: string, client_id: uuid, status?: string }
  - Response: created project row
  - Errors: validation failures → 4xx; DB constraint failures → 4xx/5xx

4) Create memory
  - Request: { project_id: uuid, memory_type: 'circuit'|'protection'|'ducts', version?: string }
  - Response: created memory row

5) Assign memory
  - Request: { memory_id: uuid, user_id: uuid, assigned_by: uuid }
  - Response: memory_assignments row

Error handling principles
-------------------------
- Map Supabase errors to user-facing messages; do not expose raw SQL errors.
- Common cases:
  - Invalid credentials → show 'Incorrect email or password'
  - RLS rejection (permission denied) → show 'You do not have permission to perform this action.'
  - Constraint violation (duplicate assignment) → show relevant message like 'Assignment already exists.'

Type definitions (canonical) — use these to generate frontend types
----------------------------------------------------------------
// TypeScript interfaces that mirror DB rows
export interface Profile {
  id: string; // uuid (auth.users.id)
  role: 'admin' | 'director' | 'employee';
  full_name: string;
  email: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface ClientRow {
  id: string;
  name: string;
  contact_info: any; // JSONB
  created_at: string;
  created_by: string | null;
}

export interface ProjectRow {
  id: string;
  name: string;
  client_id: string;
  status: 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ProjectMemoryRow {
  id: string;
  project_id: string;
  memory_type: 'circuit' | 'protection' | 'ducts';
  version: string;
  status: 'draft' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface MemoryAssignmentRow {
  id: string;
  memory_id: string;
  user_id: string;
  assigned_at: string;
  assigned_by: string | null;
}

export interface AuditLogRow {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_id: string | null;
  timestamp: string;
  changes: any; // JSONB
}

Notes on implementing a fresh frontend
-------------------------------------
- Generate types from the database (recommended: use Supabase's type generator or `supabase gen types`), then reconcile with the interfaces above.
- Implement calls using the Supabase client (or a thin REST wrapper) and rely on RLS for security.
- Use the TypeScript interfaces above as the contract for component props and API responses.

Where implementation details live
--------------------------------
- For strict DB definitions and RLS policies consult `backend_ref.md`.
- For high-level architecture and role rationale consult `complete_ref.md`.

End of System Sync Reference
```typescript
async function fetchProjectsForEmployee(userId: string) {
  // RLS will filter automatically, but we help with explicit query
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      name,
      status,
      created_at,
      client:clients(name),
      project_memories!inner(
        id,
        memory_assignments!inner(
          user_id
        )
      )
    `)
    .eq('project_memories.memory_assignments.user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    showNotification('error', 'Failed to load projects');
    return [];
  }
  
  // Remove duplicates (same project multiple assigned memories)
  const uniqueProjects = Array.from(
    new Map(data.map(p => [p.id, p])).values()
  );
  
  return uniqueProjects.map(project => ({
    id: project.id,
    name: project.name,
    status: project.status,
    created_at: project.created_at,
    client_name: project.client?.name || 'Unknown Client',
  }));
}
```

**Data Flow:**
```
User lands on /dashboard
  ↓
Check user role from AuthContext
  ↓
If Admin/Director → fetchProjects()
If Employee → fetchProjectsForEmployee(user.id)
  ↓
RLS filters results automatically
  ↓
Transform data for UI format
  ↓
Render ProjectCard components
```

---

### Pattern: Create Project

**User Action:** Click create project button → Fill form → Submit

**Frontend Implementation:**
```typescript
async function createProject(data: CreateProjectInput) {
  try {
    // Step 1: Insert project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: data.name,
        client_id: data.client_id,
        status: data.status,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (projectError) throw projectError;
    
    // Step 2: Log audit entry
    await supabase.rpc('log_audit', {
      p_table_name: 'projects',
      p_record_id: project.id,
      p_action: 'INSERT',
      p_changes: { after: project },
    });
    
    // Step 3: Update UI
    showNotification('success', 'Project created successfully');
    closeModal();
    
    // Step 4: Refresh projects list
    await fetchProjects();
    
  } catch (error) {
    console.error('Error creating project:', error);
    showNotification('error', 'Failed to create project');
  }
}
```

**Data Flow:**
```
User submits form
  ↓
Validate on client side
  ↓
INSERT into projects table
  ↓
RLS checks user role (must be admin/director)
  ↓
On success → Call log_audit function
  ↓
Update local state / refetch projects
  ↓
Show success notification
  ↓
Close modal
```

---

### Pattern: Fetch Memories for Project

**User Action:** Click on a project card

**Frontend Implementation:**
```typescript
async function fetchMemories(projectId: string, userId: string, role: string) {
  let query = supabase
    .from('project_memories')
    .select(`
      id,
      memory_type,
      version,
      status,
      created_at,
      memory_assignments(
        user_id,
        user:profiles(full_name)
      )
    `)
    .eq('project_id', projectId);
  
  // For employees, RLS will filter to assigned only
  // No need for additional filter here
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching memories:', error);
    showNotification('error', 'Failed to load calculation memories');
    return [];
  }
  
  // Transform for UI
  return data.map(memory => ({
    id: memory.id,
    memory_type: memory.memory_type,
    version: memory.version,
    status: memory.status,
    created_at: memory.created_at,
    assigned_to: memory.memory_assignments[0]?.user?.full_name || null,
    assigned_user_id: memory.memory_assignments[0]?.user_id || null,
  }));
}
```

**Data Flow:**
```
User clicks ProjectCard
  ↓
Call fetchMemories(projectId, userId, role)
  ↓
Query project_memories with JOIN to memory_assignments
  ↓
RLS automatically filters:
  - Admin/Director: All memories for project
  - Employee: Only assigned memories
  ↓
Transform data (flatten assignment info)
  ↓
Render MemoryCard components
```

---

### Pattern: Create Memory

**User Action:** Click create memory button → Fill form → Submit

**Frontend Implementation:**
```typescript
async function createMemory(projectId: string, data: CreateMemoryInput) {
  try {
    // Step 1: Insert memory
    const { data: memory, error: memoryError } = await supabase
      .from('project_memories')
      .insert({
        project_id: projectId,
        memory_type: data.memory_type,
        version: data.version,
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();
    
    if (memoryError) throw memoryError;
    
    // Step 2: Create assignment if user selected
    if (data.assign_to) {
      const { error: assignError } = await supabase
        .from('memory_assignments')
        .insert({
          memory_id: memory.id,
          user_id: data.assign_to,
          assigned_by: user.id,
        });
      
      if (assignError) throw assignError;
    }
    
    // Step 3: Log audit
    await supabase.rpc('log_audit', {
      p_table_name: 'project_memories',
      p_record_id: memory.id,
      p_action: 'INSERT',
      p_changes: { after: memory },
    });
    
    // Step 4: Update UI
    showNotification('success', 'Calculation memory created');
    closeModal();
    await fetchMemories(projectId, user.id, user.role);
    
  } catch (error) {
    console.error('Error creating memory:', error);
    showNotification('error', 'Failed to create memory');
  }
}
```

---

### Pattern: Assign Memory to Employee

**User Action:** Click three-dots → Assign → Select employee → Submit

**Frontend Implementation:**
```typescript
async function assignMemory(memoryId: string, employeeId: string) {
  try {
    // Check if already assigned
    const { data: existing } = await supabase
      .from('memory_assignments')
      .select('id')
      .eq('memory_id', memoryId)
      .eq('user_id', employeeId)
      .single();
    
    if (existing) {
      showNotification('info', 'User is already assigned to this memory');
      return;
    }
    
    // Insert assignment
    const { error } = await supabase
      .from('memory_assignments')
      .insert({
        memory_id: memoryId,
        user_id: employeeId,
        assigned_by: user.id,
      });
    
    if (error) throw error;
    
    // Log audit
    await supabase.rpc('log_audit', {
      p_table_name: 'memory_assignments',
      p_record_id: memoryId,
      p_action: 'INSERT',
      p_changes: {
        after: { memory_id: memoryId, user_id: employeeId }
      },
    });
    
    showNotification('success', 'Memory assigned successfully');
    closeModal();
    await fetchMemories(currentProjectId, user.id, user.role);
    
  } catch (error) {
    console.error('Error assigning memory:', error);
    showNotification('error', 'Failed to assign memory');
  }
}
```

---

### Pattern: Delete Project

**User Action:** Click three-dots → Delete → Confirm

**Frontend Implementation:**
```typescript
async function deleteProject(projectId: string) {
  try {
    // Log before deletion
    await supabase.rpc('log_audit', {
      p_table_name: 'projects',
      p_record_id: projectId,
      p_action: 'DELETE',
      p_changes: { before: { id: projectId } },
    });
    
    // Delete project (CASCADE will delete memories and assignments)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    
    if (error) throw error;
    
    showNotification('success', 'Project deleted');
    await fetchProjects();
    
  } catch (error) {
    console.error('Error deleting project:', error);
    
    // Check if constraint violation (e.g., can't delete client with projects)
    if (error.code === '23503') {
      showNotification('error', 'Cannot delete project with dependencies');
    } else {
      showNotification('error', 'Failed to delete project');
    }
  }
}
```

---

### Pattern: Delete Memory

**User Action:** Click three-dots on memory → Delete → Confirm

**Frontend Implementation:**
```typescript
async function deleteMemory(memoryId: string) {
  try {
    // Log before deletion
    await supabase.rpc('log_audit', {
      p_table_name: 'project_memories',
      p_record_id: memoryId,
      p_action: 'DELETE',
      p_changes: { before: { id: memoryId } },
    });
    
    // Delete memory (CASCADE will delete assignments)
    const { error } = await supabase
      .from('project_memories')
      .delete()
      .eq('id', memoryId);
    
    if (error) throw error;
    
    showNotification('success', 'Calculation memory deleted');
    await fetchMemories(currentProjectId, user.id, user.role);
    
  } catch (error) {
    console.error('Error deleting memory:', error);
    showNotification('error', 'Failed to delete memory');
  }
}
```

---

## 🎯 TypeScript Types (Generated from Supabase)

### Generate Types Command
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

### Database Types (Generated)
```typescript
// src/types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'director' | 'employee'
          full_name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: 'admin' | 'director' | 'employee'
          full_name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'director' | 'employee'
          full_name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          contact_info: Json | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          contact_info?: Json | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          contact_info?: Json | null
          created_at?: string
          created_by?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          client_id: string
          status: 'active' | 'completed' | 'archived'
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          name: string
          client_id: string
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          name?: string
          client_id?: string
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      project_memories: {
        Row: {
          id: string
          project_id: string
          memory_type: 'circuit' | 'protection' | 'ducts'
          version: string
          status: 'draft' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          project_id: string
          memory_type: 'circuit' | 'protection' | 'ducts'
          version?: string
          status?: 'draft' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          project_id?: string
          memory_type?: 'circuit' | 'protection' | 'ducts'
          version?: string
          status?: 'draft' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      memory_assignments: {
        Row: {
          id: string
          memory_id: string
          user_id: string
          assigned_at: string
          assigned_by: string
        }
        Insert: {
          id?: string
          memory_id: string
          user_id: string
          assigned_at?: string
          assigned_by: string
        }
        Update: {
          id?: string
          memory_id?: string
          user_id?: string
          assigned_at?: string
          assigned_by?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id: string | null
          timestamp: string
          changes: Json | null
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id?: string | null
          timestamp?: string
          changes?: Json | null
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: 'INSERT' | 'UPDATE' | 'DELETE'
          user_id?: string | null
          timestamp?: string
          changes?: Json | null
        }
      }
    }
    Functions: {
      log_audit: {
        Args: {
          p_table_name: string
          p_record_id: string
          p_action: string
          p_changes: Json
        }
        Returns: void
      }
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
  }
}
```

---

## ⚠️ Error Handling

### Common Supabase Error Codes

| Code | Meaning | User-Friendly Message |
|------|---------|----------------------|
| `PGRST116` | Row not found | "Item not found" |
| `23505` | Unique violation | "This item already exists" |
| `23503` | Foreign key violation | "Cannot delete item with dependencies" |
| `42501` | Insufficient privilege (RLS) | "You don't have permission to perform this action" |
| Auth errors | Invalid credentials | "Incorrect email or password" |

### Error Handling Wrapper
```typescript
// src/lib/utils/errorHandler.ts
export function handleSupabaseError(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  // Auth errors
  if (error.message === 'Invalid login credentials') {
    return 'Incorrect email or password';
  }
  
  // Database errors
  if (error.code === '23505') {
    return 'This item already exists';
  }
  
  if (error.code === '23503') {
    return 'Cannot delete item with dependencies';
  }
  
  if (error.code === '42501' || error.code === 'PGRST301') {
    return "You don't have permission to perform this action";
  }
  
  if (error.code === 'PGRST116') {
    return 'Item not found';
  }
  
  // Default
  return error.message || 'An error occurred. Please try again.';
}
```

---

## 🔄 Real-time Subscriptions (Future Phase)

**Note:** Not implemented in Phase 1, but prepared for Phase 2

### Example: Listen to Memory Assignments
```typescript
// When employee is assigned to memory, notify them in real-time
useEffect(() => {
  const channel = supabase
    .channel('memory_assignments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'memory_assignments',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        showNotification('info', 'You have been assigned to a new memory');
        // Refetch memories
        fetchMemories(currentProjectId, user.id, user.role);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);
```

---

## 🔄 Cross-Reference Index

- Frontend components using these patterns → `frontend_ref.md`
- Database schema details → `backend_ref.md#Database-Schema`
- RLS policy rules → `backend_ref.md#RLS-Policies`
- Role permission matrix → `complete_ref.md#Role-Hierarchy`
- Implementation roadmap → `roadmap.md`

---

**End of System Sync Reference**
