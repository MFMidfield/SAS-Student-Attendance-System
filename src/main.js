import './style.css'
import { supabase } from './lib/supabaseClient' // ไฟล์ที่คุณตั้งค่า supabase client ไว้

//import asset
import logo from './assets/logo/Memorial_Lobby_Mika_(Swimsuit) (1).png'
import bander from './assets/bander/Blue-Archive-new-recruitment-system_News_FI-750x392 1.png'

// import template
import LandingPage from './main.html?raw'
import LoginPage from './auth/login/login.html?raw'
import RegisterPage from './auth/register/register.html?raw'
import ParentCheckPage from './auth/parent_check/parent_check.html?raw'

import Student from './pages/student/attendance/student.html?raw'
import StudentDashBoard from './pages/student/dashboard/student_dashboard.html?raw'
import StudentSchedule from './pages/student/schedule/student_schedule.html?raw'
import StudentSetting from './pages/student/setting/student_setting.html?raw'

import AdminUserEdit from './pages/admin/user/admin_userEdit.html?raw'
import AdminDashBoard from './pages/admin/dashboard/admin_dashboard.html?raw'
import AdminSetting from './pages/admin/setting/admin_setting.html?raw'
import AdminSchedule from './pages/admin/schedule/admin_schedule.html?raw'
import AdminLogs from './pages/admin/admin_logs/admin_logs.html?raw'
import AdminVerifyLogs from './pages/admin/attendance_verify_logs/admin_verify_logs.html?raw'
import AdminApprove from './pages/admin/attendance_approve/admin_approve.html?raw'
import AdminActivity from './pages/admin/activity/admin_activity.html?raw'

// import function
import { initRegister } from './auth/register/register.js'
import { initLogin } from './auth/login/login.js'
import { initParentCheck } from './auth/parent_check/parent_check.js'

import { initStudent } from './pages/student/attendance/student.js'
import { initStudentDashBoard } from './pages/student/dashboard/student_dashboard.js'
import { initStudentSchedule } from './pages/student/schedule/student_schedule.js'
import { initStudentSetting } from './pages/student/setting/student_setting.js'

import { initAdminSetting } from './pages/admin/setting/admin_setting.js'
import { initAdminUserEdit } from './pages/admin/user/admin_userEdit.js'
import { initAdminDashBoard } from './pages/admin/dashboard/admin_dashboard.js'
import { initAdminSchedule } from './pages/admin/schedule/admin_schedule.js'
import { initAdminLogs } from './pages/admin/admin_logs/admin_logs.js'
import { initAdminApprove } from './pages/admin/attendance_approve/admin_approve.js'
import { initAdminVerifyLogs } from './pages/admin/attendance_verify_logs/admin_verify_logs.js'
import { initAdminActivity } from './pages/admin/activity/admin_activity.js'

// 3. กำหนด Route Map
const ROUTES = {
    '':          { template: LandingPage,    init: null,           auth: false },
    '#login':    { template: LoginPage,      init: initLogin,      auth: false },
    '#register': { template: RegisterPage,   init: initRegister,   auth: false },
    '#parent-check': { template: ParentCheckPage, init: initParentCheck, auth: false },
    '#student':  { template: Student, init: (avatar) => initStudent(avatar, bander), auth: true, allowedRoles: ['student'] },
    '#student-dashboard': { template: StudentDashBoard, init: (avatar) => initStudentDashBoard(avatar, bander), auth: true, allowedRoles: ['student'] },
    '#student-schedule': { template: StudentSchedule, init: (avatar) => initStudentSchedule(avatar, bander), auth: true, allowedRoles: ['student'] },
    '#student-setting': { template: StudentSetting, init: (avatar) => initStudentSetting(avatar, bander), auth: true, allowedRoles: ['student'] },
    '#admin-user-edit': { template: AdminUserEdit, init: (avatar) => initAdminUserEdit(avatar, bander), auth: true, allowedRoles: ['admin'] },
    '#admin-setting': { template: AdminSetting, init: (avatar) => initAdminSetting(avatar, bander), auth: true, allowedRoles: ['admin'] },
    '#admin-dashboard': { template: AdminDashBoard, init: (avatar) => initAdminDashBoard(avatar, bander), auth: true, allowedRoles: ['admin'] },
    '#admin-schedule': { template: AdminSchedule, init: (avatar) => initAdminSchedule(avatar, bander), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-logs': { template: AdminLogs, init: (avatar) => initAdminLogs(avatar, bander), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-verify-logs': { template: AdminVerifyLogs, init: (avatar) => initAdminVerifyLogs(avatar, bander), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-approve': { template: AdminApprove, init: (avatar) => initAdminApprove(avatar, bander), auth: true, allowedRoles: ['admin', 'teacher'] },
    '#admin-activity': { template: AdminActivity, init: (avatar) => initAdminActivity(avatar, bander), auth: true, allowedRoles: ['admin'] },
};
async function render() {
    const app = document.querySelector('#app');
    const hash = window.location.hash;
    
    // ดึงข้อมูล Session ล่าสุด
    const { data: { session } } = await supabase.auth.getSession();
    
    // หา Route ที่ตรงกับ Hash ปัจจุบัน (ถ้าไม่เจอให้ไปหน้าแรก)
    const route = ROUTES[hash] || ROUTES[''];

    // 1. เตรียมรูปโปรไฟล์ (Default คือ logo)
    let userAvatarUrl = logo;

    // --- ระบบ Auth Guard (ป้องกันการเข้าหน้าโดยไม่ได้รับอนุญาต) ---
    
    // 1. ถ้าหน้านี้ต้องใช้ Auth แต่ไม่มี Session -> ไปหน้า Login
    if (route.auth && !session) {
        window.location.hash = '#login'; 
        return;
    }

    if (session) {
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

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        const userRole = profile ? profile.role : 'student';

        // 2. ถ้ามี Session แล้วแต่จะเข้าหน้า Login/Register -> ไปหน้า Default ตาม Role
        if (hash === '#login' || hash === '#register' || hash === '') {
            if (userRole === 'admin') window.location.hash = '#admin-dashboard';
            else if (userRole === 'student') window.location.hash = '#student-dashboard';
            // teacher page yet to be created, fallback to login/logout or a placeholder
            else window.location.hash = '#login';
            return;
        }

        // 3. ตรวจสอบ Role (ไม่ให้เข้าหน้าของ Role อื่น)
        if (route.allowedRoles && !route.allowedRoles.includes(userRole)) {
            if (userRole === 'admin') window.location.hash = '#admin-dashboard';
            else if (userRole === 'student') window.location.hash = '#student-dashboard';
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
        route.init(userAvatarUrl);
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