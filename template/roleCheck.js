// 1. กำหนดตัวแปรสำหรับเก็บสิทธิ์ไว้ด้านบนสุดของฟังก์ชัน
let userRole = null; 
let userClassId = null;
const checkPermissions = async () => {
    // ดึงข้อมูล User ที่ล็อกอินอยู่
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // ดึง Role และข้อมูลสำคัญจากตาราง profiles
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user.id)
        .single();
    if (profile) {
        userRole = profile.role;
        userClassId = profile.class_id;
        // --- ส่วนจัดการ UI ตามระดับสิทธิ์ ---
        
        // กฎ: ถ้าเป็นครู หรือ แอดมิน ให้แสดงปุ่มจัดการ (ปลดล็อก hidden)
        if (userRole === 'admin' || userRole === 'teacher') {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
        
        // กฎ: ถ้าเป็นนักเรียน ให้แสดงเฉพาะข้อมูลตัวเอง (หรือซ่อนบางอย่าง)
        if (userRole === 'student') {
            document.querySelectorAll('.student-only').forEach(el => el.classList.remove('hidden'));
        }
    }
};
// 2. เรียกใช้งาน (แนะนำให้ใช้ร่วมกับ async/await ในฟังก์ชันหลัก)
// await checkPermissions();

            // <!-- ปุ่มนี้จะซ่อนไว้ก่อน และจะโผล่เฉพาะ Admin/Teacher เท่านั้น -->
            // <button class="admin-only hidden bg-yellow-400 p-2 border-2 border-black shadow-[4px_4px_0px_black]">
            //     + เพิ่มข้อมูล (เฉพาะครู)
            // </button>
            // <!-- ส่วนนี้จะโผล่เฉพาะนักเรียนเท่านั้น -->
            // <div class="student-only hidden italic text-gray-500">
            //     *คุณกำลังดูข้อมูลในฐานะนักเรียน
            // </div>

const handleSave = async () => {
    // กันเหนียว: เช็คสิทธิ์ในระดับโค้ดก่อนส่งข้อมูลไป Supabase
    if (userRole !== 'admin' && userRole !== 'teacher') {
        alert("คุณไม่มีสิทธิ์ทำรายการนี้!");
        return;
    }
    
    // ... โค้ดบันทึกข้อมูลปกติ ...
};