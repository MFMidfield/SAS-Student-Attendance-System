import './style.css'
import { supabase } from './lib/supabaseClient' // ไฟล์ที่คุณตั้งค่า supabase client ไว้

//import asset
import pfdefault from './assets/Default_profile.jpg'

// import template
import LandingPage from './main.html?raw'
import LoginPage from './auth/login/login.html?raw'
import RegisterPage from './auth/register/register.html?raw'
import ParentCheckPage from './pages/parent_check/parent_check.html?raw'

import Student from './pages/student/attendance/student.html?raw'
import StudentDashBoard from './pages/student/dashboard/student_dashboard.html?raw'
import StudentSchedule from './pages/student/schedule/student_schedule.html?raw'
import StudentSetting from './pages/student/setting/student_setting.html?raw'

import AdminUserEdit from './pages/admin/user/admin_userEdit.html?raw'
import AdminDashBoard from './pages/admin/dashboard/admin_dashboard.html?raw'
import AdminSetting from './pages/admin/setting/admin_setting.html?raw'
import AdminSchedule from './pages/admin/schedule/admin_schedule.html?raw'
import AdminApprove from './pages/admin/attendance_approve/admin_approve.html?raw'
import AdminActivity from './pages/admin/activity/admin_activity.html?raw'
import AdminLogs from './pages/admin/admin_logs/admin_logs.html?raw'

import teacherDashBoard from './pages/teacher/dashboard/teacher_dashboard.html?raw'
import teacherUser from './pages/teacher/user/teacher_user.html?raw'
import teacherSetting from './pages/teacher/setting/teacher_setting.html?raw'
import teacherSchedule from './pages/teacher/schedule/teacher_schedule.html?raw'

import teacherApprove from './pages/teacher/attendance_approve/teacher_approve.html?raw'
import teacherActivity from './pages/teacher/activity/teacher_activity.html?raw'

import LeaderDashBoard from './pages/leader/dashboard/leader_dashboard.html?raw'
import LeaderUser from './pages/leader/user/leader_user.html?raw'
import LeaderSetting from './pages/leader/setting/leader_setting.html?raw'
import LeaderSchedule from './pages/leader/schedule/leader_schedule.html?raw'

import LeaderApprove from './pages/leader/attendance_approve/leader_approve.html?raw'
import LeaderActivity from './pages/leader/activity/leader_activity.html?raw'
import LeaderAttendance from './pages/leader/attendance/leader_attendance.html?raw'

// import Error Pages
import NotFoundPage from './pages/error/404.html?raw'
import NetworkErrorPage from './pages/error/network_error.html?raw'


// import function
import { initRegister } from './auth/register/register.js'
import { initLogin } from './auth/login/login.js'
import { initParentCheck } from './pages/parent_check/parent_check.js'

import { initStudent } from './pages/student/attendance/student.js'
import { initStudentDashBoard } from './pages/student/dashboard/student_dashboard.js'
import { initStudentSchedule } from './pages/student/schedule/student_schedule.js'
import { initStudentSetting } from './pages/student/setting/student_setting.js'

import { initAdminSetting } from './pages/admin/setting/admin_setting.js'
import { initAdminUserEdit } from './pages/admin/user/admin_userEdit.js'
import { initAdminDashBoard } from './pages/admin/dashboard/admin_dashboard.js'
import { initAdminSchedule } from './pages/admin/schedule/admin_schedule.js'
import { initAdminApprove } from './pages/admin/attendance_approve/admin_approve.js'
import { initAdminLogs } from './pages/admin/admin_logs/admin_logs.js'
import { initAdminActivity } from './pages/admin/activity/admin_activity.js'

import { initTeacherDashBoard } from './pages/teacher/dashboard/teacher_dashboard.js'
import { initTeacherSetting } from './pages/teacher/setting/teacher_setting.js'
import { initTeacherUser } from './pages/teacher/user/teacher_user.js'
import { initTeacherSchedule } from './pages/teacher/schedule/teacher_schedule.js'
import { initTeacherApprove } from './pages/teacher/attendance_approve/teacher_approve.js'

import { initTeacherActivity } from './pages/teacher/activity/teacher_activity.js'

import { initLeaderDashBoard } from './pages/leader/dashboard/leader_dashboard.js'
import { initLeaderSetting } from './pages/leader/setting/leader_setting.js'
import { initLeaderUser } from './pages/leader/user/leader_user.js'
import { initLeaderSchedule } from './pages/leader/schedule/leader_schedule.js'
import { initLeaderApprove } from './pages/leader/attendance_approve/leader_approve.js'

import { initLeaderActivity } from './pages/leader/activity/leader_activity.js'
import { initLeaderAttendance } from './pages/leader/attendance/leader_attendance.js'

// 3. กำหนด Route Map
const ROUTES = {
    '': { template: LandingPage, init: null, auth: false },
    '#login': { template: LoginPage, init: initLogin, auth: false },
    '#register': { template: RegisterPage, init: initRegister, auth: false },
    '#parent-check': { template: ParentCheckPage, init: initParentCheck, auth: false },
    '#student': { template: Student, init: (avatar) => initStudent(avatar), auth: true, allowedRoles: ['student'] },
    '#student-dashboard': { template: StudentDashBoard, init: (avatar) => initStudentDashBoard(avatar), auth: true, allowedRoles: ['student'] },
    '#student-schedule': { template: StudentSchedule, init: (avatar) => initStudentSchedule(avatar), auth: true, allowedRoles: ['student'] },
    '#student-setting': { template: StudentSetting, init: (avatar) => initStudentSetting(avatar), auth: true, allowedRoles: ['student'] },
    '#admin-user-edit': { template: AdminUserEdit, init: (avatar, pfdefault) => initAdminUserEdit(avatar, pfdefault), auth: true, allowedRoles: ['admin'] },
    '#admin-setting': { template: AdminSetting, init: (avatar) => initAdminSetting(avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-dashboard': { template: AdminDashBoard, init: (avatar) => initAdminDashBoard(avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-schedule': { template: AdminSchedule, init: (avatar) => initAdminSchedule(avatar), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-approve': { template: AdminApprove, init: (avatar) => initAdminApprove(avatar), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-logs': { template: AdminLogs, init: (avatar) => initAdminLogs(avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-activity': { template: AdminActivity, init: (avatar) => initAdminActivity(avatar), auth: true, allowedRoles: ['admin'] },

    '#teacher-dashboard': { template: teacherDashBoard, init: (avatar) => initTeacherDashBoard(avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-user': { template: teacherUser, init: (avatar, pfdefault) => initTeacherUser(avatar, pfdefault), auth: true, allowedRoles: ['teacher'] },
    '#teacher-setting': { template: teacherSetting, init: (avatar) => initTeacherSetting(avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-schedule': { template: teacherSchedule, init: (avatar) => initTeacherSchedule(avatar), auth: true, allowedRoles: ['teacher'] },

    '#teacher-approve': { template: teacherApprove, init: (avatar) => initTeacherApprove(avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-activity': { template: teacherActivity, init: (avatar) => initTeacherActivity(avatar), auth: true, allowedRoles: ['teacher'] },

    '#leader-dashboard': { template: LeaderDashBoard, init: (avatar) => initLeaderDashBoard(avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-user': { template: LeaderUser, init: (avatar, pfdefault) => initLeaderUser(avatar, pfdefault), auth: true, allowedRoles: ['leader'] },
    '#leader-setting': { template: LeaderSetting, init: (avatar) => initLeaderSetting(avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-schedule': { template: LeaderSchedule, init: (avatar) => initLeaderSchedule(avatar), auth: true, allowedRoles: ['leader'] },

    '#leader-approve': { template: LeaderApprove, init: (avatar) => initLeaderApprove(avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-activity': { template: LeaderActivity, init: (avatar) => initLeaderActivity(avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-attendance': { template: LeaderAttendance, init: (avatar) => initLeaderAttendance(avatar), auth: true, allowedRoles: ['leader'] },

    // Error Routes
    '#404': { template: NotFoundPage, init: null, auth: false },
    '#network-error': { template: NetworkErrorPage, init: null, auth: false },
};

async function render() {
    const app = document.querySelector('#app');
    const hash = window.location.hash;

    try {
        // ดึงข้อมูล Session ล่าสุด
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        // หา Route ที่ตรงกับ Hash ปัจจุบัน (ถ้าไม่เจอให้ไปหน้า 404 หรือหน้าแรก)
        const route = ROUTES[hash] || (hash === '' ? ROUTES[''] : ROUTES['#404']);

        // 1. เตรียมรูปโปรไฟล์ (Default คือ logo)
        let userAvatarUrl = pfdefault;

        // --- ระบบ Auth Guard (ป้องกันการเข้าหน้าโดยไม่ได้รับอนุญาต) ---

        // 1. ถ้าหน้านี้ต้องใช้ Auth แต่ไม่มี Session -> ไปหน้า Login
        if (route.auth && !session) {
            window.location.hash = '#login';
            return;
        }

        if (session) {
            // ตรวจสอบความมีอยู่จริงของ Profile (ป้องกันกรณีบัญชีโดนลบจาก DB แต่ Token ยังอยู่)
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', session.user.id)
                .single();

            if (profileError || !profile) {
                console.warn("Profile not found or error. Logging out...");
                await supabase.auth.signOut();
                window.location.hash = '#login';
                return;
            }

            // ดึงรูป Avatar จากตาราง user_assets
            const { data: asset } = await supabase
                .from('user_assets')
                .select('url')
                .eq('user_id', session.user.id)
                .eq('asset_type', 'avatar')
                .maybeSingle();

            if (asset && asset.url) {
                userAvatarUrl = asset.url;
            }

            const userRole = profile.role || 'student';

            // 2. ถ้ามี Session แล้วแต่จะเข้าหน้า Login/Register -> ไปหน้า Default ตาม Role
            if (hash === '#login' || hash === '#register' || hash === '') {
                if (userRole === 'admin') window.location.hash = '#admin-dashboard';
                else if (userRole === 'student') window.location.hash = '#student-dashboard';
                else if (userRole === 'teacher') window.location.hash = '#teacher-dashboard';
                else if (userRole === 'leader') window.location.hash = '#leader-dashboard';
                else window.location.hash = '#login';
                return;
            }

            // 3. ตรวจสอบ Role (ไม่ให้เข้าหน้าของ Role อื่น)
            if (route.allowedRoles && !route.allowedRoles.includes(userRole)) {
                if (userRole === 'admin') window.location.hash = '#admin-dashboard';
                else if (userRole === 'student') window.location.hash = '#student-dashboard';
                else if (userRole === 'teacher') window.location.hash = '#teacher-dashboard';
                else if (userRole === 'leader') window.location.hash = '#leader-dashboard';
                else {
                    await supabase.auth.signOut();
                    window.location.hash = '#login';
                }
                return;
            }
        }

        // --- การ Render หน้าเว็บ ---
        app.innerHTML = route.template;

        // รันฟังก์ชัน Setup ของหน้านั้นๆ (ถ้ามี)
        if (route.init) {
            route.init(userAvatarUrl, pfdefault);
        }

    } catch (err) {
        console.error("Critical Render Error:", err);
        // แสดงหน้า Network Error หากเกิดความผิดพลาดในการเชื่อมต่อหรือระบบ
        app.innerHTML = NetworkErrorPage;
    }
}

// Event Listeners
window.addEventListener('hashchange', render);
window.addEventListener('load', render);
// ติดตามการเปลี่ยนสถานะ Login/Logout
supabase.auth.onAuthStateChange((event, session) => {
    // ถ้ามีการ Sign Out ให้เคลียร์หน้าและไป Login
    if (event === 'SIGNED_OUT') {
        window.location.hash = '#';
    }
    render();
});