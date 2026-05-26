# แผนการปรับปรุงโค้ด: ย้ายหน้ากิจกรรมไปเป็น Module ที่ใช้ร่วมกันได้ทุกบทบาท (Reusable Activity Page Module)

เอกสารนี้แสดงขั้นตอนการปรับปรุงหน้ากิจกรรมเพื่อลดความซ้ำซ้อนของโค้ด เนื่องจากปัจจุบันโค้ดมีการทำซ้ำกันอยู่ 3 บทบาท:
* `admin` (`src/pages/admin/activity/`)
* `teacher` (`src/pages/teacher/activity/`)
* `leader` (`src/pages/leader/activity/`)

การรวมโค้ดเหล่านี้เข้าด้วยกันจะช่วยลดบรรทัดโค้ดที่ซ้ำซ้อน ทำให้แก้ไขและดูแลรักษาระบบได้ง่ายขึ้นในอนาคต โดยยังคงรักษาความปลอดภัยในการเข้าถึงข้อมูลได้อย่างครบถ้วน

---

## 1. โครงสร้างโฟลเดอร์ที่จะเปลี่ยนไป

เราจะสร้างโฟลเดอร์ชื่อ `shared` ภายใต้ `src/pages` เพื่อใช้เก็บหน้ากิจกรรมส่วนกลางนี้:

```
src/
└── pages/
    ├── shared/
    │   └── activity/
    │       ├── activity.html        <-- [สร้างใหม่] ไฟล์เทมเพลต HTML ส่วนกลาง
    │       └── activity.js          <-- [สร้างใหม่] ไฟล์ลอจิก JavaScript ส่วนกลาง
    ├── admin/
    │   └── activity/                <-- [ลบออก]
    ├── teacher/
    │   └── activity/              <-- [ลบออก]
    └── leader/
        └── activity/               <-- [ลบออก]
```

---

## 2. ไฟล์ HTML ส่วนกลาง (`activity.html`)

เราจะรวมโครงสร้างของ HTML ทั้งหมดไว้ในไฟล์เดียว และใช้ ID เช่น `portal-title` เพื่อนำไปเปลี่ยนข้อความหัวเว็บแบบไดนามิกผ่าน JavaScript (เช่น "Admin Portal", "Class Timetable", หรือ "Leader Portal") ตามสิทธิ์ของผู้ใช้ที่ล็อกอินเข้ามา

### [สร้างใหม่] `src/pages/shared/activity/activity.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Activity Management</title>
    <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;900&family=Rubik:ital,wght@0,300..900;1,300..900&display=swap');
        body {
            font-family: 'M PLUS Rounded 1c', sans-serif;
        }
    </style>
</head>
<body class="bg-[#EEEDDE] flex flex-col justify-center items-center min-h-screen p-4">

    <div id="main-card"
        class="fade-in relative w-full max-w-[450px] bg-[#EEEDDE] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] overflow-hidden">

        <!-- แถบสีตกแต่งด้านบน -->
        <div class="w-full h-2 bg-gradient-to-r from-[#8E7B46] via-[#B29B58] to-[#D4C185]"></div>
        
        <!-- ส่วนหัวข้อของหน้าเว็บ -->
        <div class="relative px-5 pt-5 pb-4">
            <div class="flex items-center gap-4">
                <div class="shrink-0 bg-[#B29B58] border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] p-2.5">
                    <svg class="w-6 h-6" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <div class="flex-1 min-w-0">
                    <!-- หัวข้อจะเปลี่ยนไปตาม Role อัตโนมัติ (เช่น Admin Portal, Class Timetable, Leader Portal) -->
                    <p id="portal-title" class="text-[10px] font-bold text-[#1E1E1E]/50 uppercase tracking-widest">Portal</p>
                    <h1 class="text-xl font-bold text-[#1E1E1E] tracking-tight"
                        style="-webkit-text-stroke: 0.3px #1E1E1E;">Activity Management</h1>
                </div>
            </div>
        </div>

        <!-- เส้นแบ่ง -->
        <div class="mx-5 border-t-2 border-[#1E1E1E]/15"></div>

        <!-- รูปภาพแบนเนอร์ (ซ่อนไว้เพื่อรองรับความเข้ากันได้ของ JS เดิม) -->
        <img id="bander-image" src="" alt="" class="hidden">

        <!-- ปุ่มเพิ่มกิจกรรม (ซ่อนไว้เป็นค่าเริ่มต้น จะแสดงผลเฉพาะ Admin และ Teacher เท่านั้น) -->
        <div id="add-event-wrapper" class="px-5 pt-4 pb-2 mb-4 hidden">
            <div class="flex items-center justify-between gap-2 mb-3">
                <span class="text-xs font-bold text-[#1E1E1E]/50 uppercase tracking-wide">School Events</span>
            </div>
            <button id="btn-add-event"
                class="px-4 py-2.5 bg-[#F2C00F] border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] text-[11px] font-black text-[#1E1E1E] uppercase tracking-widest cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#1E1E1E] transition-all">
                + Add New School Event
            </button>
        </div>

        <!-- ส่วนแสดงรายการกิจกรรม -->
        <div class="px-5 pb-3">
            <div class="flex items-center justify-between gap-2 mb-3 show-on-readonly-only hidden">
                <span class="text-xs font-bold text-[#1E1E1E]/50 uppercase tracking-wide">School Events</span>
            </div>
            <div id="event-list" class="space-y-3 max-h-[400px] overflow-y-auto pr-1 pb-4">
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-sm font-bold text-[#1E1E1E]/40 uppercase">Loading activities...</p>
                </div>
            </div>
        </div>

        <!-- แถบสีตกแต่งด้านล่าง -->
        <div class="w-full h-2 bg-gradient-to-r from-[#8E7B46] via-[#B29B58] to-[#D4C185]"></div>
    </div>

    <!-- ปุ่มย้อนกลับ -->
    <div class="fade-in w-full max-w-[450px] mt-4">
        <button id="btn-back"
            class="flex items-center justify-center gap-2 w-full p-3.5 bg-[#EEEDDE] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#E0DFD1]">
            <svg class="w-5 h-5" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="text-sm tracking-wider">Back</span>
        </button>
    </div>

    <!-- Modal แสดงรายละเอียดกิจกรรม (แชร์ร่วมกันทุก Role) -->
    <div id="modal-detail" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden">
        <div id="backdrop-detail" class="absolute inset-0 bg-[#1E1E1E]/40 backdrop-blur-md backdrop-fade-in"></div>
        <div class="relative w-full max-w-[400px] bg-[#EEEDDE] border-4 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] p-8 flex flex-col gap-6 fade-in">
            <div class="flex flex-col items-center text-center gap-2">
                <div class="w-16 h-16 bg-[#B29B58] border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] flex items-center justify-center mb-2">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h2 id="detail-title" class="text-2xl font-black uppercase tracking-tight text-[#1E1E1E]">Activity Name</h2>
                <p id="detail-date" class="text-xs font-bold text-[#1E1E1E]/60 uppercase tracking-widest">Date & Time</p>
            </div>

            <div class="space-y-4">
                <div class="bg-white border-2 border-[#1E1E1E] p-4 shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-[10px] font-black uppercase text-[#1E1E1E]/40 mb-1">Location</p>
                    <p id="detail-location" class="text-sm font-bold text-[#1E1E1E]">Location Name</p>
                </div>
                <div class="bg-white border-2 border-[#1E1E1E] p-4 shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-[10px] font-black uppercase text-[#1E1E1E]/40 mb-1">Organizer</p>
                    <p id="detail-organizer" class="text-sm font-bold text-[#1E1E1E]">Organizer Name</p>
                </div>
                <div class="bg-white border-2 border-[#1E1E1E] p-4 shadow-[3px_3px_0px_#1E1E1E] max-h-[150px] overflow-y-auto">
                    <p class="text-[10px] font-black uppercase text-[#1E1E1E]/40 mb-1">Description</p>
                    <p id="detail-description" class="text-sm font-bold text-[#1E1E1E] whitespace-pre-wrap">Description text goes here...</p>
                </div>
            </div>

            <button id="btn-close-detail" class="w-full py-3.5 bg-white border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-[#EEEDDE]">
                Close
            </button>
        </div>
    </div>

    <!-- Modal เพิ่ม/แก้ไขกิจกรรม (เปิดใช้งานเฉพาะบทบาทที่มีสิทธิ์เขียนข้อมูล) -->
    <div id="modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden">
        <div id="backdrop" class="absolute inset-0 bg-[#1E1E1E]/40 backdrop-blur-md backdrop-fade-in cursor-pointer"></div>
        <div class="relative w-full max-w-[450px] max-h-[90vh] overflow-y-auto bg-[#EEEDDE] border-4 border-[#1E1E1E] shadow-[8px_8px_0px_#1E1E1E] p-8 flex flex-col items-center text-center gap-4 fade-in">
            <div class="bg-[#F2C00F] border-2 border-[#1E1E1E] p-4 shadow-[4px_4px_0px_#1E1E1E]">
                <svg id="saveIcon" class="w-12 h-12" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h2 id="modal-title" class="text-2xl font-bold uppercase tracking-wider">Add Activity</h2>
            <input type="hidden" id="edit-id">

            <div class="relative w-full text-left">
                <label class="text-[10px] font-bold uppercase ml-1">Activity Name</label>
                <input type="text" id="title" placeholder="e.g. Sports Day" maxlength="255"
                    class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
            </div>

            <div class="grid grid-cols-2 gap-4 w-full">
                <div class="relative w-full text-left">
                    <label class="text-[10px] font-bold uppercase ml-1">Date</label>
                    <input type="date" id="activity_date"
                        class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
                </div>
                <div class="relative w-full text-left">
                    <label class="text-[10px] font-bold uppercase ml-1">Location</label>
                    <input type="text" id="location" placeholder="e.g. Main Hall" maxlength="255"
                        class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4 w-full">
                <div class="relative w-full text-left">
                    <label class="text-[10px] font-bold uppercase ml-1">Start Time</label>
                    <input type="time" id="start_time"
                        class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
                </div>
                <div class="relative w-full text-left">
                    <label class="text-[10px] font-bold uppercase ml-1">End Time</label>
                    <input type="time" id="end_time"
                        class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
                </div>
            </div>

            <div class="relative w-full text-left">
                <label class="text-[10px] font-bold uppercase ml-1">Organizer</label>
                <input type="text" id="organizer" placeholder="e.g. Student Council" maxlength="100"
                    class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none">
            </div>

            <div class="relative w-full text-left">
                <label class="text-[10px] font-bold uppercase ml-1">Description</label>
                <textarea id="description" placeholder="Description of the activity..." rows="3" maxlength="1000"
                    class="w-full p-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[2px_2px_0px_#1E1E1E] text-[#1E1E1E] font-bold focus:outline-none"></textarea>
            </div>

            <div class="flex flex-row w-full gap-4 mt-2">
                <button id="btn-save" class="flex-1 py-3 bg-[#73CB8F] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Save</button>
                <button id="btn-delete" class="flex-1 py-3 bg-[#E25C5C] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hidden">Delete</button>
                <button id="btn-close" class="flex-1 py-3 bg-[#FFFFFF] border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] text-[#1E1E1E] font-bold uppercase transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Close</button>
            </div>
        </div>
    </div>

    <!-- Modal ยืนยันการบันทึก/ลบข้อมูล (เปิดใช้งานเฉพาะบทบาทที่มีสิทธิ์เขียนข้อมูล) -->
    <div id="modal-confirm" class="fixed inset-0 z-[60] flex items-center justify-center p-4 hidden">
        <div id="backdrop-confirm" class="absolute inset-0 bg-[#1E1E1E]/60 backdrop-blur-sm backdrop-fade-in"></div>
        <div class="confirm-content relative w-full max-w-[340px] bg-[#EEEDDE] border-2 border-[#1E1E1E] shadow-[6px_6px_0px_#1E1E1E] p-6 flex flex-col items-center gap-5 fade-in">
            <div id="confirm-icon-wrapper" class="w-14 h-14 border-2 border-[#1E1E1E] flex items-center justify-center shadow-[3px_3px_0px_#1E1E1E] bg-[#F2C00F]">
                <svg id="confirm-icon" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 id="confirm-title" class="text-lg font-black uppercase tracking-wider text-center">Confirm Action</h3>
            <p id="confirm-desc" class="text-sm font-bold text-center opacity-70 leading-relaxed">Are you sure you want to proceed?</p>
            <div id="countdown-wrapper" class="flex items-center gap-3">
                <div class="relative w-10 h-10">
                    <svg class="countdown-ring w-10 h-10" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1E1E1E" stroke-width="2" opacity="0.15" />
                        <circle id="countdown-circle" cx="18" cy="18" r="15.5" fill="none" stroke="#1E1E1E" stroke-width="2.5" stroke-dasharray="97.39" stroke-dashoffset="0" stroke-linecap="square" style="transition: stroke-dashoffset 1s linear;" />
                    </svg>
                    <span id="countdown-number" class="absolute inset-0 flex items-center justify-center text-sm font-black">3</span>
                </div>
                <span id="countdown-label" class="text-xs font-bold opacity-50 uppercase">Please wait...</span>
            </div>
            <div class="flex gap-3 w-full">
                <button id="btn-confirm-action" class="flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed" disabled>Confirm</button>
                <button id="btn-confirm-cancel" class="flex-1 py-3 bg-white border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Cancel</button>
            </div>
        </div>
    </div>

</body>
</html>
```

---

## 3. ไฟล์ลอจิก JavaScript ส่วนกลาง (`activity.js`)

ไฟล์ JavaScript นี้จะ Export ฟังก์ชัน `initActivity(role, userAvatarUrl)` เพียงอันเดียว และตรวจเช็กบทบาท `role` เพื่อจำกัดไม่ให้ผูก Event Listeners ที่เกี่ยวกับการเพิ่มหรือแก้ไขหากเป็นผู้ไม่มีสิทธิ์อ่านอย่างเดียว (Read-Only)

### [สร้างใหม่] `src/pages/shared/activity/activity.js`

```javascript
import { supabase } from '../../../lib/supabaseClient.js';
import { showToast, escapeHTML } from "../../../lib/ui";

export function initActivity(role, userAvatarUrl) {
    // 1. ตรวจสอบสิทธิ์การเขียน/แก้ไขข้อมูล (Admin และ Teacher มีสิทธิ์จัดการข้อมูลได้)
    const hasWriteAccess = (role === 'admin' || role === 'teacher');

    // 2. ตั้งค่าการคลิกปุ่ม Back อิงตามบทบาทปัจจุบันของผู้ใช้งาน
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = `#${role}-dashboard`;
        });
    }

    // 3. กำหนดชื่อหัวข้อหน้าเว็บบน Header แบบไดนามิกตาม Role
    const portalTitle = document.getElementById('portal-title');
    if (portalTitle) {
        if (role === 'admin') portalTitle.textContent = 'Admin Portal';
        else if (role === 'teacher') portalTitle.textContent = 'Class Timetable';
        else if (role === 'leader') portalTitle.textContent = 'Leader Portal';
    }

    // 4. แสดงปุ่มเพิ่มกิจกรรมเฉพาะผู้มีสิทธิ์เขียน หากไม่มีสิทธิ์ให้ซ่อนไว้
    const addEventWrapper = document.getElementById('add-event-wrapper');
    const readOnlyHeading = document.querySelector('.show-on-readonly-only');
    
    if (hasWriteAccess) {
        if (addEventWrapper) addEventWrapper.classList.remove('hidden');
    } else {
        if (readOnlyHeading) readOnlyHeading.classList.remove('hidden');
    }

    // ประกาศตัวแปร Modal และ Form (จะผูก Element เฉพาะเมื่อมีสิทธิ์เขียน/แก้ไขข้อมูล)
    let modal, backdrop, btnAddEvent, btnClose, btnSave, btnDelete;
    let modalTitle, editIdInput, titleInput, dateInput, locationInput, startTimeInput, endTimeInput, organizerInput, descriptionInput;
    let confirmModal, confirmBackdrop, btnConfirmAction, btnConfirmCancel, confirmTitle, confirmDesc, confirmIcon, confirmIconWrapper;
    let countdownNumber, countdownLabel, countdownCircle, countdownWrapper;
    let countdownInterval = null;
    let pendingAction = null; // เก็บข้อมูลก่อนบันทึก: { type: 'save' | 'delete', data?: any }

    if (hasWriteAccess) {
        modal = document.getElementById('modal');
        backdrop = document.getElementById('backdrop');
        btnAddEvent = document.getElementById('btn-add-event');
        btnClose = document.getElementById('btn-close');
        btnSave = document.getElementById('btn-save');
        btnDelete = document.getElementById('btn-delete');
        
        modalTitle = document.getElementById('modal-title');
        editIdInput = document.getElementById('edit-id');
        titleInput = document.getElementById('title');
        dateInput = document.getElementById('activity_date');
        locationInput = document.getElementById('location');
        startTimeInput = document.getElementById('start_time');
        endTimeInput = document.getElementById('end_time');
        organizerInput = document.getElementById('organizer');
        descriptionInput = document.getElementById('description');

        confirmModal = document.getElementById('modal-confirm');
        confirmBackdrop = document.getElementById('backdrop-confirm');
        btnConfirmAction = document.getElementById('btn-confirm-action');
        btnConfirmCancel = document.getElementById('btn-confirm-cancel');
        confirmTitle = document.getElementById('confirm-title');
        confirmDesc = document.getElementById('confirm-desc');
        confirmIcon = document.getElementById('confirm-icon');
        confirmIconWrapper = document.getElementById('confirm-icon-wrapper');
        countdownNumber = document.getElementById('countdown-number');
        countdownLabel = document.getElementById('countdown-label');
        countdownCircle = document.getElementById('countdown-circle');
        countdownWrapper = document.getElementById('countdown-wrapper');
    }

    // ตัวแปรสำหรับแสดงรายละเอียดกิจกรรม (ทำงานได้ทุกบทบาท)
    const modalDetail = document.getElementById('modal-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const backdropDetail = document.getElementById('backdrop-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailDate = document.getElementById('detail-date');
    const detailLocation = document.getElementById('detail-location');
    const detailOrganizer = document.getElementById('detail-organizer');
    const detailDescription = document.getElementById('detail-description');

    let activitiesData = [];

    // --- ส่วนของการดึงข้อมูลจาก Supabase Database ---
    const fetchActivities = async () => {
        const listContainer = document.getElementById('event-list');
        listContainer.innerHTML = `
            <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                <p class="text-sm font-bold text-[#1E1E1E]/40 uppercase">Loading activities...</p>
            </div>
        `;

        const { data, error } = await supabase
            .from('school_activities')
            .select('*')
            .order('activity_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching activities:', error);
            showToast('Failed to load activities', 'error');
            listContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-sm font-bold text-[#E25C5C] uppercase">Error loading data</p>
                </div>
            `;
            return;
        }

        activitiesData = data || [];
        renderActivities();
    };

    // Render รายการกิจกรรมแสดงบนหน้าเว็บ
    const renderActivities = () => {
        const listContainer = document.getElementById('event-list');
        listContainer.innerHTML = '';

        if (activitiesData.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-sm font-bold text-[#1E1E1E]/40 uppercase">No activities found</p>
                </div>
            `;
            return;
        }

        activitiesData.forEach(activity => {
            const dateObj = new Date(activity.activity_date);
            const monthShort = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const dayNum = dateObj.getDate().toString().padStart(2, '0');
            const dayShort = dateObj.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

            const startTime = activity.start_time.substring(0, 5);
            const endTime = activity.end_time.substring(0, 5);

            const div = document.createElement('div');
            div.className = 'activity-row bg-white border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] overflow-hidden cursor-pointer hover:bg-[#F2C00F]/5 transition-colors group/row';
            div.dataset.id = activity.id;

            // Render ปุ่มแก้ไขเฉพาะเมื่อมีสิทธิ์เขียน/แก้ไขเท่านั้น
            const editBtnHTML = hasWriteAccess
                ? `<button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors" data-id="${activity.id}">
                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>`
                : '';

            div.innerHTML = `
                <div class="flex items-stretch h-full">
                    <!-- แสดง Badge วันที่ -->
                    <div class="w-16 shrink-0 bg-[#F2C00F] border-r-2 border-[#1E1E1E] flex flex-col items-center justify-center p-2 group-hover/row:bg-[#F2C00F] group-hover/row:text-black transition-colors">
                        <span class="text-[8px] font-black uppercase opacity-60">${monthShort}</span>
                        <span class="text-xl font-black leading-tight">${dayNum}</span>
                        <span class="text-[8px] font-black uppercase opacity-60">${dayShort}</span>
                    </div>
                    <!-- เนื้อหากิจกรรม -->
                    <div class="flex-1 p-3 min-w-0">
                        <div class="flex items-start justify-between gap-2 h-full">
                            <div class="flex-1 flex flex-col min-w-0 justify-center h-full">
                                <p class="text-xs font-black text-[#1E1E1E] uppercase tracking-wide truncate">${escapeHTML(activity.title)}</p>
                                <p class="text-[9px] font-bold text-[#1E1E1E]/50 mt-0.5">${startTime} - ${endTime} • ${escapeHTML(activity.location || 'TBA')}</p>
                                <p class="text-[9px] font-bold text-[#1E1E1E]/40 mt-1 line-clamp-1">${escapeHTML(activity.description || 'No description')}</p>
                            </div>
                        </div>
                    </div>
                    ${editBtnHTML}
                </div>
            `;
            listContainer.appendChild(div);
        });

        // ลงทะเบียน Event ลิสเนอร์สำหรับเปิดหน้าต่างรายละเอียดการกดแถวข้อมูล
        document.querySelectorAll('.activity-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.edit-item-btn')) return; // ถ้ากดโดนปุ่มแก้ไขไม่ต้องเปิดหน้าต่างนี้
                openDetailModal(row.dataset.id);
            });
        });

        // ผูกสิทธิ์แก้ไขเฉพาะผู้ใช้ที่มี Write Access
        if (hasWriteAccess) {
            document.querySelectorAll('.edit-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(btn.dataset.id);
                });
            });
        }
    };

    // --- ส่วนการจัดการ Modal แสดงรายละเอียด (ทำงานทุกสิทธิ์) ---
    const openDetailModal = (id) => {
        const activity = activitiesData.find(a => a.id === id);
        if (!activity) return;

        detailTitle.textContent = activity.title;
        const dateObj = new Date(activity.activity_date);
        const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        detailDate.textContent = `${dateStr} • ${activity.start_time.substring(0, 5)} - ${activity.end_time.substring(0, 5)}`;
        detailLocation.textContent = activity.location || 'Not Specified';
        detailOrganizer.textContent = activity.organizer || 'School';
        detailDescription.textContent = activity.description || 'No description provided.';

        modalDetail.classList.remove('hidden');
    };

    const closeDetailModal = () => {
        if (modalDetail) {
            const modalContent = modalDetail.querySelector('.fade-in');
            const backdropElem = document.getElementById('backdrop-detail');

            if (modalContent && backdropElem) {
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');
                backdropElem.classList.remove('backdrop-fade-in');
                backdropElem.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modalDetail.classList.add('hidden');
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');
                    backdropElem.classList.remove('backdrop-fade-out');
                    backdropElem.classList.add('backdrop-fade-in');
                }, 400);
            } else {
                modalDetail.classList.add('hidden');
            }
        }
    };

    if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeDetailModal);
    if (backdropDetail) backdropDetail.addEventListener('click', closeDetailModal);


    // --- ฟังก์ชันสำหรับการ เพิ่ม / แก้ไข / ลบ กิจกรรม (ทำงานเฉพาะสิทธิ์การเขียน/แก้ไขเท่านั้น) ---
    if (hasWriteAccess) {
        const openModal = (id = null) => {
            modal.classList.remove('hidden');
            if (id) {
                const activity = activitiesData.find(a => a.id === id);
                if (activity) {
                    modalTitle.textContent = 'Edit Activity';
                    editIdInput.value = activity.id;
                    titleInput.value = activity.title;
                    dateInput.value = activity.activity_date;
                    locationInput.value = activity.location || '';
                    startTimeInput.value = activity.start_time.substring(0, 5);
                    endTimeInput.value = activity.end_time.substring(0, 5);
                    organizerInput.value = activity.organizer || '';
                    descriptionInput.value = activity.description || '';
                    btnDelete.classList.remove('hidden');
                }
            } else {
                modalTitle.textContent = 'Add Activity';
                editIdInput.value = '';
                titleInput.value = '';
                dateInput.value = '';
                locationInput.value = '';
                startTimeInput.value = '';
                endTimeInput.value = '';
                organizerInput.value = '';
                descriptionInput.value = '';
                btnDelete.classList.add('hidden');
            }
        };

        const closeModal = () => {
            if (modal) {
                const modalContent = modal.querySelector('.fade-in');
                const backdropElem = document.getElementById('backdrop');

                if (modalContent && backdropElem) {
                    modalContent.classList.remove('fade-in');
                    modalContent.classList.add('fade-out');
                    backdropElem.classList.remove('backdrop-fade-in');
                    backdropElem.classList.add('backdrop-fade-out');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        modalContent.classList.remove('fade-out');
                        modalContent.classList.add('fade-in');
                        backdropElem.classList.remove('backdrop-fade-out');
                        backdropElem.classList.add('backdrop-fade-in');
                    }, 400);
                } else {
                    modal.classList.add('hidden');
                }
            }
        };

        btnAddEvent.addEventListener('click', () => openModal());
        btnClose.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        // จัดการ Modal ยืนยันการทำงาน (Confirmation Modal)
        const openConfirmModal = (type, data = null) => {
            pendingAction = { type, data };
            confirmModal.classList.remove('hidden');
            btnConfirmAction.disabled = true;
            btnConfirmAction.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
            
            clearInterval(countdownInterval);

            const unlockButton = () => {
                countdownNumber.textContent = '✓';
                countdownLabel.textContent = 'Ready';
                btnConfirmAction.disabled = false;
                btnConfirmAction.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
                btnConfirmAction.classList.add('active:translate-x-[2px]', 'active:translate-y-[2px]', 'active:shadow-none');
                
                if (type === 'save') {
                    btnConfirmAction.classList.add('bg-[#73CB8F]', 'text-[#1E1E1E]');
                } else {
                    btnConfirmAction.classList.add('bg-[#E25C5C]', 'text-white');
                }
            };

            if (type === 'save') {
                confirmTitle.textContent = 'Save Activity';
                confirmDesc.textContent = 'Are you sure you want to save these details?';
                confirmIconWrapper.className = 'w-14 h-14 border-2 border-[#1E1E1E] flex items-center justify-center shadow-[3px_3px_0px_#1E1E1E] bg-[#73CB8F]';
                confirmIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>';
                btnConfirmAction.textContent = 'Save';
                
                countdownNumber.textContent = '...';
                countdownLabel.textContent = 'Wait';
                countdownCircle.style.strokeDashoffset = '97.39'; 
                countdownWrapper.classList.add('hidden');

                setTimeout(unlockButton, 500);
            } else if (type === 'delete') {
                countdownWrapper.classList.remove('hidden');
                
                let seconds = 3;
                countdownNumber.textContent = seconds;
                countdownLabel.textContent = 'Please wait...';
                countdownCircle.style.strokeDashoffset = '0';

                confirmTitle.textContent = 'Delete Activity';
                confirmDesc.textContent = 'This action cannot be undone. Proceed?';
                confirmIconWrapper.className = 'w-14 h-14 border-2 border-[#1E1E1E] flex items-center justify-center shadow-[3px_3px_0px_#1E1E1E] bg-[#E25C5C]';
                confirmIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>';
                confirmIcon.classList.add('text-white');
                btnConfirmAction.textContent = 'Delete';

                countdownInterval = setInterval(() => {
                    seconds--;
                    if (seconds > 0) {
                        countdownNumber.textContent = seconds;
                        const offset = 97.39 - (seconds / 3) * 97.39;
                        countdownCircle.style.strokeDashoffset = offset;
                    } else {
                        clearInterval(countdownInterval);
                        unlockButton();
                    }
                }, 1000);
            }
        };

        const closeConfirmModal = () => {
            if (confirmModal) {
                const modalContent = confirmModal.querySelector('.fade-in');
                const backdropElem = document.getElementById('backdrop-confirm');

                if (modalContent && backdropElem) {
                    modalContent.classList.remove('fade-in');
                    modalContent.classList.add('fade-out');
                    backdropElem.classList.remove('backdrop-fade-in');
                    backdropElem.classList.add('backdrop-fade-out');

                    setTimeout(() => {
                        confirmModal.classList.add('hidden');
                        modalContent.classList.remove('fade-out');
                        modalContent.classList.add('fade-in');
                        backdropElem.classList.remove('backdrop-fade-out');
                        backdropElem.classList.add('backdrop-fade-in');
                        clearInterval(countdownInterval);
                        pendingAction = null;
                    }, 400);
                } else {
                    confirmModal.classList.add('hidden');
                    clearInterval(countdownInterval);
                    pendingAction = null;
                }
            }
        };

        btnConfirmCancel.addEventListener('click', closeConfirmModal);
        confirmBackdrop.addEventListener('click', closeConfirmModal);

        btnSave.addEventListener('click', () => {
            const id = editIdInput.value;
            const title = titleInput.value.trim();
            const activity_date = dateInput.value;
            const location = locationInput.value.trim();
            const start_time = startTimeInput.value;
            const end_time = endTimeInput.value;
            const organizer = organizerInput.value.trim();
            const description = descriptionInput.value.trim();

            if (!title || !activity_date || !start_time || !end_time) {
                showToast('Please fill all required fields', 'error');
                return;
            }

            if (start_time >= end_time) {
                showToast('Start time must be before end time', 'error');
                return;
            }

            const data = { id, title, activity_date, location, start_time, end_time, organizer, description };
            openConfirmModal('save', data);
        });

        btnDelete.addEventListener('click', () => {
            const id = editIdInput.value;
            if (id) {
                openConfirmModal('delete', { id });
            }
        });

        btnConfirmAction.addEventListener('click', async () => {
            if (!pendingAction) return;

            btnConfirmAction.disabled = true;
            btnConfirmAction.innerHTML = '<span class="animate-pulse">Processing...</span>';

            if (pendingAction.type === 'save') {
                const { id, title, activity_date, location, start_time, end_time, organizer, description } = pendingAction.data;
                const payload = { title, activity_date, location, start_time, end_time, organizer, description };

                let error;
                if (id) {
                    const res = await supabase.from('school_activities').update(payload).eq('id', id);
                    error = res.error;
                } else {
                    const res = await supabase.from('school_activities').insert([payload]);
                    error = res.error;
                }

                if (error) {
                    console.error(error);
                    showToast('Error saving activity', 'error');
                } else {
                    showToast('Activity saved successfully', 'success');
                    closeModal();
                    fetchActivities();
                }

            } else if (pendingAction.type === 'delete') {
                const { id } = pendingAction.data;
                const { error } = await supabase.from('school_activities').delete().eq('id', id);
                
                if (error) {
                    console.error(error);
                    showToast('Error deleting activity', 'error');
                } else {
                    showToast('Activity deleted successfully', 'success');
                    closeModal();
                    fetchActivities();
                }
            }

            closeConfirmModal();
        });
    }

    // เรียกข้อมูลครั้งแรกเมื่อโหลดโมดูล
    fetchActivities();
}
```

---

## 4. อัปเดตตัวนำทางหน้าเว็บ (`src/main.js`)

ในขั้นตอนสุดท้าย เราจะต้องไปแก้ไขที่ไฟล์ระบบนำทาง `src/main.js` เพื่อให้มาเรียกใช้งานหน้าและสคริปต์ตัวเดียวกัน

### ลำดับการแก้ไข `src/main.js`:

1. **เอาการนำเข้าไฟล์เดิมออก (Remove Old Imports)**:
   ลบบรรทัดที่อิมพอร์ตเทมเพลต HTML และฟังก์ชัน init หน้ากิจกรรมของเดิมทั้ง 3 หน้าออก:
   ```diff
   -import AdminActivity from './pages/admin/activity/admin_activity.html?raw'
   -import teacherActivity from './pages/teacher/activity/teacher_activity.html?raw'
   -import LeaderActivity from './pages/leader/activity/leader_activity.html?raw'
   
   -import { initAdminActivity } from './pages/admin/activity/admin_activity.js'
   -import { initTeacherActivity } from './pages/teacher/activity/teacher_activity.js'
   -import { initLeaderActivity } from './pages/leader/activity/leader_activity.js'
   ```

2. **นำเข้าไฟล์ส่วนกลางอันใหม่ (Add Shared Module Import)**:
   ```javascript
   import SharedActivityPage from './pages/shared/activity/activity.html?raw'
   import { initActivity } from './pages/shared/activity/activity.js'
   ```

3. **แก้ไขแผนที่หน้า (Route Mappings)**:
   เปลี่ยนค่า `template` และ `init` ของหน้ากิจกรรมของแต่ละ Role ให้เรียกใช้งานตัวแชร์กล่าวด้านบน:
   ```diff
   -    '#admin-activity': { template: AdminActivity, init: (avatar) => initAdminActivity(avatar), auth: true, allowedRoles: ['admin'] },
   +    '#admin-activity': { template: SharedActivityPage, init: (avatar) => initActivity('admin', avatar), auth: true, allowedRoles: ['admin'] },

   -    '#teacher-activity': { template: teacherActivity, init: (avatar) => initTeacherActivity(avatar), auth: true, allowedRoles: ['teacher'] },
   +    '#teacher-activity': { template: SharedActivityPage, init: (avatar) => initActivity('teacher', avatar), auth: true, allowedRoles: ['teacher'] },

   -    '#leader-activity': { template: LeaderActivity, init: (avatar) => initLeaderActivity(avatar), auth: true, allowedRoles: ['leader'] },
   +    '#leader-activity': { template: SharedActivityPage, init: (avatar) => initActivity('leader', avatar), auth: true, allowedRoles: ['leader'] },
   ```

---

## 5. การตรวจสอบความปลอดภัยเพิ่มเติม

1. **การตรวจสอบที่ส่วนติดต่อผู้ใช้ (Frontend Check)**:
   หากผู้ใช้ธรรมดาเปิด DevTools ขึ้นมาแล้วลบคำสั่ง `hidden` บนปุ่มเพิ่มกิจกรรมออกเพื่อแสดงปุ่มขึ้นมา พอกดปุ่มก็จะไม่เกิดเหตุการณ์ทำงานใดๆ เพราะฟังก์ชันไม่ได้ถูกบันทึกอีเวนต์ลิสเนอร์ (`click` event listener) ไว้กับตัวปุ่มสำหรับบทบาทนี้
2. **การตรวจสอบสิทธิ์ที่ฐานข้อมูล (Supabase RLS)**:
   ควรตรวจสอบให้แน่ใจว่าตาราง `school_activities` บน Supabase ถูกกำหนดสิทธิ์ Row Level Security (RLS) ไว้ดังนี้:
   * **SELECT (อ่านข้อมูล)**: อนุญาตให้ผู้ที่เข้าสู่ระบบทุกคนใช้งานได้ (`authenticated`)
   * **INSERT / UPDATE / DELETE (จัดการข้อมูล)**: ตรวจสอบและอนุญาตเฉพาะผู้ใช้ที่มีฟิลด์ `role` ในตาราง `profiles` เป็น `admin` หรือ `teacher` เท่านั้น โดยดึงค่าผ่าน uid ใน JWT ของสิทธิ์ใช้งาน
