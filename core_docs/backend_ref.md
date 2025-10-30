# Backend Reference - MecalApp

**Last Updated:** 2025-10-28  
**Project Phase:** Phase 1 - Core Infrastructure

---

## 📋 FILE GUIDELINES FOR AI UPDATES

**Purpose of this file:**
- Contains ALL backend-specific implementation details
- Supabase database schema with complete SQL definitions
- Row Level Security (RLS) policies with full SQL
- Database functions, triggers, and constraints
- Migration strategy and seeding

**What belongs here:**
- Complete table schemas (columns, types, constraints, defaults)
- Foreign key relationships and indexes
- RLS policy definitions in SQL
- Database functions and triggers
- Enum types and custom types
- Migration file contents
- Seed data SQL scripts
- Supabase configuration details
- Query optimization notes

**What does NOT belong here:**
- Frontend components or UI logic → `frontend_ref.md`
- API call patterns from frontend → `system_sync_ref.md`
- High-level architecture → `complete_ref.md`
- TypeScript interfaces for frontend state → `frontend_ref.md`
- Project roadmap → `roadmap.md`

**When updating this file:**
1. Read this guidelines section first
2. Ensure all SQL is tested and runnable
3. Update migration files when schema changes
4. Document WHY a constraint or policy exists, not just what it does
5. Keep RLS policies in sync with role permissions in `complete_ref.md`

Repository note (2025-10-30)
---------------------------
This repository now contains a minimal Frontend implementation at the repo root (Next.js). That implementation is intentionally small and resides only as a POC. DO NOT move backend schema, SQL, or RLS policy semantics into frontend files. Backend authors should continue to treat `backend_ref.md` as the single source of truth for SQL and RLS. The presence of `pages/api/*` routes in the repo is a thin server layer for example/admin flows and does not alter the canonical DB policies.

Frontend POC (implementation notes)
-----------------------------------
The repo currently includes a minimal Next.js frontend (POC). This is intended for manual testing and visual mockups only; it is not a replacement for a production frontend. For clarity, the following files and UI behaviors are present in the repo root and illustrate integration patterns you may reference:

- `lib/supabaseClient.js` — browser/client Supabase client (uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- `lib/supabaseAdmin.js` — server/admin Supabase client (uses `SUPABASE_SERVICE_ROLE_KEY`) and must only be used in server code.
- `lib/theme.js` — exports the locked color palette (primary `#85B726`, secondary `#858688`).
- `styles/globals.css` — global CSS: color variables, parallax/decorative rectangle styles, animations, footer styles and layout helpers used by the POC.
- `pages/index.js` — authentication entry (email/password) with session persistence and rectangle entrance animations.
- `pages/dashboard.js` — minimal dashboard rendering header, projects grid, add-project card, and footer; fetches projects from `pages/api/projects.js`.
- `pages/api/projects.js` — example server route using the admin client to GET project lists and POST new projects (admin/testing flows only).
- `components/Header.jsx`, `components/ProjectCard.jsx`, `components/AddProjectCard.jsx`, `components/BackgroundRects.jsx`, `components/Footer.jsx`, `components/MemoryCard.jsx` — POC components demonstrating the intended UI layout and interactions.

Notable UI behaviors in the POC:
- Project cards have a fixed visual size so grid layout remains consistent; cards include a left primary-color accent stripe.
- The admin three-dots menu is visually positioned at the top-right of each card (UI placeholder for edit/delete actions).
- An Add project card (`AddProjectCard`) is rendered at the end of the projects grid; it is accessible via keyboard and shows a centered "+".
- The projects grid becomes scrollable when there are many cards (the `<main>` area grows and scrolls while the footer remains at page end).
- A decorative clump of rotated rectangles is implemented as `BackgroundRects.jsx` and used on the auth and dashboard pages for the parallax/visual effect.

Security reminder: The presence of `lib/supabaseAdmin.js` and server API routes is for example/admin flows only. Never expose or commit the `SUPABASE_SERVICE_ROLE_KEY`; ensure server routes that use the admin client are protected and audited.
6. Update "Last Updated" date at the top
7. Reference other files like "See `complete_ref.md#Role-Hierarchy`" for context

---

# Backend Reference (Supabase schema, RLS, seeds)

**Last Updated:** 2025-10-30

This file is the canonical SQL reference for the MecalApp Supabase backend. It includes table definitions, indexes, Row Level Security (RLS) policies, example seed data, and migration guidance. Keep this file authoritative for DB re-creation and migrations.

IMPORTANT: Do not change semantic meanings of columns or RLS policy intent. If you need to update schema, create a migration and add an explanatory comment here.

Core schema (SQL snippets)
--------------------------
-- profiles: extended user info, linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  role text DEFAULT 'employee',
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- clients: client companies
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address JSONB,
  contact text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- projects: project metadata
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  name text NOT NULL,
  status text DEFAULT 'draft',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- project_memories: calculation memory instances
CREATE TABLE IF NOT EXISTS public.project_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  title text,
  type text,
  version text,
  status text DEFAULT 'open',
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- memory_assignments: junction table linking profiles to memories
CREATE TABLE IF NOT EXISTS public.memory_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid REFERENCES public.project_memories(id),
  profile_id uuid REFERENCES public.profiles(id),
  assigned_at timestamptz DEFAULT now()
);

-- audit_logs: event tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor uuid REFERENCES public.profiles(id),
  action text,
  details JSONB,
  created_at timestamptz DEFAULT now()
);

Indexes
-------
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_memories_project_id ON public.project_memories(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_profile_id ON public.memory_assignments(profile_id);

Row Level Security (RLS) policies - intent & examples
----------------------------------------------------
-- Enable RLS on core tables and implement policies that allow:
--  * Admin users (profiles.role = 'admin') full access
--  * Employees to access only resources assigned to them

-- profiles: users can manage their own profile
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS profiles_is_owner ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- projects: admins can read all; employees can read projects that have assigned memories
ALTER TABLE IF EXISTS public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS projects_admin_read ON public.projects
  FOR SELECT USING (
    exists (select 1 from public.profiles p where p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY IF NOT EXISTS projects_employee_read ON public.projects
  FOR SELECT USING (
    exists (
      select 1 from public.memory_assignments ma
      join public.project_memories pm on pm.id = ma.memory_id
      where ma.profile_id = auth.uid() and pm.project_id = public.projects.id
    )
  );

-- project_memories: admins full access; assigned employees read/update their memories
ALTER TABLE IF EXISTS public.project_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS memories_admin_full ON public.project_memories
  FOR ALL USING (
    exists (select 1 from public.profiles p where p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY IF NOT EXISTS memories_assigned ON public.project_memories
  FOR SELECT, UPDATE USING (
    exists (
      select 1 from public.memory_assignments ma where ma.profile_id = auth.uid() and ma.memory_id = public.project_memories.id
    )
  );

-- memory_assignments: only admins manage assignments
ALTER TABLE IF EXISTS public.memory_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS assignments_admin_manage ON public.memory_assignments
  FOR ALL USING (
    exists (select 1 from public.profiles p where p.id = auth.uid() AND p.role = 'admin')
  );

-- audit_logs: only admins can read
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS audit_logs_admin_read ON public.audit_logs
  FOR SELECT USING (
    exists (select 1 from public.profiles p where p.id = auth.uid() AND p.role = 'admin')
  );

Example seed data (for dev environment)
---------------------------------------
-- NOTE: Use the service role key or migration tool to seed these values.
INSERT INTO public.profiles (id, full_name, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Director One', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Employee One', 'employee')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.clients (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Energy')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (id, client_id, name, created_by) VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Main Substation Upgrade', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_memories (id, project_id, title, type, created_by) VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Initial Load Study', 'circuit', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.memory_assignments (id, memory_id, profile_id) VALUES
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.audit_logs (id, actor, action, details) VALUES
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'seed:initial', '{"note":"seeded initial data"}')
ON CONFLICT (id) DO NOTHING;

Migration & operational notes
----------------------------
- Use Supabase CLI or migration tooling to create repeatable migrations (`supabase migration create`).
- Run seeds with the service role key in CI or locally via migration scripts; never expose this key in client code.
- When modifying RLS policies, test access with multiple test users (admin vs employee) to validate expected behavior.

End of Backend Reference
- This is intentional - memories don't exist without projects

**Trigger:** Auto-update `updated_at`
```sql
CREATE TRIGGER update_project_memories_updated_at
  BEFORE UPDATE ON project_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

### Table: `memory_assignments`

**Purpose:** Junction table linking employees to calculation memories

**Schema:**
```sql
CREATE TABLE memory_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES project_memories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  UNIQUE(memory_id, user_id)  -- One user can be assigned once per memory
);

-- Indexes
CREATE INDEX idx_memory_assignments_memory_id ON memory_assignments(memory_id);
CREATE INDEX idx_memory_assignments_user_id ON memory_assignments(user_id);
```

**Columns:**
- `id`: UUID, auto-generated
- `memory_id`: FK to project_memories (CASCADE deletes assignments when memory deleted)
- `user_id`: FK to profiles (CASCADE deletes assignments when user deleted)
- `assigned_at`: When assignment was made
- `assigned_by`: Profile ID of admin/director who made assignment

**UNIQUE Constraint:**
- Prevents duplicate assignments of same user to same memory
- If reassignment needed, delete old assignment first

**Why CASCADE on both FKs:**
- Memory deleted → assignments automatically removed (no orphans)
- User deleted → their assignments removed (clean up)

---

### Table: `audit_logs`

**Purpose:** Track major events for compliance and debugging

**Schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changes JSONB
);

-- Indexes
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
```

**Columns:**
- `id`: UUID, auto-generated
- `table_name`: Which table was affected ('projects', 'project_memories', etc.)
- `record_id`: ID of the affected row
- `action`: 'INSERT', 'UPDATE', or 'DELETE'
- `user_id`: Profile ID of user who performed action (NULL if system action)
- `timestamp`: When action occurred
- `changes`: JSONB storing before/after values

**JSONB Changes Structure:**
```json
{
  "before": {"name": "Old Project Name", "status": "active"},
  "after": {"name": "New Project Name", "status": "active"}
}
```

**What to Log (Phase 1):**
- Project creation/deletion
- Memory creation/deletion/assignment
- Status changes on projects/memories

**What NOT to Log:**
- Profile updates (too noisy)
- Authentication events (handled by Supabase)
- Read operations

---

## 🔐 Row Level Security (RLS) Policies

### Enable RLS on All Tables
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

---

### Policies: `profiles`

**Goal:** Users can read all profiles, update only their own

**Read (SELECT):**
```sql
CREATE POLICY "Anyone authenticated can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
```

**Update:**
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Insert/Delete:**
- Handled by Supabase Auth triggers (not through app)
- No policies needed (implicit deny)

---

### Policies: `clients`

**Goal:** Admin/Director full access, Employee read-only

**Read (SELECT):**
```sql
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);
```

**Insert:**
```sql
CREATE POLICY "Admin and Director can create clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

**Update:**
```sql
CREATE POLICY "Admin and Director can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

**Delete:**
```sql
CREATE POLICY "Admin and Director can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

---

### Policies: `projects`

**Goal:** Admin/Director full access, Employee see only projects with assigned memories

**Read (SELECT):**
```sql
CREATE POLICY "Admin and Director can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Employees can view projects with assigned memories"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'employee'
    )
    AND EXISTS (
      SELECT 1 FROM project_memories pm
      JOIN memory_assignments ma ON ma.memory_id = pm.id
      WHERE pm.project_id = projects.id
      AND ma.user_id = auth.uid()
    )
  );
```

**Insert:**
```sql
CREATE POLICY "Admin and Director can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

**Update:**
```sql
CREATE POLICY "Admin and Director can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

**Delete:**
```sql
CREATE POLICY "Admin and Director can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

---

### Policies: `project_memories`

**Goal:** Admin/Director full access, Employee CRUD only on assigned memories

**Read (SELECT):**
```sql
CREATE POLICY "Admin and Director can view all memories"
  ON project_memories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Employees can view assigned memories"
  ON project_memories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'employee'
    )
    AND EXISTS (
      SELECT 1 FROM memory_assignments
      WHERE memory_id = project_memories.id
      AND user_id = auth.uid()
    )
  );
```

**Insert:**
```sql
CREATE POLICY "Admin and Director can create memories"
  ON project_memories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

**Update:**
```sql
CREATE POLICY "Admin and Director can update any memory"
  ON project_memories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );

CREATE POLICY "Employees can update assigned memories"
  ON project_memories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'employee'
    )
    AND EXISTS (
      SELECT 1 FROM memory_assignments
      WHERE memory_id = project_memories.id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'employee'
    )
    AND EXISTS (
      SELECT 1 FROM memory_assignments
      WHERE memory_id = project_memories.id
      AND user_id = auth.uid()
    )
  );
```

**Delete:**
```sql
CREATE POLICY "Admin and Director can delete memories"
  ON project_memories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );

-- Employees cannot delete memories (even assigned ones)
```

---

### Policies: `memory_assignments`

**Goal:** Admin/Director full access, Employee read-only

**Read (SELECT):**
```sql
CREATE POLICY "Anyone authenticated can view assignments"
  ON memory_assignments FOR SELECT
  TO authenticated
  USING (true);
```

**Insert/Update/Delete:**
```sql
CREATE POLICY "Admin and Director can manage assignments"
  ON memory_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'director')
    )
  );
```

---

### Policies: `audit_logs`

**Goal:** Everyone can read, only system can write

**Read (SELECT):**
```sql
CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);
```

**Insert:**
```sql
-- Handled by triggers/functions, not direct inserts
-- No policy = implicit deny for users
-- Service role can insert (bypasses RLS)
```

---

## 🔧 Database Functions

### Function: `log_audit`

**Purpose:** Helper function to insert audit log entries

```sql
CREATE OR REPLACE FUNCTION log_audit(
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_changes JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, user_id, changes)
  VALUES (p_table_name, p_record_id, p_action, auth.uid(), p_changes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage Example:**
```sql
SELECT log_audit(
  'projects',
  '123e4567-e89b-12d3-a456-426614174000',
  'UPDATE',
  '{"before": {"name": "Old"}, "after": {"name": "New"}}'::jsonb
);
```

---

### Function: `get_user_role`

**Purpose:** Quick helper to get current user's role

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📦 Migration Strategy

### Migration Files Location
```
supabase/migrations/
├── 00000000000000_initial_schema.sql
├── 00000000000001_rls_policies.sql
├── 00000000000002_functions_triggers.sql
└── 00000000000003_seed_data.sql
```

### Migration Naming Convention
- Format: `<timestamp>_<description>.sql`
- Timestamp: `YYYYMMDDHHMMSS`
- Description: Lowercase with underscores

### Running Migrations
```bash
# Via Supabase CLI
supabase db reset          # Reset and run all migrations
supabase db push          # Push local changes to remote
```

### Rollback Strategy
- Each migration should have a corresponding down migration
- Store in `supabase/migrations/rollback/` if needed

---

## 🌱 Seed Data

**Location:** `supabase/seed.sql`

**Contents:**
```sql
-- Insert initial admin user (after signup via Supabase Auth)
-- Assumes auth.users already has entry with specific UUID
INSERT INTO profiles (id, role, full_name, email)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'System Admin', 'admin@mecalapp.com');

-- Insert sample client
INSERT INTO clients (id, name, contact_info, created_by)
VALUES 
  (
    '10000000-0000-0000-0000-000000000001',
    'Sample Client Corp',
    '{"email": "contact@sampleclient.com", "phone": "+1-555-0100"}'::jsonb,
    '00000000-0000-0000-0000-000000000001'
  );

-- Insert sample project
INSERT INTO projects (id, name, client_id, status, created_by)
VALUES 
  (
    '20000000-0000-0000-0000-000000000001',
    'Sample Project',
    '10000000-0000-0000-0000-000000000001',
    'active',
    '00000000-0000-0000-0000-000000000001'
  );
```

**When to Run:**
- Local development setup
- Testing environments
- NOT in production (real data only)

---

## 📊 Indexes & Performance

### Existing Indexes (from schema above)
- All foreign keys have indexes
- `profiles.role` indexed for role-based queries
- `audit_logs.timestamp` DESC for recent logs first
- `projects.status` for filtering by status

### Query Optimization Notes
- **Employee Dashboard:** Most complex query (joins 3 tables)
  - Already optimized with indexes on FKs
  - May need materialized view if > 10k projects
  
- **Audit Logs:** 
  - Partition by month if > 1M rows expected
  - Archive old logs after 2 years

---

## 🔄 Cross-Reference Index

- Frontend component types → `frontend_ref.md#TypeScript-Interfaces`
- API call patterns using these tables → `system_sync_ref.md`
- Role permission rules (conceptual) → `complete_ref.md#Role-Hierarchy`
- Project roadmap → `roadmap.md`

---

**End of Backend Reference**
