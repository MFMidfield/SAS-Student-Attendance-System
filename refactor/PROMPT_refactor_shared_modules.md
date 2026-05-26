# AI Prompt: Refactor Duplicate Pages into Shared Modules

## Context

This is a **Lunar** attendance management SPA (Single-Page Application) built with vanilla JavaScript, HTML5, Tailwind CSS v4, and Supabase. The app has 4 roles: `admin`, `teacher`, `leader`, `student`.

The routing system is in `src/main.js`. Each route maps a hash URL to an HTML template (imported as `?raw` string) and an `init()` function:

```javascript
'#admin-activity': { template: AdminActivity, init: (avatar) => initActivity('admin', avatar), auth: true, allowedRoles: ['admin'] },
```

## Completed Reference: Activity Page

The Activity page has already been refactored as a shared module. Study these files to understand the expected output pattern **before writing any code**:

- `activity_refactoring.md` — full step-by-step plan with final HTML + JS code
- `src/pages/shared/activity/activity.html` — the resulting shared HTML template
- `src/pages/shared/activity/activity.js` — the resulting shared JS module
- `src/main.js` — see how the shared module is registered under multiple role routes

Key patterns from the Activity refactor:
1. Single `initActivity(role, avatar)` function exported from the shared JS file
2. `const hasWriteAccess = (role === 'admin' || role === 'teacher')` gates UI and event listeners
3. Event listeners for write operations are only attached inside `if (hasWriteAccess) { ... }`
4. Back button uses `window.location.hash = '#' + role + '-dashboard'`
5. Portal title label is set dynamically based on `role`
6. Old per-role files are deleted; `src/main.js` imports and uses the shared module for all roles

## Your Task

Refactor the following 5 groups of duplicate pages into shared modules, one group at a time. For each group:

1. Read ALL existing per-role files listed below (HTML + JS for each role)
2. Identify what is identical vs. what differs by role
3. Create `src/pages/shared/{feature}/` with a single `.html` and `.js`
4. Update `src/main.js` (remove old imports, add shared import, update route entries)
5. Delete the old per-role files and folders

---

## Group 1: Setting Page

**Existing files to read first:**
- `src/pages/admin/setting/`
- `src/pages/teacher/setting/`
- `src/pages/leader/setting/`
- `src/pages/student/setting/`

**Roles involved:** `admin`, `teacher`, `leader`, `student`

**What's shared:** Avatar upload, view personal info, change password, logout button.

**What differs:** Back button destination (`#${role}-dashboard`). No role-gated write permissions needed — all roles have the same capabilities on their own profile.

**Shared module target:**
- `src/pages/shared/setting/setting.html`
- `src/pages/shared/setting/setting.js` — export `initSetting(role, avatar, defaultImage)`

**Route keys to update in `src/main.js`:**
```
#admin-setting, #teacher-setting, #leader-setting, #student-setting
```

---

## Group 2: Schedule Page

**Existing files to read first:**
- `src/pages/admin/schedule/`
- `src/pages/teacher/schedule/`
- `src/pages/leader/schedule/`
- `src/pages/student/schedule/`

**Roles involved:** `admin`, `teacher`, `leader`, `student`

**What's shared:** Calendar/table UI displaying class schedule data.

**What differs by role:**
- `admin` and `teacher` can add/edit/delete schedule entries → `hasEditAccess = (role === 'admin' || role === 'teacher')`
- `leader` and `student` are read-only
- Supabase query scope: student fetches their own `class_id`, teacher fetches classes they teach

**Shared module target:**
- `src/pages/shared/schedule/schedule.html`
- `src/pages/shared/schedule/schedule.js` — export `initSchedule(role, avatar, defaultImage)`

**Route keys to update in `src/main.js`:**
```
#admin-schedule, #teacher-schedule, #leader-schedule, #student-schedule
```

---

## Group 3: User Management Page

**Existing files to read first:**
- `src/pages/admin/user/`
- `src/pages/teacher/user/`
- `src/pages/leader/user/`

**Roles involved:** `admin`, `teacher`, `leader`

**What's shared:** User list table with search/filter UI.

**What differs by role:**
- `admin`: Full CRUD on all users → `hasFullAccess = (role === 'admin')`
- `teacher`: Can view students in their class; limited edit (e.g. contact info) → `hasLimitedEdit = (role === 'teacher')`
- `leader`: Read-only, only sees classmates → no write access

Permission logic: `const hasWriteAccess = (role === 'admin' || role === 'teacher')`

Event listeners for Add/Edit/Delete buttons must only be attached when `hasWriteAccess` is true (same pattern as Activity).

Supabase query scope: admin sees all profiles; teacher/leader filter by `class_id`.

**Shared module target:**
- `src/pages/shared/user/user_management.html`
- `src/pages/shared/user/user_management.js` — export `initUserManagement(role, avatar, defaultImage)`

**Route keys to update in `src/main.js`:**
```
#admin-user, #teacher-user, #leader-user
```

---

## Group 4: Attendance Approve Page

**Existing files to read first:**
- `src/pages/admin/attendance_approve/`
- `src/pages/teacher/attendance_approve/`
- `src/pages/leader/attendance_approve/`

**Roles involved:** `admin`, `teacher`, `leader`

**What's shared:** Card list of pending attendance submissions with Approve / Reject buttons.

**What differs by role:**
- All 3 roles can approve/reject — no UI hiding needed for buttons
- The `verification_status` value written on approve differs per role:
  - `leader` → sets status to `'leader_approved'`
  - `teacher` → sets status to `'approved'`
  - `admin` → sets status to `'approved'` (with admin verifier metadata)
- Supabase query scope: admin sees all pending; teacher/leader filter by `class_id`

**Shared module target:**
- `src/pages/shared/attendance_approve/approve.html`
- `src/pages/shared/attendance_approve/approve.js` — export `initApprove(role, avatar, defaultImage)`

**Route keys to update in `src/main.js`:**
```
#admin-attendance-approve, #teacher-attendance-approve, #leader-attendance-approve
```

---

## Group 5: Attendance Logging Page

**Existing files to read first:**
- `src/pages/student/attendance/`
- `src/pages/leader/attendance/`

**Roles involved:** `student`, `leader`

**What's shared:** Attendance submission form — check current schedule, select status (Present/Sick/Personal/Activity), add notes, submit to `attendance_logs`.

**What differs:** Only the back button destination (`#${role}-dashboard`). The `student_id` is always the session user's own ID — no conditional logic needed for the Supabase insert.

**Shared module target:**
- `src/pages/shared/attendance/attendance.html`
- `src/pages/shared/attendance/attendance.js` — export `initAttendance(role, avatar, defaultImage)`

**Route keys to update in `src/main.js`:**
```
#student-attendance, #leader-attendance
```

---

## Security Requirements (must implement in every shared module)

**Layer 1 — Frontend:**
- Buttons that trigger write operations must only receive `addEventListener` calls inside `if (hasWriteAccess) { ... }` blocks
- A user removing `hidden` class via DevTools on a button must not trigger any action, because the listener was never attached

**Layer 2 — Supabase RLS (verify, do not create new policies — just confirm they are applied correctly):**
- `SELECT`: allow `authenticated` role
- `INSERT / UPDATE / DELETE`: restrict to profiles where `role IN ('admin', 'teacher')` using `auth.uid()` lookup in `profiles` table

---

## Code Conventions

- Import Supabase: `import { supabase } from '../../../lib/supabaseClient.js'`
- Import UI helpers: `import { showToast, escapeHTML } from '../../../lib/ui.js'`
- HTML templates use Tailwind CSS v4 (no `@tailwind` directives needed; Tailwind is loaded via Vite plugin)
- Design system: neubrutalism — `border-2 border-[#1E1E1E]`, `shadow-[4px_4px_0px_#1E1E1E]`, bg `#EEEDDE`, font `M PLUS Rounded 1c`
- Always use `escapeHTML()` when rendering user-supplied data into the DOM
- Toast notifications: `showToast('message', 'success')` or `showToast('message', 'error')`

---

## Execution Order

Work through groups **one at a time** in this order:
1. Setting (simplest — no role-gating)
2. Schedule (moderate — read/write split)
3. User Management (most complex — full CRUD with 3 tiers)
4. Attendance Approve (moderate — same UI, different status values)
5. Attendance Logging (simple — identical logic, different back nav)

After completing each group, verify `src/main.js` builds correctly (`npm run build`) before starting the next group.
