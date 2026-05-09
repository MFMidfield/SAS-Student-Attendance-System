import { supabase } from "../../../lib/supabaseClient";

export function initAdminLogs(imageLogo, imageBander) {
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

    const logList = document.getElementById('schedule-list');
    const roomFilter = document.getElementById('room-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchFilter = document.getElementById('search-filter');

    let allLogsData = []; // เก็บข้อมูลทั้งหมดที่ดึงมา เพื่อให้ค้นหาได้เร็วโดยไม่ต้องดึง DB ใหม่

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

    // Note Modal Elements
    const noteModal = document.getElementById('modal-note');
    const noteModalClose = document.getElementById('btn-note-close');
    const noteStudentName = document.getElementById('note-student-name');
    const noteStudentId = document.getElementById('note-student-id');
    const noteClass = document.getElementById('note-class');
    const noteStatus = document.getElementById('note-status');
    const noteDate = document.getElementById('note-date');
    const noteContent = document.getElementById('note-content');

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

    // --- Note Modal Logic ---
    const openNoteModal = (item) => {
        if (!noteModal) return;
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
            return;
        }

        logList.innerHTML = '';
        filtered.forEach(item => {
            const cfg = getStatus(item.status);
            const date = new Date(item.created_at);
            const dateStr = date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const hasNote = item.note && item.note.trim() !== '';

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
                    <div class="px-3 py-1 text-[11px] font-bold opacity-60 italic flex items-center gap-2">
                        <span>รหัส ${item.stu_id_record || '-'}</span>
                        <span class="not-italic text-[9px] text-[#F2A00F] opacity-100">PENDING</span>
                    </div>
                </div>
                <button class="view-note-btn w-12 shrink-0 flex flex-col items-center justify-center gap-1 border-l-2 border-[#1E1E1E] ${hasNote ? 'bg-[#F2C00F]' : 'bg-white'} hover:bg-[#F2C00F] transition-colors" title="ดูหมายเหตุ">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    ${hasNote ? '<span class="text-[8px] font-black">NOTE</span>' : ''}
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

    // Event Listeners
    if (noteModalClose) noteModalClose.addEventListener('click', closeNoteModal);
    if (roomFilter) roomFilter.addEventListener('change', renderLogs); // เปลี่ยนห้องไม่ต้องดึง DB ใหม่
    if (dateFilter) dateFilter.addEventListener('change', fetchLogs); // เปลี่ยนวันที่ต้องดึง DB ใหม่
    if (searchFilter) searchFilter.addEventListener('input', renderLogs); // พิมพ์ค้นหาไม่ต้องดึง DB ใหม่ (Instant Search)
    if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#admin-dashboard'; });

    // คลิก backdrop ปิด modal
    const backdropNote = document.getElementById('backdrop-note');
    if (backdropNote) backdropNote.addEventListener('click', closeNoteModal);

    // Init
    const init = async () => {
        await checkUserPermissions();
        await fetchLogs();
    };
    init();
}