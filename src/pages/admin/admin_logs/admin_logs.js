import { supabase } from "../../../lib/supabaseClient";
import { exportToCSV } from "../../../lib/export";
import { showToast, escapeHTML } from "../../../lib/ui";

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
    let currentUserId = null;

    const logList = document.getElementById('schedule-list');
    const logsContainer = document.getElementById('logs-container');
    const roomFilter = document.getElementById('room-filter');
    const searchFilter = document.getElementById('search-filter');
    const btnExport = document.getElementById('btn-export');

    let allLogsData = [];
    let currentVerifyItem = null;
    let confirmAction = null;
    let countdownTimer = null;
    let verifyAllCountdownTimer = null;

    // Note/Detail Modal Elements
    const noteModal = document.getElementById('modal-note');
    const noteModalClose = document.getElementById('btn-note-close');
    const noteStudentName = document.getElementById('note-student-name');
    const noteStudentId = document.getElementById('note-student-id');
    const noteClass = document.getElementById('note-class');
    const noteAttendanceDate = document.getElementById('note-attendance-date');
    const noteStatus = document.getElementById('note-status');
    const noteSubject = document.getElementById('note-subject');
    const noteVerifyStatus = document.getElementById('note-verify-status');
    const noteFinalStatus = document.getElementById('note-final-status');
    const noteVerifiedBy = document.getElementById('note-verified-by');
    const noteVerifiedAt = document.getElementById('note-verified-at');
    const noteContent = document.getElementById('note-content');
    const noteTeacher = document.getElementById('note-teacher');
    const btnCancelVerify = document.getElementById('btn-cancel-verify');


    // --- Helper: Status ---
    const STATUS_CONFIG = {
        present: { label: 'PRESENT', bg: 'bg-[#73CB8F]', text: 'text-[#1E1E1E]', tag: 'PRESENT' },
        sick: { label: 'SICK LEAVE', bg: 'bg-[#E25C5C]', text: 'text-[#1E1E1E]', tag: 'SICK' },
        personal: { label: 'PERSONAL LEAVE', bg: 'bg-[#F2A00F]', text: 'text-[#1E1E1E]', tag: 'PERSONAL' },
        activity: { label: 'ACTIVITY', bg: 'bg-[#5C9EE2]', text: 'text-[#1E1E1E]', tag: 'ACTIVITY' },
        absent: { label: 'ABSENT', bg: 'bg-[#1E1E1E]', text: 'text-[#1E1E1E]', tag: 'ABSENT' },
    };


    const VERIFY_STATUS_CONFIG = {
        pending: { label: 'PENDING', bg: 'bg-gray-200', text: 'text-[#1E1E1E]' },
        approved: { label: 'APPROVED', bg: 'bg-[#73CB8F]/20', text: 'text-[#219653]' },
        rejected: { label: 'REJECTED', bg: 'bg-[#E25C5C]/20', text: 'text-[#E25C5C]' },
    };

    const getStatus = (status) => STATUS_CONFIG[status] || { label: status || 'N/A', bg: 'bg-gray-200', text: 'text-[#1E1E1E]', tag: status?.toUpperCase() || 'N/A' };
    const getVerifyStatus = (status) => VERIFY_STATUS_CONFIG[status || 'pending'];

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
    //  DETAIL MODAL LOGIC
    // ============================================================
    const openNoteModal = (item) => {
        if (!noteModal) return;
        currentVerifyItem = item;

        const cfg = getStatus(item.status);
        const vCfg = getVerifyStatus(item.verification_status);

        // Formatter for dates
        const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) : '-';


        // Student Info
        if (noteStudentName) noteStudentName.textContent = `${item.firstname_record || ''} ${item.lastname_record || ''}`.trim() || '-';
        if (noteStudentId) noteStudentId.textContent = (item.stu_id_record || '-') + ' | เลขที่: ' + (item.roll_no_record ?? '-');
        if (noteClass) noteClass.textContent = item.class_id_record || '-';
        if (noteAttendanceDate) noteAttendanceDate.textContent = item.attendance_date || '-';

        // Status Info
        if (noteStatus) {
            noteStatus.textContent = cfg.label || '-';
            noteStatus.className = `text-sm font-black uppercase ${cfg.text.split(' ')[0]}`; // Use theme color
        }

        if (noteSubject) {
            let detailText = item.subject || '-';
            if (['sick', 'personal', 'activity'].includes(item.status)) {
                const scopeNames = { 'full_day': 'All Day', 'morning': 'Morning', 'afternoon': 'Afternoon' };
                detailText = scopeNames[item.leave_scope] || 'All Day';
            }
            noteSubject.textContent = detailText;
        }

        // Verification Info
        if (noteVerifyStatus) {
            noteVerifyStatus.textContent = vCfg.label || '-';
            noteVerifyStatus.className = `text-[15px] font-black uppercase ${vCfg.text.split(' ')[0]}`;
        }

        if (noteFinalStatus) {
            const fCfg = getStatus(item.final_status);
            noteFinalStatus.textContent = fCfg.label || '-';
            noteFinalStatus.className = `text-[15px] font-black uppercase ${fCfg.text.split(' ')[0]}`;
        }

        if (noteVerifiedBy) {
            if (item.verifier) {
                noteVerifiedBy.textContent = `${item.verifier.firstname} (${item.verifier.role})`;
            } else {
                noteVerifiedBy.textContent = '-';
            }
        }

        if (noteVerifiedAt) noteVerifiedAt.textContent = formatDate(item.verified_at);

        // Notes
        if (noteContent) noteContent.textContent = item.note?.trim() || '-';
        if (noteTeacher) noteTeacher.textContent = item.teacher_note?.trim() || '-';

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

    const openDetailModal = (item) => {
        openNoteModal(item);
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
            if (confirmTitle) confirmTitle.textContent = 'Confirm Approve?';
            if (confirmDesc) confirmDesc.textContent = 'The status will be updated to "Approved"';
            if (confirmIconWrapper) confirmIconWrapper.className = 'w-16 h-16 border-3 border-[#1E1E1E] flex items-center justify-center shadow-[4px_4px_0px_#1E1E1E] bg-[#73CB8F]';
            if (confirmIconApprove) confirmIconApprove.classList.remove('hidden');
            if (confirmIconUnapprove) confirmIconUnapprove.classList.add('hidden');
            if (confirmReasonContainer) confirmReasonContainer.classList.add('hidden');
        } else {
            if (confirmTitle) confirmTitle.textContent = 'Confirm Unapprove?';
            if (confirmDesc) confirmDesc.textContent = 'The status will be updated to "Rejected"';
            if (confirmIconWrapper) confirmIconWrapper.className = 'w-16 h-16 border-3 border-[#1E1E1E] flex items-center justify-center shadow-[4px_4px_0px_#1E1E1E] bg-[#E25C5C]';
            if (confirmIconApprove) confirmIconApprove.classList.add('hidden');
            if (confirmIconUnapprove) confirmIconUnapprove.classList.remove('hidden');
            if (confirmReasonContainer) {
                confirmReasonContainer.classList.remove('hidden');
                if (confirmReasonInput) {
                    confirmReasonInput.value = '';
                    confirmReasonInput.classList.remove('border-[#E25C5C]', 'shake-animation');
                }
            }
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
            confirmContent.classList.remove('fade-out');
            confirmContent.classList.add('fade-in');
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
            confirmContent.classList.remove('fade-in');
            confirmContent.classList.add('fade-out');
            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');
            setTimeout(() => {
                confirmModal.classList.add('hidden');
                confirmContent.classList.remove('fade-out');
                confirmContent.classList.add('fade-in');
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
        if (countdownLabel) countdownLabel.textContent = 'Please review info...';

        countdownTimer = setInterval(() => {
            secondsLeft--;
            if (countdownNumber) countdownNumber.textContent = secondsLeft;
            if (countdownCircle) countdownCircle.style.strokeDashoffset = `${totalDash * ((3 - secondsLeft) / 3)}`;

            if (secondsLeft <= 0) {
                clearInterval(countdownTimer);
                countdownTimer = null;
                if (countdownLabel) countdownLabel.textContent = 'Ready!';
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

        let reason = '-';
        if (confirmAction === 'unapprove') {
            reason = confirmReasonInput ? confirmReasonInput.value.trim() : '';
            if (!reason) {
                if (confirmReasonInput) {
                    confirmReasonInput.classList.add('border-[#E25C5C]', 'shake-animation');
                    setTimeout(() => confirmReasonInput.classList.remove('shake-animation'), 500);
                }
                return;
            }
        }

        // Lock button during processing
        if (btnConfirmSubmit) {
            btnConfirmSubmit.disabled = true;
            btnConfirmSubmit.textContent = 'Processing...';
            btnConfirmSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        const item = currentVerifyItem;

        try {
            const finalStatus = (noteStatusSelect && noteStatusSelect.value !== 'none') ? noteStatusSelect.value : currentVerifyItem.status;
            const verifyStatus = confirmAction === 'approve' ? 'approved' : 'rejected';

            const { error: updateError } = await supabase
                .from('attendance_logs')
                .update({
                    final_status: finalStatus,
                    verification_status: verifyStatus,
                    teacher_note: reason,
                    verified_by: currentUserId,
                    verified_at: new Date().toISOString()
                })
                .eq('id', item.id);

            if (updateError) {
                console.error('Error updating attendance_logs:', updateError);
                alert('Error occurred during save: ' + updateError.message);
                resetSubmitButton();
                return;
            }

            // Success — close both modals & refresh
            closeConfirmModal();
            setTimeout(() => {
                closeNoteModal();
                fetchLogs(); // Refresh data
            }, 350);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('An unexpected error occurred');
            resetSubmitButton();
        }
    };

    // --- Render Logs (Apply Search & Room Filters) ---
    const renderLogs = () => {
        if (!logList) return;

        const currentRoom = roomFilter ? roomFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // 1. Filter by room
        let filtered = currentRoom === 'all'
            ? allLogsData
            : allLogsData.filter(item => item.class_id_record === currentRoom);

        // 2. Filter by search term (firstname, lastname, stu_id)
        if (searchTerm) {
            filtered = filtered.filter(item => {
                const fullName = `${item.firstname_record} ${item.lastname_record}`.toLowerCase();
                const stuId = (item.stu_id_record || '').toLowerCase();
                return fullName.includes(searchTerm) || stuId.includes(searchTerm);
            });
        }

        if (logsContainer) logsContainer.innerHTML = '';
        if (filtered.length === 0) {
            if (logsContainer) {
                logsContainer.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                    ${searchTerm ? 'No results matching your search.' : 'NO DATA FOR TODAY'}
                </div>`;
            }
            return;
        }

        filtered.forEach(item => {

            const cfg = getStatus(item.status);
            const vCfg = getVerifyStatus(item.verification_status);
            const date = new Date(item.created_at);
            const dateStr = date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
            const hasNote = item.note && item.note.trim() !== '' && item.note.trim() !== '-';

            let detailText = item.subject || 'Homeroom';
            if (['sick', 'personal', 'activity'].includes(item.status)) {
                const scopeNames = { 'full_day': 'All Day', 'morning': 'Morning', 'afternoon': 'Afternoon' };
                detailText = scopeNames[item.leave_scope] || 'All Day';
            }

            const isPending = !item.verification_status || item.verification_status === 'pending';
            const isApproved = item.verification_status === 'approved';
            const isRejected = item.verification_status === 'rejected';

            let verifierInfo = '';
            if (!isPending && item.verifier) {
                verifierInfo = `Verified by: ${escapeHTML(item.verifier.firstname)} (${escapeHTML(item.verifier.role)})`;
            }

            const row = document.createElement('div');
            row.className = 'flex border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] bg-white overflow-hidden fade-in mb-4';

            // Button Logic
            let btnClass = 'bg-white hover:bg-[#F2C00F]';

            const btnText = 'DETAIL';
            const btnDisabled = false;
            const btnIcon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />`;


            row.innerHTML = `
                <div class="w-16 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] ${cfg.bg} ${cfg.text}">
                    <span class="text-[8px] font-bold opacity-80 leading-tight">${dateStr}</span>
                    <span class="text-[9px] font-black tracking-tight mt-0.5">${cfg.tag}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold flex items-center gap-2">
                        <span>${timeStr}</span>
                        <span class="opacity-40">·</span>
                        <span>Room ${escapeHTML(item.class_id_record || '-')}</span>
                        <span class="opacity-40">·</span>
                        <span class="px-1.5 py-0.5 rounded-sm ${vCfg.bg} ${vCfg.text} text-[8px] font-black uppercase tracking-tighter">${vCfg.label}</span>
                    </div>
                    <div class="px-3 py-2 border-b-2 border-[#1E1E1E] font-bold text-sm leading-tight truncate">
                        ${escapeHTML(item.firstname_record || '')} ${escapeHTML(item.lastname_record || '')}
                    </div>
                    <div class="px-3 py-1 text-[11px] font-bold opacity-60 italic truncate">
                        ID: ${escapeHTML(item.stu_id_record || '-')} <span class="opacity-40">|</span> No: ${escapeHTML(item.roll_no_record ?? '-')} <span class="opacity-40">|</span> ${escapeHTML(detailText || 'Period')} <span class="opacity-40">|</span> ${escapeHTML(verifierInfo)}
                    </div>
                </div>
                <button class="view-btn w-12 shrink-0 flex flex-col items-center justify-center gap-1 border-l-2 border-[#1E1E1E] ${btnClass} transition-colors" title="${btnText}" ${btnDisabled ? 'disabled' : ''}>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${btnIcon}
                    </svg>
                    <span class="text-[7px] font-black">${btnText}</span>
                </button>
            `;

            const btn = row.querySelector('.view-btn');
            btn.addEventListener('click', () => openDetailModal(item));

            if (logsContainer) logsContainer.appendChild(row);
        });
    };

    // --- Fetch Attendance Logs from Database ---
    const fetchLogs = async () => {
        if (!logsContainer) return;
        logsContainer.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase.from('attendance_logs').select(`
            *,
            verifier:profiles!attendance_logs_verified_by_fkey (
                firstname,
                lastname,
                role
            )
        `);


        // Filter by Role
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

        // Update Room Filter options
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

    // Modal buttons
    if (noteModalClose) noteModalClose.addEventListener('click', closeNoteModal);
    if (btnCancelVerify) btnCancelVerify.addEventListener('click', closeNoteModal);

    // Filters
    if (roomFilter) roomFilter.addEventListener('change', renderLogs);
    if (searchFilter) searchFilter.addEventListener('input', renderLogs);
    if (btnExport) btnExport.addEventListener('click', () => handleExportExcel());
    if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#admin-dashboard'; });

    // Click backdrop to close modal
    const backdropNote = document.getElementById('backdrop-note');
    if (backdropNote) backdropNote.addEventListener('click', closeNoteModal);


    // Init
    const init = async () => {
        await checkUserPermissions();
        await fetchLogs();
    };
    init();

    // --- Export to Excel Logic ---
    const handleExportExcel = async () => {
        try {
            const originalBtnContent = btnExport.innerHTML;
            btnExport.disabled = true;
            btnExport.innerHTML = `<span class="animate-spin text-xs">🌀</span> Exporting...`;

            const { data: logs, error } = await supabase
                .from('attendance_logs')
                .select(`
                    created_at,
                    attendance_date,
                    stu_id_record,
                    roll_no_record,
                    firstname_record,
                    lastname_record,
                    class_id_record,
                    status,
                    leave_scope,
                    subject,
                    note,
                    verification_status,
                    final_status,
                    verified_at,
                    teacher_note,
                    verifier:profiles!attendance_logs_verified_by_fkey (
                        firstname,
                        lastname
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (!logs || logs.length === 0) {
                showToast('No data available for export', 'error');
                btnExport.disabled = false;
                btnExport.innerHTML = originalBtnContent;
                return;
            }

            const excelData = logs.map(log => {
                const verifierName = log.verifier ? `${log.verifier.firstname} ${log.verifier.lastname || ''}` : '-';
                const scopeNames = { 'full_day': 'All Day', 'morning': 'Morning', 'afternoon': 'Afternoon' };
                return {
                    'Timestamp': new Date(log.created_at).toLocaleString('th-TH'),
                    'Attendance Date': log.attendance_date || '-',
                    'Student ID': log.stu_id_record || '-',
                    'Roll Number': log.roll_no_record ?? '-',
                    'First Name': log.firstname_record || '-',
                    'Last Name': log.lastname_record || '-',
                    'Room': log.class_id_record || '-',
                    'Submit Status': log.status || '-',
                    'Leave Scope': scopeNames[log.leave_scope] || (log.status !== 'present' ? 'All Day' : '-'),
                    'Subject': log.subject || '-',
                    'Reason': log.note || '-',
                    'Verify Status': log.verification_status || 'pending',
                    'Final Status': log.final_status || '-',
                    'Verified By': verifierName,
                    'Verifier Note': log.teacher_note || '-'
                };
            });

            // Call CSV Library
            exportToCSV(excelData, `Attendance_Logs`);

            showToast('CSV export successful', 'success');

            btnExport.disabled = false;
            btnExport.innerHTML = originalBtnContent;
        } catch (err) {
            console.error('Export Error:', err);
            showToast('Export failed', 'error');
            btnExport.disabled = false;
            btnExport.innerHTML = originalBtnContent;
        }
    };

}