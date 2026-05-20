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
- [Node.js](https://nodejs.org/) (Recommended: LTS version)
- A [Supabase](https://supabase.com/) account.
- A modern web browser.

### 1. Database Setup (Supabase)
Before running the application, you must set up your Supabase database:
1. Create a new project in your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Open the [SUPABASE_SETUP.sql](file:///c:/Users/MFMid/Dokumente/mytask/Code/lunar-pj/SUPABASE_SETUP.sql) file from this repository.
4. Copy the entire content of the script and paste it into the Supabase SQL Editor.
5. Click **Run** to create the tables, triggers, and RLS policies.
6. (Optional) In the **Authentication > Providers** section, ensure "Email" is enabled.

### 2. Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lunar-pj.git
   cd lunar-pj
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
   ```
   *You can find these in your Supabase Dashboard under Project Settings > API.*

### 3. Running Locally
Start the development server using Vite:
```bash
npm run dev
```
The application will usually be available at `http://localhost:5173`.

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