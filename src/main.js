import './style.css'
import { supabase } from './lib/supabaseClient' // ไฟล์ที่คุณตั้งค่า supabase client ไว้

//import asset
import pfdefault from './assets/Default_profile.jpg'

// import template
import LandingPage from './main.html?raw'
import LoginPage from './auth/login/login.html?raw'
import RegisterPage from './auth/register/register.html?raw'
import AdminRegisterPage from './auth/admin_register/admin_register.html?raw'
import ParentCheckPage from './pages/parent_check/parent_check.html?raw'

import SharedAttendancePage from './pages/shared/attendance/attendance.html?raw'
import StudentDashBoard from './pages/student/dashboard/student_dashboard.html?raw'

import SharedSettingPage from './pages/shared/setting/setting.html?raw'
import SharedSchedulePage from './pages/shared/schedule/schedule.html?raw'
import SharedUserPage from './pages/shared/user/user.html?raw'
import SharedApprovePage from './pages/shared/approve/approve.html?raw'
import SharedActivityPage from './pages/shared/activity/activity.html?raw'

import AdminDashBoard from './pages/admin/dashboard/admin_dashboard.html?raw'
import AdminLogs from './pages/admin/admin_logs/admin_logs.html?raw'

import teacherDashBoard from './pages/teacher/dashboard/teacher_dashboard.html?raw'

import LeaderDashBoard from './pages/leader/dashboard/leader_dashboard.html?raw'



// import Error Pages
import NotFoundPage from './pages/error/404.html?raw'
import NetworkErrorPage from './pages/error/network_error.html?raw'


// import function
import { initRegister } from './auth/register/register.js'
import { initAdminRegister } from './auth/admin_register/admin_register.js'
import { initLogin } from './auth/login/login.js'
import { initParentCheck } from './pages/parent_check/parent_check.js'

import { initAttendance } from './pages/shared/attendance/attendance.js'
import { initStudentDashBoard } from './pages/student/dashboard/student_dashboard.js'

import { initSetting } from './pages/shared/setting/setting.js'
import { initSchedule } from './pages/shared/schedule/schedule.js'
import { initUser } from './pages/shared/user/user.js'
import { initApprove } from './pages/shared/approve/approve.js'
import { initActivity } from './pages/shared/activity/activity.js'

import { initAdminDashBoard } from './pages/admin/dashboard/admin_dashboard.js'
import { initAdminLogs } from './pages/admin/admin_logs/admin_logs.js'

import { initTeacherDashBoard } from './pages/teacher/dashboard/teacher_dashboard.js'

import { initLeaderDashBoard } from './pages/leader/dashboard/leader_dashboard.js'



// 3. กำหนด Route Map
const ROUTES = {
    '': { template: LandingPage, init: null, auth: false },
    '#login': { template: LoginPage, init: initLogin, auth: false },
    '#register': { template: RegisterPage, init: initRegister, auth: false },
    '#admin-register': { template: AdminRegisterPage, init: initAdminRegister, auth: true, allowedRoles: ['admin'] },

    '#parent-check': { template: ParentCheckPage, init: initParentCheck, auth: false },
    '#student-attendance': { template: SharedAttendancePage, init: (avatar) => initAttendance('student', avatar), auth: true, allowedRoles: ['student'] },
    '#student-dashboard': { template: StudentDashBoard, init: (avatar) => initStudentDashBoard(avatar), auth: true, allowedRoles: ['student'] },
    '#student-schedule': { template: SharedSchedulePage, init: (avatar) => initSchedule('student', avatar), auth: true, allowedRoles: ['student'] },
    '#student-setting': { template: SharedSettingPage, init: (avatar) => initSetting('student', avatar), auth: true, allowedRoles: ['student'] },

    '#admin-user-edit': { template: SharedUserPage, init: (avatar, pfdefault) => initUser('admin', avatar, pfdefault), auth: true, allowedRoles: ['admin'] },
    '#admin-setting': { template: SharedSettingPage, init: (avatar) => initSetting('admin', avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-dashboard': { template: AdminDashBoard, init: (avatar) => initAdminDashBoard(avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-schedule': { template: SharedSchedulePage, init: (avatar) => initSchedule('admin', avatar), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-approve': { template: SharedApprovePage, init: (avatar) => initApprove('admin', avatar), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-logs': { template: AdminLogs, init: (avatar) => initAdminLogs(avatar), auth: true, allowedRoles: ['admin'] },
    '#admin-activity': { template: SharedActivityPage, init: (avatar) => initActivity('admin', avatar), auth: true, allowedRoles: ['admin'] },

    '#teacher-dashboard': { template: teacherDashBoard, init: (avatar) => initTeacherDashBoard(avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-user': { template: SharedUserPage, init: (avatar, pfdefault) => initUser('teacher', avatar, pfdefault), auth: true, allowedRoles: ['teacher'] },
    '#teacher-setting': { template: SharedSettingPage, init: (avatar) => initSetting('teacher', avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-schedule': { template: SharedSchedulePage, init: (avatar) => initSchedule('teacher', avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-approve': { template: SharedApprovePage, init: (avatar) => initApprove('teacher', avatar), auth: true, allowedRoles: ['teacher'] },
    '#teacher-activity': { template: SharedActivityPage, init: (avatar) => initActivity('teacher', avatar), auth: true, allowedRoles: ['teacher'] },

    '#leader-dashboard': { template: LeaderDashBoard, init: (avatar) => initLeaderDashBoard(avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-user': { template: SharedUserPage, init: (avatar, pfdefault) => initUser('leader', avatar, pfdefault), auth: true, allowedRoles: ['leader'] },
    '#leader-setting': { template: SharedSettingPage, init: (avatar) => initSetting('leader', avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-schedule': { template: SharedSchedulePage, init: (avatar) => initSchedule('leader', avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-approve': { template: SharedApprovePage, init: (avatar) => initApprove('leader', avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-activity': { template: SharedActivityPage, init: (avatar) => initActivity('leader', avatar), auth: true, allowedRoles: ['leader'] },
    '#leader-attendance': { template: SharedAttendancePage, init: (avatar) => initAttendance('leader', avatar), auth: true, allowedRoles: ['leader'] },

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