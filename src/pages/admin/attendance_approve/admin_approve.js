import { supabase } from "../../../lib/supabaseClient";

export function initAdminApprove(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');
    const studentImage = document.getElementById('student-image');
    const banderImage = document.getElementById('bander-image');
    const studentNameElem = document.getElementById('student-name');

    // Fetch admin name from metadata
    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata && studentNameElem) {
            const { firstname, lastname } = user.user_metadata;
            studentNameElem.textContent = `${firstname} ${lastname}`;
        }
    };
    fetchUserName();

    if (studentImage && imageLogo) studentImage.src = imageLogo;
    if (banderImage && imageBander) banderImage.src = imageBander;

    let userRole = 'student';
    let userClassId = null;
    let currentUserId = null;

    const logList = document.getElementById('schedule-list');
    const roomFilter = document.getElementById('room-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchFilter = document.getElementById('search-filter');

    let allLogsData = []; // เก็บข้อมูลทั้งหมดที่ดึงมา เพื่อให้ค้นหาได้เร็วโดยไม่ต้องดึง DB ใหม่
    let currentVerifyItem = null; // เก็บ item ที่กำลัง verify อยู่
    let confirmAction = null; // 'approve' | 'unapprove'
    let countdownTimer = null;
    let verifyAllCountdownTimer = null;

    // --- Setup Date Filter ---
    const setupDateFilter = () => {
        if (!dateFilter) return;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        dateFilter.min = "2026-05-01";
        dateFilter.max = todayStr;
        dateFilter.value = todayStr; // Default เป็นวันปัจจุบัน
    };
    setupDateFilter();

    // Note/Verify Modal Elements
    const noteModal = document.getElementById('modal-note');
    const noteModalClose = document.getElementById('btn-note-close');
    const noteStudentName = document.getElementById('note-student-name');
    const noteStudentId = document.getElementById('note-student-id');
    const noteClass = document.getElementById('note-class');
    const noteStatus = document.getElementById('note-status');
    const noteDate = document.getElementById('note-date');
    const noteContent = document.getElementById('note-content');
    const btnApprove = document.getElementById('btn-approve');
    const btnUnapprove = document.getElementById('btn-unapprove');
    const btnCancelVerify = document.getElementById('btn-cancel-verify');
    const btnVerifyAll = document.getElementById('btn-verify-all');

    // Confirmation Modal Elements
    const confirmModal = document.getElementById('modal-confirm');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmDesc = document.getElementById('confirm-desc');
    const confirmStudentName = document.getElementById('confirm-student-name');
    const confirmIconWrapper = document.getElementById('confirm-icon-wrapper');
    const confirmIconApprove = document.getElementById('confirm-icon-approve');
    const confirmIconUnapprove = document.getElementById('confirm-icon-unapprove');
    const countdownCircle = document.getElementById('countdown-circle');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownLabel = document.getElementById('countdown-label');
    const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');

    // Verify All Modal Elements
    const verifyAllModal = document.getElementById('modal-verify-all');
    const verifyAllList = document.getElementById('verify-all-list');
    const verifyAllCount = document.getElementById('verify-all-count');
    const verifyAllCountdownCircle = document.getElementById('verify-all-countdown-circle');
    const verifyAllCountdownNumber = document.getElementById('verify-all-countdown-number');
    const verifyAllCountdownLabel = document.getElementById('verify-all-countdown-label');
    const btnVerifyAllSubmit = document.getElementById('btn-verify-all-submit');
    const btnVerifyAllCancel = document.getElementById('btn-verify-all-cancel');
    const btnVerifyAllClose = document.getElementById('btn-verify-all-close');

    // --- Helper: Status ---
    const STATUS_CONFIG = {
        present:  { label: 'มาเรียน',  bg: 'bg-[#73CB8F]', text: 'text-[#1E1E1E]', tag: 'PRESENT'  },
        sick:     { label: 'ลาป่วย',   bg: 'bg-[#E25C5C]', text: 'text-white',      tag: 'SICK'     },
        personal: { label: 'ลากิจ',    bg: 'bg-[#F2A00F]', text: 'text-[#1E1E1E]', tag: 'PERSONAL' },
        activity: { label: 'กิจกรรม', bg: 'bg-[#5C9EE2]', text: 'text-white',      tag: 'ACTIVITY' },
    };

    const getStatus = (status) => STATUS_CONFIG[status] || { label: status || 'N/A', bg: 'bg-gray-200', text: 'text-[#1E1E1E]', tag: status?.toUpperCase() || 'N/A' };

    // --- Check Role & Permissions ---
    const checkUserPermissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        currentUserId = user.id;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, class_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            userRole = profile.role;
            userClassId = profile.class_id;
        }
    };

    // ============================================================
    //  VERIFY MODAL LOGIC
    // ============================================================
    const openNoteModal = (item) => {
        if (!noteModal) return;
        currentVerifyItem = item;
        const cfg = getStatus(item.status);
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleDateString('th-TH', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        if (noteStudentName) noteStudentName.textContent = `${item.firstname_record || ''} ${item.lastname_record || ''}`.trim() || '-';
        if (noteStudentId) noteStudentId.textContent = item.stu_id_record || '-';
        if (noteClass) noteClass.textContent = item.class_id_record || '-';
        if (noteDate) noteDate.textContent = dateStr;
        if (document.getElementById('note-subject')) document.getElementById('note-subject').textContent = item.subject || '-';
        if (noteContent) noteContent.textContent = item.note?.trim() || '(ไม่มีหมายเหตุ)';

        if (noteStatus) {
            noteStatus.textContent = cfg.label;
            noteStatus.className = `inline-block px-4 py-1 border-2 border-[#1E1E1E] text-sm font-bold uppercase shadow-[2px_2px_0px_#1E1E1E] ${cfg.bg} ${cfg.text}`;
        }

        const backdrop = document.getElementById('backdrop-note');
        const modalContent = noteModal.querySelector('.modal-content');
        noteModal.classList.remove('hidden');
        if (modalContent) {
            modalContent.classList.remove('fade-out');
            modalContent.classList.add('fade-in');
        }
        if (backdrop) {
            backdrop.classList.remove('backdrop-fade-out');
            backdrop.classList.add('backdrop-fade-in');
        }
    };

    const closeNoteModal = () => {
        if (!noteModal) return;
        currentVerifyItem = null;
        const modalContent = noteModal.querySelector('.modal-content');
        const backdrop = document.getElementById('backdrop-note');
        if (modalContent && backdrop) {
            modalContent.classList.remove('fade-in');
            modalContent.classList.add('fade-out');
            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');
            setTimeout(() => {
                noteModal.classList.add('hidden');
                modalContent.classList.remove('fade-out');
                modalContent.classList.add('fade-in');
                backdrop.classList.remove('backdrop-fade-out');
            }, 400);
        } else {
            noteModal.classList.add('hidden');
        }
    };

    // ============================================================
    //  CONFIRMATION MODAL LOGIC (nested on top of verify modal)
    // ============================================================
    const openConfirmModal = (action) => {
        if (!confirmModal || !currentVerifyItem) return;
        confirmAction = action;

        const studentFullName = `${currentVerifyItem.firstname_record || ''} ${currentVerifyItem.lastname_record || ''}`.trim() || '-';

        if (action === 'approve') {
            if (confirmTitle) confirmTitle.textContent = 'ยืนยัน Approve?';
            if (confirmDesc) confirmDesc.textContent = 'ข้อมูลจะถูกบันทึกและลบออกจาก Logs';
            if (confirmIconWrapper) confirmIconWrapper.className = 'w-16 h-16 border-3 border-[#1E1E1E] flex items-center justify-center shadow-[4px_4px_0px_#1E1E1E] bg-[#73CB8F]';
            if (confirmIconApprove) confirmIconApprove.classList.remove('hidden');
            if (confirmIconUnapprove) confirmIconUnapprove.classList.add('hidden');
        } else {
            if (confirmTitle) confirmTitle.textContent = 'ยืนยัน Unapprove?';
            if (confirmDesc) confirmDesc.textContent = 'ข้อมูลจะถูกลบออกจากระบบโดยไม่บันทึก';
            if (confirmIconWrapper) confirmIconWrapper.className = 'w-16 h-16 border-3 border-[#1E1E1E] flex items-center justify-center shadow-[4px_4px_0px_#1E1E1E] bg-[#E25C5C]';
            if (confirmIconApprove) confirmIconApprove.classList.add('hidden');
            if (confirmIconUnapprove) confirmIconUnapprove.classList.remove('hidden');
        }

        if (confirmStudentName) confirmStudentName.textContent = studentFullName;

        // Reset submit button to disabled
        if (btnConfirmSubmit) {
            btnConfirmSubmit.disabled = true;
            btnConfirmSubmit.textContent = 'Submit';
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        // Show modal
        const confirmContent = confirmModal.querySelector('.confirm-content');
        const backdrop = document.getElementById('backdrop-confirm');
        confirmModal.classList.remove('hidden');
        if (confirmContent) {
            confirmContent.classList.remove('scale-out');
            confirmContent.classList.add('scale-in');
        }
        if (backdrop) {
            backdrop.classList.remove('backdrop-fade-out');
            backdrop.classList.add('backdrop-fade-in');
        }

        // Start countdown
        startCountdown();
    };

    const closeConfirmModal = () => {
        if (!confirmModal) return;
        confirmAction = null;
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }

        const confirmContent = confirmModal.querySelector('.confirm-content');
        const backdrop = document.getElementById('backdrop-confirm');
        if (confirmContent && backdrop) {
            confirmContent.classList.remove('scale-in');
            confirmContent.classList.add('scale-out');
            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');
            setTimeout(() => {
                confirmModal.classList.add('hidden');
                confirmContent.classList.remove('scale-out');
                confirmContent.classList.add('scale-in');
                backdrop.classList.remove('backdrop-fade-out');
            }, 300);
        } else {
            confirmModal.classList.add('hidden');
        }
    };

    const startCountdown = () => {
        let secondsLeft = 3;
        const totalDash = 97.39; // circumference of r=15.5

        // Reset ring
        if (countdownCircle) countdownCircle.style.strokeDashoffset = '0';
        if (countdownNumber) countdownNumber.textContent = '3';
        if (countdownLabel) countdownLabel.textContent = 'กรุณารอ...';

        countdownTimer = setInterval(() => {
            secondsLeft--;
            if (countdownNumber) countdownNumber.textContent = secondsLeft;
            if (countdownCircle) countdownCircle.style.strokeDashoffset = `${totalDash * ((3 - secondsLeft) / 3)}`;

            if (secondsLeft <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (countdownLabel) countdownLabel.textContent = 'พร้อมแล้ว!';
                if (countdownNumber) countdownNumber.textContent = '✓';
                unlockSubmitButton();
            }
        }, 1000);
    };

    const unlockSubmitButton = () => {
        if (!btnConfirmSubmit) return;
        btnConfirmSubmit.disabled = false;

        if (confirmAction === 'approve') {
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
        } else {
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#E25C5C] text-white hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
        }
    };

    // ============================================================
    //  SUBMIT ACTIONS (Approve / Unapprove)
    // ============================================================
    const handleConfirmSubmit = async () => {
        if (!currentVerifyItem || !confirmAction) return;

        // Lock button during processing
        if (btnConfirmSubmit) {
            btnConfirmSubmit.disabled = true;
            btnConfirmSubmit.textContent = 'Processing...';
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        const item = currentVerifyItem;

        try {
            if (confirmAction === 'approve') {
                // 1. Insert into attendance_verify
                const { error: insertError } = await supabase
                    .from('attendance_verify')
                    .insert({
                        student_id: item.student_id,
                        stu_id_record: item.stu_id_record,
                        firstname_record: item.firstname_record,
                        lastname_record: item.lastname_record,
                        class_id_record: item.class_id_record,
                        status: item.status,
                        note: item.note || '-',
                        subject: item.subject || null,
                        is_verified: true,
                        verified_by: currentUserId,
                        verified_at: new Date().toISOString(),
                    });

                if (insertError) {
                    console.error('Error inserting to attendance_verify:', insertError);
                    alert('เกิดข้อผิดพลาดในการบันทึก: ' + insertError.message);
                    resetSubmitButton();
                    return;
                }

                // 2. Delete from attendance_logs
                const { error: deleteError } = await supabase
                    .from('attendance_logs')
                    .delete()
                    .eq('id', item.id);

                if (deleteError) {
                    console.error('Error deleting from attendance_logs:', deleteError);
                    alert('บันทึกสำเร็จแต่ลบข้อมูลเดิมไม่ได้: ' + deleteError.message);
                }

            } else if (confirmAction === 'unapprove') {
                // Delete from attendance_logs only
                const { error: deleteError } = await supabase
                    .from('attendance_logs')
                    .delete()
                    .eq('id', item.id);

                if (deleteError) {
                    console.error('Error deleting from attendance_logs:', deleteError);
                    alert('เกิดข้อผิดพลาดในการลบ: ' + deleteError.message);
                    resetSubmitButton();
                    return;
                }
            }

            // Success — close both modals & refresh
            closeConfirmModal();
            setTimeout(() => {
                closeNoteModal();
                fetchLogs(); // รีเฟรชข้อมูล
            }, 350);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
            resetSubmitButton();
        }
    };

    const resetSubmitButton = () => {
        if (!btnConfirmSubmit) return;
        btnConfirmSubmit.disabled = false;
        btnConfirmSubmit.textContent = 'Submit';
        if (confirmAction === 'approve') {
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
        } else {
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#E25C5C] text-white hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
        }
    };

    // --- Render Logs (Apply Search & Room Filters) ---
    const renderLogs = () => {
        if (!logList) return;

        const currentRoom = roomFilter ? roomFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // 1. กรองตามห้อง
        let filtered = currentRoom === 'all' 
            ? allLogsData 
            : allLogsData.filter(item => item.class_id_record === currentRoom);

        // 2. กรองตามคำค้นหา (ชื่อ, นามสกุล, รหัส)
        if (searchTerm) {
            filtered = filtered.filter(item => {
                const fullName = `${item.firstname_record} ${item.lastname_record}`.toLowerCase();
                const stuId = (item.stu_id_record || '').toLowerCase();
                return fullName.includes(searchTerm) || stuId.includes(searchTerm);
            });
        }

        if (filtered.length === 0) {
            logList.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                ${searchTerm ? 'No results matching your search.' : 'No attendance logs found.'}
            </div>`;
            // Hide verify all button when no data
            if (btnVerifyAll) btnVerifyAll.classList.add('hidden');
            return;
        }

        // Show verify all button when there are items
        if (btnVerifyAll && filtered.length > 0) {
            btnVerifyAll.classList.remove('hidden');
            btnVerifyAll.textContent = `✓ Verify All (${filtered.length})`;
        }

        logList.innerHTML = '';
        filtered.forEach(item => {
            const cfg = getStatus(item.status);
            const date = new Date(item.created_at);
            const dateStr = date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const hasNote = item.note && item.note.trim() !== '' && item.note.trim() !== '-';

            const row = document.createElement('div');
            row.className = 'flex border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] bg-white overflow-hidden fade-in mb-4';

            row.innerHTML = `
                <div class="w-16 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] ${cfg.bg} ${cfg.text}">
                    <span class="text-[8px] font-bold opacity-80 leading-tight">${dateStr}</span>
                    <span class="text-[9px] font-black tracking-tight mt-0.5">${cfg.tag}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold flex items-center gap-2">
                        <span>${timeStr}</span>
                        <span class="opacity-40">·</span>
                        <span>ห้อง ${item.class_id_record || '-'}</span>
                        <span class="opacity-40">·</span>
                        <span class="text-[#219653]">วิชา ${item.subject || '-'}</span>
                    </div>
                    <div class="px-3 py-2 border-b-2 border-[#1E1E1E] font-bold text-sm leading-tight truncate">
                        ${item.firstname_record || ''} ${item.lastname_record || ''}
                    </div>
                    <div class="px-3 py-1 text-[11px] font-bold opacity-60 italic">
                        รหัส ${item.stu_id_record || '-'}
                    </div>
                </div>
                <button class="view-note-btn w-12 shrink-0 flex flex-col items-center justify-center gap-1 border-l-2 border-[#1E1E1E] ${hasNote ? 'bg-[#F2C00F]' : 'bg-white'} hover:bg-[#5C9EE2] hover:text-white transition-colors" title="ตรวจสอบ">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                    <span class="text-[7px] font-black">VERIFY</span>
                </button>
            `;

            row.querySelector('.view-note-btn').addEventListener('click', () => openNoteModal(item));
            logList.appendChild(row);
        });
    };

    // --- Fetch Attendance Logs from Database ---
    const fetchLogs = async () => {
        if (!logList) return;
        logList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase.from('attendance_logs').select('*');

        // กรองตามวันที่
        if (dateFilter && dateFilter.value) {
            const selectedDate = dateFilter.value;
            query = query
                .gte('created_at', `${selectedDate}T00:00:00.000Z`)
                .lte('created_at', `${selectedDate}T23:59:59.999Z`);
        }

        // กรองตาม Role
        if (userRole === 'student' && userClassId) {
            query = query.eq('class_id_record', userClassId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error("Supabase Error:", error);
            logList.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">Error loading data</div>';
            return;
        }

        allLogsData = data || [];

        // อัปเดตตัวเลือกใน Room Filter
        if (roomFilter && (userRole === 'admin' || userRole === 'teacher')) {
            roomFilter.classList.remove('hidden');
            const currentRoom = roomFilter.value || 'all';
            const rooms = [...new Set(allLogsData.map(item => item.class_id_record))].filter(Boolean).sort();
            roomFilter.innerHTML = '<option value="all">ALL ROOMS</option>';
            rooms.forEach(room => {
                const opt = document.createElement('option');
                opt.value = room;
                opt.textContent = `ROOM ${room}`;
                roomFilter.appendChild(opt);
            });
            roomFilter.value = currentRoom;
        }

        renderLogs();
    };

    // ============================================================
    //  EVENT LISTENERS
    // ============================================================

    // Verify Modal buttons
    if (noteModalClose) noteModalClose.addEventListener('click', closeNoteModal);
    if (btnCancelVerify) btnCancelVerify.addEventListener('click', closeNoteModal);
    if (btnApprove) btnApprove.addEventListener('click', () => openConfirmModal('approve'));
    if (btnUnapprove) btnUnapprove.addEventListener('click', () => openConfirmModal('unapprove'));

    // Confirmation Modal buttons
    if (btnConfirmSubmit) btnConfirmSubmit.addEventListener('click', handleConfirmSubmit);
    if (btnConfirmCancel) btnConfirmCancel.addEventListener('click', closeConfirmModal);

    // Filters
    if (roomFilter) roomFilter.addEventListener('change', renderLogs); // เปลี่ยนห้องไม่ต้องดึง DB ใหม่
    if (dateFilter) dateFilter.addEventListener('change', fetchLogs); // เปลี่ยนวันที่ต้องดึง DB ใหม่
    if (searchFilter) searchFilter.addEventListener('input', renderLogs); // พิมพ์ค้นหาไม่ต้องดึง DB ใหม่ (Instant Search)
    if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#admin-dashboard'; });

    // คลิก backdrop ปิด modal
    const backdropNote = document.getElementById('backdrop-note');
    if (backdropNote) backdropNote.addEventListener('click', closeNoteModal);

    // Verify All button & modal
    if (btnVerifyAll) btnVerifyAll.addEventListener('click', openVerifyAllModal);
    if (btnVerifyAllClose) btnVerifyAllClose.addEventListener('click', closeVerifyAllModal);
    if (btnVerifyAllCancel) btnVerifyAllCancel.addEventListener('click', closeVerifyAllModal);
    if (btnVerifyAllSubmit) btnVerifyAllSubmit.addEventListener('click', handleVerifyAllSubmit);

    // Init
    const init = async () => {
        await checkUserPermissions();
        await fetchLogs();
    };
    init();

    // ============================================================
    //  VERIFY ALL MODAL LOGIC
    // ============================================================

    // ดึงรายการที่กรองแล้ว (ตาม room + search)
    function getFilteredLogs() {
        const currentRoom = roomFilter ? roomFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        let filtered = currentRoom === 'all'
            ? allLogsData
            : allLogsData.filter(item => item.class_id_record === currentRoom);

        if (searchTerm) {
            filtered = filtered.filter(item => {
                const fullName = `${item.firstname_record} ${item.lastname_record}`.toLowerCase();
                const stuId = (item.stu_id_record || '').toLowerCase();
                return fullName.includes(searchTerm) || stuId.includes(searchTerm);
            });
        }
        return filtered;
    }

    function openVerifyAllModal() {
        if (!verifyAllModal) return;
        const items = getFilteredLogs();
        if (items.length === 0) return;

        // Update count
        if (verifyAllCount) verifyAllCount.textContent = `${items.length} รายการ`;

        // Populate student list
        if (verifyAllList) {
            verifyAllList.innerHTML = '';
            items.forEach((item, idx) => {
                const cfg = getStatus(item.status);
                const row = document.createElement('div');
                row.className = 'flex items-center gap-2 py-2 border-b border-[#1E1E1E]/10 last:border-0';
                row.innerHTML = `
                    <span class="w-6 h-6 shrink-0 flex items-center justify-center border-2 border-[#1E1E1E] text-[10px] font-black bg-[#EEEDDE]">${idx + 1}</span>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black truncate">${item.firstname_record || ''} ${item.lastname_record || ''}</p>
                        <p class="text-[9px] font-bold opacity-50">รหัส ${item.stu_id_record || '-'} · ห้อง ${item.class_id_record || '-'}</p>
                    </div>
                    <span class="shrink-0 px-2 py-0.5 border border-[#1E1E1E] text-[8px] font-black uppercase ${cfg.bg} ${cfg.text}">${cfg.tag}</span>
                `;
                verifyAllList.appendChild(row);
            });
        }

        // Reset submit button
        if (btnVerifyAllSubmit) {
            btnVerifyAllSubmit.disabled = true;
            btnVerifyAllSubmit.textContent = 'Approve All';
            btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        // Show modal
        const content = verifyAllModal.querySelector('.verify-all-content');
        const backdrop = document.getElementById('backdrop-verify-all');
        verifyAllModal.classList.remove('hidden');
        if (content) {
            content.classList.remove('scale-out');
            content.classList.add('scale-in');
        }
        if (backdrop) {
            backdrop.classList.remove('backdrop-fade-out');
            backdrop.classList.add('backdrop-fade-in');
        }

        // Start countdown
        startVerifyAllCountdown();
    }

    function closeVerifyAllModal() {
        if (!verifyAllModal) return;
        if (verifyAllCountdownTimer) {
            clearInterval(verifyAllCountdownTimer);
            verifyAllCountdownTimer = null;
        }

        const content = verifyAllModal.querySelector('.verify-all-content');
        const backdrop = document.getElementById('backdrop-verify-all');
        if (content && backdrop) {
            content.classList.remove('scale-in');
            content.classList.add('scale-out');
            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');
            setTimeout(() => {
                verifyAllModal.classList.add('hidden');
                content.classList.remove('scale-out');
                content.classList.add('scale-in');
                backdrop.classList.remove('backdrop-fade-out');
            }, 300);
        } else {
            verifyAllModal.classList.add('hidden');
        }
    }

    function startVerifyAllCountdown() {
        let secondsLeft = 5;
        const totalDash = 97.39;

        if (verifyAllCountdownCircle) verifyAllCountdownCircle.style.strokeDashoffset = '0';
        if (verifyAllCountdownNumber) verifyAllCountdownNumber.textContent = '5';
        if (verifyAllCountdownLabel) verifyAllCountdownLabel.textContent = 'กรุณารอ...';

        verifyAllCountdownTimer = setInterval(() => {
            secondsLeft--;
            if (verifyAllCountdownNumber) verifyAllCountdownNumber.textContent = secondsLeft;
            if (verifyAllCountdownCircle) verifyAllCountdownCircle.style.strokeDashoffset = `${totalDash * ((5 - secondsLeft) / 5)}`;

            if (secondsLeft <= 0) {
                clearInterval(verifyAllCountdownTimer);
                verifyAllCountdownTimer = null;
                if (verifyAllCountdownLabel) verifyAllCountdownLabel.textContent = 'พร้อมแล้ว!';
                if (verifyAllCountdownNumber) verifyAllCountdownNumber.textContent = '✓';
                // Unlock button
                if (btnVerifyAllSubmit) {
                    btnVerifyAllSubmit.disabled = false;
                    btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
                }
            }
        }, 1000);
    }

    async function handleVerifyAllSubmit() {
        const items = getFilteredLogs();
        if (items.length === 0) return;

        // Lock button
        if (btnVerifyAllSubmit) {
            btnVerifyAllSubmit.disabled = true;
            btnVerifyAllSubmit.textContent = 'Processing...';
            btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        try {
            // 1. Batch insert into attendance_verify
            const verifyRows = items.map(item => ({
                student_id: item.student_id,
                stu_id_record: item.stu_id_record,
                firstname_record: item.firstname_record,
                lastname_record: item.lastname_record,
                class_id_record: item.class_id_record,
                status: item.status,
                note: item.note || '-',
                subject: item.subject || null,
                is_verified: true,
                verified_by: currentUserId,
                verified_at: new Date().toISOString(),
            }));

            const { error: insertError } = await supabase
                .from('attendance_verify')
                .insert(verifyRows);

            if (insertError) {
                console.error('Batch insert error:', insertError);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + insertError.message);
                if (btnVerifyAllSubmit) {
                    btnVerifyAllSubmit.disabled = false;
                    btnVerifyAllSubmit.textContent = 'Approve All';
                    btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
                }
                return;
            }

            // 2. Batch delete from attendance_logs
            const ids = items.map(item => item.id);
            const { error: deleteError } = await supabase
                .from('attendance_logs')
                .delete()
                .in('id', ids);

            if (deleteError) {
                console.error('Batch delete error:', deleteError);
                alert('บันทึกสำเร็จแต่ลบข้อมูลเดิมไม่ได้: ' + deleteError.message);
            }

            // Success
            closeVerifyAllModal();
            setTimeout(() => {
                fetchLogs();
            }, 350);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('เกิดข้อผิดพลาดที่ไม่คาดคิด');
            if (btnVerifyAllSubmit) {
                btnVerifyAllSubmit.disabled = false;
                btnVerifyAllSubmit.textContent = 'Approve All';
                btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
            }
        }
    }
}