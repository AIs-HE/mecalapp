# Testing Guide — MecalApp POC

**Last Updated:** 2025-11-04

This testing guide documents manual and automated tests to validate the current POC in this repository: the Next.js frontend (POC), the example server API routes, local cache/ops queue, memory assignment behavior, and recommended DB checks. The goal is to double-proof the implementation so you can safely iterate or prepare migrations.

Contents
- Prerequisites
- How to start (dev)
- Test data and seeds
- Smoke tests (quick verification)
- API tests (endpoints & sample requests)
- UI manual tests (projects, memories, assign/unassign, delete)
- Offline / sync tests (local cache and ops queue)
- Role & RLS tests (admin vs employee expectations)
- DB integrity & migration checks (dedupe + unique index)
- Automated test recommendations
- Troubleshooting notes

---

## Prerequisites

- Node.js (>=16 recommended) installed locally
- Git checked out to branch with POC changes (e.g., `backup/remove-frontend-copy`)
- Create a `.env.local` at the repo root with these values for local dev:

  - NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
  - NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
  - SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  (server-only; do NOT commit)

- Optional but recommended: run migrations/seeds in a local/dev Supabase project with the example seeds in `core_docs/backend_ref.md` or `scripts/smoke-test.js`.

Notes: server API example routes depend on the service role key. If `SUPABASE_SERVICE_ROLE_KEY` is missing, server routes return a helpful 500 JSON telling you to set env vars.

---

## How to start (dev)

Run these in PowerShell from the repo root:

```powershell
# Install deps (if needed)
npm install

# Start dev server (Next.js)
npm run dev

# Or for a production build test
npm run build; npm run start
```

If the dev server starts on a port other than 3000, Next will show the actual URL in the console. Restart the dev server after changing `.env.local` so server-side routes pick up `SUPABASE_SERVICE_ROLE_KEY`.

---

## Test data and seeds

- Recommended seed rows (see `core_docs/backend_ref.md`) include:
  - Admin profile (role=admin)
  - Employee profile(s) (role=employee)
  - One client and one project with at least one memory row

- You can apply seed SQL in your Supabase project's SQL editor or use migration tooling. The repo contains `scripts/smoke-test.js` as a minimal flow that operates against seeded IDs — run it for a fast API smoke verification.

---

## Smoke tests (quick verification)

1. Start the dev server (see above).
2. In a separate PowerShell, run the included smoke test (it uses local APIs):

```powershell
node scripts/smoke-test.js
```

3. Expected outcome: script completes without throwing and prints success messages for project and memory creation checks. If errors mention missing env vars, confirm `.env.local` and restart dev server.

---

## API tests — endpoints, requests, expected results

Use curl/HTTPie/Postman or PowerShell Invoke-RestMethod. Below are the main example admin endpoints included for the POC. These routes use the server admin client and therefore require `SUPABASE_SERVICE_ROLE_KEY`.

1) GET /api/projects

  - Purpose: list projects (example admin endpoint)
  - Sample (PowerShell):
    ```powershell
    Invoke-RestMethod "http://localhost:3000/api/projects"
    ```
  - Expected: 200 JSON array of projects. For missing env, 500 JSON with helpful message.

2) GET /api/project_memories?project_id=<project_id>

  - Purpose: fetch memories for a project. Response normalizes DB `memory_type` to `type` for the UI.
  - Sample:
    ```powershell
    Invoke-RestMethod "http://localhost:3000/api/project_memories?project_id=22222222-2222-2222-2222-222222222222"
    ```
  - Expected: 200 JSON with array of memory objects including `id`, `memory_type` (DB column), and normalized `type` key.

3) POST /api/project_memories (create memory)

  - Body: { project_id, memory_type, version }
  - Expected: created memory row (201 or 200 depending on API); ensure `version` defaults to '1.0' if omitted in POC.

4) POST /api/memory_assignments

  - Purpose: assign a memory to a user. Current POC behavior: update-if-exists by `memory_id` (ensures at most one active assignment per memory). If duplicates exist, API will attempt to clean older rows.
  - Body: { memory_id, user_id, assigned_by }
  - Expected: 200 JSON with `assignment` object containing `id`, `memory_id`, `user_id`, `assigned_at`, and `user: { full_name }` attached.

  - Test case: assign memory X to employee A, then assign memory X to employee B. Expected DB result: only one assignment row remains for memory X with `user_id` set to B.

5) DELETE /api/memory_assignments

  - Purpose: remove an assignment.
  - Body: { id } or { memory_id, user_id }
  - Expected: 200 { ok: true }

6) GET /api/profiles

  - Purpose: list profiles used by Assign modal
  - Expected: 200 JSON array of profiles with `id`, `full_name`, and `role`.

Notes:
- All API errors return JSON with an `error` field; map messages in your tests accordingly.
- If you test endpoints that use the admin client and you don't provide `SUPABASE_SERVICE_ROLE_KEY`, expect a JSON 500 describing missing credentials.

---

## UI manual tests (step-by-step)

Run these with the dev server active and the seeded users available.

1) Projects list & Add project
- Open the dashboard.
- Verify the Projects grid shows existing projects and the Add card at the end.
- Create a new project using the Add card → NewProjectModal. Expected: new project appears in the grid (may require manual refresh depending on POC plumbing).

2) Project memories gallery
- Click a ProjectCard to open its memories view (POC `pages/dashboard.js` contains a ProjectMemoriesView).
- Verify memory cards render with canonical full name (mapped from `data/memory_types.json`). Example: memory with type `CIRCUIT` should show `CIRCUIT DIMENSION` as the title.

3) Assign memory (Admin flow)
- On a memory card, open the three-dots menu and choose Assign memory.
- Choose an employee from the modal and click Assign.
- Expected: MemoryCard assigned badge updates to show the employee full name. Backend: only one assignment row for that memory exists.

4) Reassign memory (Admin flow)
- Assign the same memory to a different employee.
- Expected: MemoryCard shows the new employee name and the DB has one row for that memory (see API test above).

5) Unassign memory (if implemented)
- If you add the Unassign action, open menu → Unassign.
- Expected: assigned badge shows 'Not assigned yet' and DELETE request returns ok.

6) Delete memory
- Use Delete memory from the menu; confirm.
- Expected: memory removed from UI and DB; related assignments cascaded if DB has ON DELETE CASCADE.

7) Version & status defaults
- Create a memory without specifying `version` or `status`; verify API/backend sets `version` to `'1.0'` (POC default) and `status` to `'draft'` as implemented in server examples.

8) Visual checks
- Memory card styling parity with ProjectCard: check typography, left accent, and footer metadata blocks.

---

## Offline and sync tests (local cache & ops queue)

The POC includes `lib/cache.js` which enqueues create/delete ops in localStorage and runs a background `syncQueue()` to push to server endpoints.

Test plan:

1) Toggle create/delete operations in the NewProjectModal and close the modal without network.
   - Simulate offline: in the browser devtools, throttle network to offline.
   - Perform toggle operations (create memory toggles) — they should be saved in localStorage ops queue.
   - Re-enable network and wait for the background sync (or manually call `syncQueue()` from console if available).
   - Expected: ops are posted to `/api/project_memories` and local queue clears; UI updates to reflect created/deleted memories.

2) Forced failure handling
   - Simulate server 500 during sync; ensure ops remain queued and retries occur (or fail gracefully).

3) Persistence across reloads
   - Stage ops, reload the page, ensure ops persist and resume syncing after reload.

---

## Role & RLS tests (admin vs employee)

These tests verify RLS intent described in `core_docs/backend_ref.md`. In the POC, server example routes bypass RLS (admin client); real RLS checks must be validated in Supabase with RLS enabled.

1) Admin user
  - Login as admin (seeded admin profile)
  - Expected: admin sees all projects and the three-dots menu on cards. Can create/delete/assign memories via the POC.

2) Employee user
  - Login as employee
  - Expected: employee sees only projects that have at least one memory assigned to them (server-side filtering/RLS). They should not see admin menu actions.

3) Test RLS via Supabase SQL (recommended)
  - Use two test profiles and the Supabase SQL editor to run SELECT queries simulating `auth.uid()` to validate policies.

---

## DB integrity & migration checks

1) Dedupe `memory_assignments`
  - If historical duplicate rows exist for the same `memory_id`, run dedupe SQL (example below) to keep the most recent and remove older rows.

  ```sql
  -- Keep most recent per memory_id and delete older ones
  delete from memory_assignments
  where id in (
    select id from (
      select id,
             row_number() over (partition by memory_id order by assigned_at desc NULLS LAST, id desc) as rn
      from memory_assignments
    ) t
    where t.rn > 1
  );
  ```

2) Add UNIQUE index on memory_id
  - After deduplication, add a DB-level uniqueness constraint to prevent duplicates:

  ```sql
  create unique index if not exists ux_memory_assignments_memory_id on memory_assignments (memory_id);
  ```

3) Test cascade behavior
  - Delete a memory and ensure related `memory_assignments` are removed if FK uses `ON DELETE CASCADE`.

---

## Automated test recommendations

- E2E: Use Playwright or Cypress to script the UI flows:
  - Login as admin, create project, create memory, assign memory, reassign memory, delete memory.
  - Login as employee and verify project/memory visibility.

- API tests: Use a test script (node + supertest or jest + axios) to run API flows. Assert response shapes and DB state via direct DB queries when possible.

- Unit tests: Add jest unit tests for small utilities (e.g., normalization logic) and for `lib/cache.js` behavior using jsdom/localStorage mocks.

- CI: Run a small suite of API + smoke tests in CI using a temporary Supabase test project (or a local Postgres instance seeded with the canonical SQL). Store `SUPABASE_SERVICE_ROLE_KEY` in CI secrets.

- Quick Playwright example (conceptual):

```js
// playwright example pseudocode
test('assign memory flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.loginAsAdmin();
  await page.click('text=Projects');
  await page.click('role=button[name="Project: Main Substation Upgrade"]');
  // assign modal flow
  await page.click('text=⋯');
  await page.click('text=Assign memory');
  await page.selectOption('select', '00000000-0000-0000-0000-000000000002');
  await page.click('text=Assign');
  await expect(page.locator('.memory-card')).toContainText('Employee One');
});
```

---

## Troubleshooting notes & common errors

- 500 JSON from server routes complaining about missing `SUPABASE_SERVICE_ROLE_KEY`: add key to `.env.local` and restart dev server.
- Stale Next runtime error `MODULE_NOT_FOUND './chunks/undefined'`: remove `.next` and restart dev server.
- PostgREST ambiguous embed error when joining `profiles` via `memory_assignments`: resolved in example API by fetching profiles separately and attaching `user` objects explicitly (avoid ambiguous automatic embeds when a table references another table multiple times).

---

## Acceptance checklist (quick)

- [ ] Dev server starts without server 500s (env vars present).
- [ ] Smoke test script runs successfully.
- [ ] API: create memory, assign memory, reassign memory → DB contains one assignment per memory.
- [ ] UI: MemoryCard shows canonical full memory name from `data/memory_types.json`.
- [ ] UI: Assign modal lists profiles and assigned badge updates immediately.
- [ ] Local sync: staged ops persist across reload and sync when network returns.
- [ ] DB: duplicates deduped and `UNIQUE(memory_id)` added (optional migration).

---

If you want, I can:

- Add a Playwright test scaffold and one canonical E2E test file.
- Add a `tests/` folder with a small Node-based API test harness using `supertest`.
- Create the migration SQL file and a runnable script to dedupe + create the unique index.

Which of these would you like me to implement next?
