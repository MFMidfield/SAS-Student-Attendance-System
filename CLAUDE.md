# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lunar** is a neubrutalist-designed attendance management system with role-based access control. Four user roles navigate distinct workflows: **students** log attendance, **teachers** and **leaders** verify logs, and **admins** manage users, schedules, and system configuration.

Built with vanilla JavaScript, HTML5, CSS3 (Tailwind), and Supabase (PostgreSQL + Auth).

## Common Commands

```bash
# Install dependencies
npm install

# Start development server (Vite) - usually available at http://localhost:5173
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Architecture: Hash-Based Routing with Role Gating

The entire app is a **single-page application (SPA)** with hash-based routing. The routing system lives in `src/main.js` and follows this pattern:

1. **Route Definition**: `ROUTES` object maps hash URLs (e.g., `#admin-dashboard`) to template, init function, and allowed roles.
2. **Auth Guard**: On every route change, `render()` checks session, verifies profile existence, and validates user role.
3. **Redirect Logic**: Users are redirected to their role's default page if they land on an unauthorized route or try to access login/register while logged in.
4. **Page Initialization**: Each route's `init()` function is called with the user's avatar URL and default image, setting up event listeners, fetching data, and rendering dynamic content.

### Key Files in Routing
- `src/main.js`: Router, auth guard, session management
- `src/lib/supabaseClient.js`: Supabase client initialization (reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`)
- `src/lib/ui.js`: Shared utilities like `showToast()` (success/error notifications) and `escapeHTML()` (XSS prevention)

## Directory Structure by Role

```
src/
├── pages/
│   ├── student/           # Attendance logging, personal schedule, dashboard
│   │   ├── attendance/    # Log attendance with subject/status selection
│   │   ├── dashboard/     # Overview, stats, upcoming classes
│   │   ├── schedule/      # Personal class schedule
│   │   └── setting/       # Profile management
│   ├── teacher/           # Verify logs, manage users/schedule for their class
│   │   ├── attendance_approve/
│   │   ├── activity/
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── setting/
│   │   └── user/
│   ├── admin/             # Full system control
│   │   ├── attendance_approve/
│   │   ├── activity/
│   │   ├── admin_logs/    # System event logging
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── setting/
│   │   └── user/          # Edit student/staff profiles
│   ├── leader/            # School-level oversight (above teacher, below admin)
│   │   ├── attendance/
│   │   ├── attendance_approve/
│   │   ├── activity/
│   │   ├── dashboard/
│   │   ├── schedule/
│   │   ├── setting/
│   │   └── user/
│   ├── parent_check/      # View student attendance (read-only for guardians)
│   └── error/             # 404, network error pages
├── auth/
│   ├── login/             # Login page
│   └── register/          # Registration page
├── lib/
│   ├── supabaseClient.js  # Supabase initialization
│   ├── ui.js              # Toast notifications, HTML escaping
│   ├── export.js          # Export attendance logs
│   └── import.js          # Import user/schedule data
├── main.js                # Router, auth guard, session handler
├── main.html              # Landing page
└── style.css              # Global styles (Tailwind directives, custom neubrutalist styles)
```

## Adding a New Page

1. Create the feature folder: `src/pages/{role}/{feature}/`
2. Create three files:
   - `.html` (template, can use Tailwind classes)
   - `.js` (export `initFeature(avatar, defaultImage)` function)
3. In `src/main.js`, import the template and init function
4. Add route to `ROUTES` object with appropriate `auth` and `allowedRoles`

Example:
```javascript
import MyFeatureTemplate from './pages/admin/myfeature/myfeature.html?raw'
import { initMyFeature } from './pages/admin/myfeature/myfeature.js'

const ROUTES = {
  '#admin-myfeature': { 
    template: MyFeatureTemplate, 
    init: (avatar) => initMyFeature(avatar), 
    auth: true, 
    allowedRoles: ['admin'] 
  },
  // ... rest
}
```

## Database Schema (Supabase)

Key tables (set up via `SUPABASE_SETUP.sql`):

- **profiles**: User metadata (firstname, lastname, stu_id, class_id, role, avatar_url)
- **attendance_logs**: Pending submissions (student_id, subject_id, status, notes, created_at, verification_status)
- **schedule**: Class schedule (room, subject, day, start_time, end_time, class_id)
- **user_assets**: User avatars and profile images (user_id, asset_type, url)

Custom triggers sync `auth.users` data with `profiles` table on registration. Row-level security (RLS) policies restrict student access to own data; teachers/admins see class/system-wide records.

### Attendance Verification Workflow

1. Student submits attendance → `attendance_logs` with `verification_status = 'pending'`
2. Teacher/Admin views in "Approve" page, can individually approve or reject with reason
3. Approved logs → `verification_status = 'approved'` with verifier metadata added
4. "Verify All" batch-approves filtered logs with a 5-second safety countdown

## Common Supabase Patterns

```javascript
// Check session
const { data: { session } } = await supabase.auth.getSession();

// Fetch user profile
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

// Fetch with count
const { count } = await supabase
  .from('table')
  .select('*', { count: 'exact', head: true });

// Show success/error notification
import { showToast } from '../lib/ui.js'
showToast('Data saved!', 'success');
showToast('Failed to save', 'error');
```

## Environment Setup

Create `.env` in the root with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase Dashboard under Project Settings > API.

## Design System: Neubrutalism

The app uses bold borders, hard shadows, vibrant saturated colors, and M PLUS Rounded 1c typography. All utility classes come from Tailwind CSS v4, configured via `tailwindcss/@tailwindcss/vite` plugin.

Custom keyframes for micro-animations (fadeIn, scaleIn, backdrop-blur) are in `src/style.css`. Standard classes:
- **Borders**: `border-[2px]` or `border-[4px]` in black
- **Shadows**: `shadow-[4px_4px_0px_#1E1E1E]` (hard shadows, no blur)
- **Colors**: High-saturation pastels and bold primaries (defined in Tailwind config)

## Deployment

1. Build: `npm run build` → outputs to `dist/`
2. Deploy `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.)
3. Ensure `.env` variables are set in your production environment

## Notes for Future Development

- **Modular Init Pattern**: Each page's `init()` function is responsible for all setup (fetching data, binding events). No global state manager is used; data fetching happens per-page.
- **No Build Step for Templates**: HTML templates are imported as raw strings and injected into the DOM via `innerHTML`.
- **Role-Based Filtering**: All queries to Supabase are filtered by user role and class_id (where applicable) to ensure data isolation.
- **Avatar Management**: User avatars live in `user_assets` table. Fetch by `user_id` and `asset_type = 'avatar'`.
- **Attendance Status Options**: `Present`, `Sick`, `Personal`, `Activity` (defined in student attendance page)
- **Verification States**: `pending`, `approved`, `rejected` (in `attendance_logs.verification_status`)
