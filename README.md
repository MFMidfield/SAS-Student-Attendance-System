# 🌙 Lunar Project - Attendance Management System

A premium, neubrutalist-inspired attendance management system built with **HTML, CSS (Vanilla), JavaScript**, and **Supabase**. This project provides a robust workflow for tracking and verifying student attendance with distinct roles and administrative controls.

---

## ✨ Features

### 👨‍🎓 Student Portal
- **Dynamic Dashboard**: Live greeting, attendance statistics, and today's schedule at a glance.
- **Attendance Logging**: Easy-to-use interface for submitting attendance with subject selection, status (Present, Sick, Personal, Activity), and notes.
- **Schedule View**: Personal class schedule filtered by the student's assigned class ID.
- **Profile Settings**: Manage profile details and view account information.

### 👩‍🏫 Admin/Teacher Portal
- **Advanced Dashboard**: Comprehensive navigation to all administrative modules.
- **Attendance Pending Logs**: View incoming attendance logs in real-time with search and room filtering.
- **Two-Step Verification**: 
  - **Verify All**: Batch approve all currently filtered logs with a 5-second safety countdown.
  - **Individual Verify**: Approve or Unapprove logs one-by-one with a 3-second safety countdown.
- **Verified Logs History**: Dedicated view for records that have been approved, including details on *who* verified them and *when*.
- **Schedule Management**: Create, edit, and delete class schedules for various rooms and subjects.
- **User Management**: Manage student and staff profiles, edit roles, and update student IDs or class assignments.

---

## 🎨 Design System: Neubrutalist
This project follows a **Neubrutalist** aesthetic:
- **Bold Borders**: Thick black borders (`2px` or `4px`).
- **Hard Shadows**: High-contrast, non-blurred shadows (`shadow-[4px_4px_0px_#1E1E1E]`).
- **Vibrant Colors**: A curated palette of high-saturation pastels and bold primary colors.
- **M PLUS Rounded 1c**: Modern, friendly typography from Google Fonts.
- **Micro-Animations**: Smooth transitions and hover effects using CSS Keyframes (`fadeIn`, `scaleIn`, `backdrop-blur`).

---

## 🛠️ Technology Stack
- **Frontend**: Vanilla HTML5, Vanilla CSS3 (with Tailwind CSS for utility-first styling via browser script).
- **Logic**: Modular Vanilla JavaScript (ES6+).
- **Backend**: **Supabase** (Auth, PostgREST, Row Level Security).
- **Database**: PostgreSQL with custom triggers and functions for automatic data synchronization between `auth.users` and `public.profiles`.

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser.
- A [Supabase](https://supabase.com/) project.

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lunar-pj.git
   ```
2. Configure your Supabase environment:
   Create a `src/lib/supabaseClient.js` file with your credentials:
   ```javascript
   import { createClient } from '@supabase/supabase-js'
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```
3. Run with a local development server (like Vite or Live Server):
   ```bash
   npm run dev
   ```

---

## 🛡️ Database Schema (Summary)
- `profiles`: Stores user metadata (firstname, lastname, stu_id, class_id, role).
- `attendance_logs`: Temporary storage for pending attendance submissions.
- `attendance_verify`: Permanent storage for verified attendance records.
- `schedule`: Stores class subjects, rooms, and times.

---

## 📝 Status
**Current Version**: 1.0.0 (WIP)  
Recent Updates (10/05/26):
- Finalized Admin Dashboard UI.
- Implemented Batch "Verify All" logic with safety countdown.
- Enhanced Verify Logs with verifier metadata.

---
*Developed with ❤️ as part of the Lunar Project.*