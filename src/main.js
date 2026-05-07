import './style.css'
import { supabase } from './lib/supabaseClient' // ไฟล์ที่คุณตั้งค่า supabase client ไว้

// import template
import LandingPage from './main.html?raw'
import LoginPage from './auth/login.html?raw'
import RegisterPage from './auth/register.html?raw'
import StudentDashboard from './pages/student/student.html?raw'
import wallpaper from './assets/Memorial_Lobby_Mika_(Swimsuit) (1).png'

// import function
import { initRegister } from './auth/register.js'
import { initLogin } from './auth/login.js'
import { initStudent } from './pages/student/student.js'

// 3. กำหนด Route Map
const ROUTES = {
    '':          { template: LandingPage,    init: null,           auth: false },
    '#login':    { template: LoginPage,      init: initLogin,      auth: false },
    '#register': { template: RegisterPage,   init: initRegister,   auth: false },
    '#student':  { template: StudentDashboard, init: () => initStudent(wallpaper), auth: true },
};
async function render() {
    const app = document.querySelector('#app');
    const hash = window.location.hash;
    
    // ดึงข้อมูล Session ล่าสุด
    const { data: { session } } = await supabase.auth.getSession();
    
    // หา Route ที่ตรงกับ Hash ปัจจุบัน (ถ้าไม่เจอให้ไปหน้าแรก)
    const route = ROUTES[hash] || ROUTES[''];
    // --- ระบบ Auth Guard (ป้องกันการเข้าหน้าโดยไม่ได้รับอนุญาต) ---
    
    // 1. ถ้าหน้านี้ต้องใช้ Auth แต่ไม่มี Session -> ไปหน้า Login
    if (route.auth && !session) {
        window.location.hash = '#login';
        return;
    }
    // 2. ถ้ามี Session แล้วแต่จะเข้าหน้า Login/Register -> ไปหน้า Dashboard
    if (session && (hash === '#login' || hash === '#register' || hash === '')) {
        window.location.hash = '#student';
        return;
    }
    // --- การ Render หน้าเว็บ ---
    app.innerHTML = route.template;
    
    // รันฟังก์ชัน Setup ของหน้านั้นๆ (ถ้ามี)
    if (route.init) {
        route.init();
    }
}
// Event Listeners
window.addEventListener('hashchange', render);
window.addEventListener('load', render);
// ติดตามการเปลี่ยนสถานะ Login/Logout
supabase.auth.onAuthStateChange((event, session) => {
    // ถ้ามีการ Sign Out ให้เคลียร์หน้าและไป Login
    if (event === 'SIGNED_OUT') {
        window.location.hash = '#login';
    }
    render();
});