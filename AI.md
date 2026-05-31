# AI Instructions & Project Overview (คำแนะนำสำหรับ AI)

Please read and understand this document before making any changes or performing any tasks in this repository.

---

## 🚫 CRITICAL RULE: READ-ONLY SUPABASE DIRECTORY (ข้อห้ามสำคัญ)

> [!IMPORTANT]
> **DO NOT modify, delete, or create any files in the `/supabase` directory.**
> - The `/supabase` folder (including `supabase/migrations/` and `supabase/config.toml`) is strictly **READ-ONLY** for AI agents.
> - You may read the contents of `/supabase` to understand the database schema and configurations, but you must **never** perform write operations on it.
> - Any schema changes or database migrations must be performed through the Supabase Dashboard directly or discussed with the developer.
> 
> **ห้ามแก้ไข ลบ หรือสร้างไฟล์ใดๆ ในโฟลเดอร์ `/supabase` โดยเด็ดขาด** (ให้อ่านเพื่อทำความเข้าใจ schema ได้อย่างเดียวเท่านั้น)

---

## 🌙 Project Overview (ภาพรวมโปรเจกต์)

**Lunar Project - Student Attendance System (SAS)** is a web-based student attendance management system. It is designed using a **Neubrutalist** aesthetic (vibrant colors, thick black borders, hard shadows, and flat typography) and runs as a Single Page Application (SPA).

### Tech Stack
- **Frontend**: Vanilla HTML5, Vanilla JavaScript (ES6+), Vanilla CSS + Tailwind CSS v4.
- **Build Tool**: Vite.
- **Backend & Database**: Supabase (Authentication, PostgreSQL Database, and Storage buckets).

---

## 🏗️ Architecture & Routing (สถาปัตยกรรมระบบและการกำหนดเส้นทาง)

The application is built as a **Single Page Application (SPA)** with hash-based routing controlled in `src/main.js`.

1. **Route Mapping**: The `ROUTES` constant in `src/main.js` defines which hash matches which HTML template and JavaScript initialization function.
2. **HTML Templates**: Imported as raw string literals using Vite's `?raw` import syntax (e.g., `import SharedSettingPage from './pages/shared/setting/setting.html?raw'`).
3. **Role Gating**: Access control is defined in `ROUTES` using the `allowedRoles` array. The router checks the user's role (stored in Supabase `profiles`) on every route change and redirects unauthorized users.
4. **Initialization Pattern**: Each route has an `init` function (e.g., `initSetting(role, avatar)`) that sets up event listeners, fetches page-specific data, and binds UI interactions dynamically.

---

## 📂 Directory Structure (โครงสร้างโฟลเดอร์)

- **`src/auth/`**: Registration and login pages (gated appropriately).
  - `#login` & `#register`: Student registration and login.
  - `#admin-register`: Admin-only portal to register staff/teachers.
- **`src/lib/`**: Unified helper scripts and configurations.
  - `supabaseClient.js`: Initialized Supabase client.
  - `ui.js`: Universal helper functions (such as `showToast()` and `escapeHTML()`).
- **`src/pages/`**: Role dashboards and shared views.
  - **Role Dashboards**: Role-specific dashboards (e.g., `admin/dashboard`, `teacher/dashboard`, `leader/dashboard`, `student/dashboard`).
  - **`shared/`**: Consolidates repetitive role-based pages into single reusable views:
    - `activity`: Logging and history of classes/activities.
    - `approve`: Attendance verification and approval (supports individual actions & batch "Verify All" with safety countdowns).
    - `attendance`: Student attendance submission.
    - `schedule`: Personal or class schedule view (Teacher/Leader = read-only; Admin = read-write).
    - `setting`: Avatar uploads (integrated with Supabase Storage `avatars` bucket and `user_assets` table), crop features, and profile updates.
    - `user`: User management console.
  - **`error/`**: 404 and connection/network error handling templates.
  - **`parent_check/`**: Attendance review screen for guardians (read-only).

---

## 🗄️ Database Schema Summary (สรุปตารางฐานข้อมูล)

The database schema resides in Supabase. Key tables are:

- **`profiles`**: Stores user account details linked to Supabase Auth (`id` references `auth.users.id`).
  - Fields: `id`, `firstname`, `lastname`, `role` (`student`, `teacher`, `leader`, `admin`), `stu_id` (Student ID), `class_id` (Class Room ID), `roll_number` (เลขที่).
- **`attendance_logs`**: The central unified table containing student attendance records.
  - Fields: `id`, `student_id`, `subject_id`, `status` (`Present`, `Sick`, `Personal`, `Activity`), `notes` (reason for leave/absence), `period` (`Full Day`, `Morning`, `Afternoon`), `verification_status` (`pending`, `approved`, `rejected`), `verifier_id`, `verified_at`, `reject_reason`.
- **`schedule`**: Class schedules.
  - Fields: `id`, `subject`, `room`, `day`, `start_time`, `end_time`, `class_id`.
- **`user_assets`**: Links user profile pictures or attachments.
  - Fields: `id`, `user_id`, `asset_type` (e.g., `'avatar'`), `url`.

---

## 💡 Developer Guidelines & Patterns (แนวทางการพัฒนา)

When writing code or styling elements, keep the following guidelines in mind:

1. **Neubrutalist UI**: Maintain the design language.
   - Use thick black borders (`border-[2px] border-black` or `border-[4px] border-black`).
   - Use hard flat shadows (`shadow-[4px_4px_0px_#1E1E1E]`).
   - Use vibrant pastels and solid contrast backgrounds.
2. **Security & XSS Prevention**: Always sanitize user-generated inputs using `escapeHTML()` before rendering them inside `innerHTML`.
3. **Supabase RLS & JWT**: Rely on row-level security (RLS) policies configured in Supabase. Let Supabase filter secure scopes where possible rather than relying solely on client-side constraints.
4. **Vite Development Commands**:
   - Install dependencies: `npm install`
   - Start development server: `npm run dev`
   - Build production app: `npm run build`
   - Preview production build: `npm run preview`
