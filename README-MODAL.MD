1. ส่วน HTML (ก๊อปปี้โครงสร้าง)
ก๊อปปี้ HTML ของ Modal ไปวางไว้ก่อนปิด </body> ในหน้าใหม่ และสิ่งที่ควรแก้คือ:

ID ของ Modal: เปลี่ยนจาก id="logout-modal" เป็นชื่อที่ตรงงาน เช่น id="confirm-delete-modal"
เนื้อหา: แก้ไขข้อความ <h2> และลบส่วนนับถอยหลังออกหากไม่จำเป็น
ปุ่ม: เปลี่ยน ID ปุ่ม Confirm/Cancel ให้สื่อความหมาย เช่น id="btn-confirm-delete"



2. ส่วน JavaScript (ก๊อปปี้ Logic)
ส่วนที่ต้องเอาไปคือฟังก์ชัน closeModal และ Event Listener ครับ โดยจุดที่ต้องแก้ไขคือ:

ตัวแปร Button: เปลี่ยน document.getElementById ให้ตรงกับ ID ใหม่ที่ตั้งใน HTML
ฟังก์ชัน closeModal:
ถ้าไม่มีการนับถอยหลัง ให้ลบบรรทัด clearInterval(logoutTimer); และลบโค้ดส่วนที่อัพเดท timerDisplay ออกครับ
ส่วนที่ต้องการให้เกิดขึ้นจริง:
ใน confirmBtn.addEventListener, แทนที่จะเป็น supabase.auth.signOut(), ให้เปลี่ยนเป็น Logic ที่คุณต้องการ (เช่น การลบข้อมูล หรือการเปลี่ยนหน้า)

<!-- html -->
    <div id="logout-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden p-4">
        <!-- Backdrop with Blur -->
        <div id="logout-backdrop" class="absolute inset-0 bg-[#1E1E1E]/40 backdrop-blur-md backdrop-fade-in"></div>
        
        <!-- Modal Content -->
        <div class="relative w-full max-w-[450px] bg-[#FFFFFF] border-4 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] p-8 flex flex-col items-center text-center gap-6 fade-in">
            <div class="bg-[#D96C6C] border-2 border-[#1E1E1E] p-4 shadow-[4px_4px_0px_#1E1E1E]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1E1E1E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
            </div>

            <div class="space-y-2">
                <h2 class="text-2xl font-black uppercase tracking-tight text-[#1E1E1E]">log out?</h2>
                <p class="text-[#1E1E1E] font-bold opacity-70">Closing in <span id="logout-timer" class="text-[#D96C6C]">10</span> seconds</p>
            </div>

            <div class="flex flex-row w-full gap-4">
                <button id="btn-confirm-logout" 
                    class="flex-1 py-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-black uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    Confirm
                </button>
                <button id="btn-cancel-logout" 
                    class="flex-1 py-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-black uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                    Cancel
                </button>
            </div>
        </div>
    </div>


<!-- script -->
    let logoutTimer;
    const modal = document.getElementById('logout-modal');
    const timerDisplay = document.getElementById('logout-timer');
    const confirmLogoutBtn = document.getElementById('btn-confirm-logout');
    const cancelLogoutBtn = document.getElementById('btn-cancel-logout');

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdrop = document.getElementById('logout-backdrop');
            
            if (modalContent && backdrop) {
                // เริ่ม Fade-out ทั้งเนื้อหาและ Backdrop
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');
                
                backdrop.classList.remove('backdrop-fade-in');
                backdrop.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modal.classList.add('hidden');
                    
                    // Reset classes สำหรับครั้งต่อไป
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');
                    
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }, 400);
            } else {
                modal.classList.add('hidden');
            }
        }
        clearInterval(logoutTimer);
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const backdrop = document.getElementById('logout-backdrop');
            if (modal && timerDisplay) {
                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }
                
                modal.classList.remove('hidden');
                let timeLeft = 10;
                timerDisplay.textContent = timeLeft;

                logoutTimer = setInterval(() => {
                    timeLeft--;
                    timerDisplay.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        closeModal();
                    }
                }, 1000);
            }
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert(error.message);
                closeModal();
            } else {
                window.location.hash = '';
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            closeModal();
        });
    }