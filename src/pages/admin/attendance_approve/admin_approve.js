import { supabase } from "../../../lib/supabaseClient";
import { escapeHTML } from "../../../lib/ui";

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
    const logsContainer = document.getElementById('logs-container');
    const roomFilter = document.getElementById('room-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchFilter = document.getElementById('search-filter');

    let allLogsData = []; // Store all fetched logs to enable fast local search
    let currentVerifyItem = null; // Store the item currently being verified
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
        dateFilter.value = todayStr; // Default to current date
    };
    setupDateFilter();

    // Note/Verify Modal Elements
    const noteModal = document.getElementById('modal-note');
    const noteModalClose = document.getElementById('btn-note-close');
    const noteStudentName = document.getElementById('note-student-name');
    const noteStudentId = document.getElementById('note-student-id');
    const noteClass = document.getElementById('note-class');
    const noteStatusSelect = document.getElementById('note-status-select');
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
    const confirmReasonContainer = document.getElementById('confirm-reason-container');
    const confirmReasonInput = document.getElementById('confirm-reason-input');
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

    // Reject Detail Modal Elements
    const rejectDetailModal = document.getElementById('modal-reject-detail');
    const rejectReasonText = document.getElementById('reject-reason-text');
    const rejectVerifierName = document.getElementById('reject-verifier-name');
    const rejectVerifierRole = document.getElementById('reject-verifier-role');
    const rejectVerifyTime = document.getElementById('reject-verify-time');
    const btnRejectDetailClose = document.getElementById('btn-reject-detail-close');
    const btnRejectDetailConfirm = document.getElementById('btn-reject-detail-confirm');

    // --- Helper: Status ---
    const STATUS_CONFIG = {
        present:  { label: 'PRESENT',  bg: 'bg-[#73CB8F]', text: 'text-[#1E1E1E]', tag: 'PRESENT'  },
        sick:     { label: 'SICK',     bg: 'bg-[#E25C5C]', text: 'text-white',      tag: 'SICK'     },
        personal: { label: 'PERSONAL', bg: 'bg-[#F2A00F]', text: 'text-[#1E1E1E]', tag: 'PERSONAL' },
        activity: { label: 'ACTIVITY', bg: 'bg-[#5C9EE2]', text: 'text-white',      tag: 'ACTIVITY' },
        absent:   { label: 'ABSENT',   bg: 'bg-[#1E1E1E]', text: 'text-white',      tag: 'ABSENT'   },
    };

    const VERIFY_STATUS_CONFIG = {
        pending:  { label: 'PENDING', bg: 'bg-gray-200', text: 'text-[#1E1E1E]' },
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
        if (document.getElementById('note-subject')) {
            let detailText = item.subject || '-';
            if (['sick', 'personal', 'activity'].includes(item.status)) {
                const scopeNames = { 'full_day': 'All Day', 'morning': 'Morning', 'afternoon': 'Afternoon' };
                detailText = scopeNames[item.leave_scope] || 'All Day';
            }
            document.getElementById('note-subject').textContent = detailText;
        }
        if (noteContent) noteContent.textContent = item.note?.trim() || '(No remarks)';

        if (noteStatusSelect) {
            noteStatusSelect.value = item.status ? item.status.toLowerCase() : 'none';
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

        const pendingCount = filtered.filter(item => !item.verification_status || item.verification_status === 'pending').length;
        const verifyAllContainer = document.getElementById('verify-all-container');

        if (logsContainer) logsContainer.innerHTML = '';

        if (filtered.length === 0) {
            if (logsContainer) {
                logsContainer.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                    ${searchTerm ? 'No results matching your search.' : 'NO DATA FOR TODAY'}
                </div>`;
            }
            if (verifyAllContainer) verifyAllContainer.classList.add('hidden');
            return; // Stop if no data
        } else {
            if (verifyAllContainer) {
                if (pendingCount > 0) {
                    verifyAllContainer.classList.remove('hidden');
                    if (btnVerifyAll) btnVerifyAll.textContent = `✓ Verify All Pending (${pendingCount})`;
                } else {
                    verifyAllContainer.classList.add('hidden');
                }
            }
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
                verifierInfo = ` <span class="opacity-40 mx-1">|</span> Verified by: ${item.verifier.firstname} (${item.verifier.role})`;
            }

            const row = document.createElement('div');
            row.className = 'flex border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] bg-white overflow-hidden fade-in mb-4';

            // Button Logic
            let btnClass = '';
            let btnText = 'VERIFY';
            let btnDisabled = false;
            let btnIcon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>`;

            if (isPending) {
                btnClass = hasNote ? 'bg-[#F2C00F]' : 'bg-white';
                btnClass += ' hover:bg-[#5C9EE2] hover:text-white';
            } else if (isApproved) {
                btnClass = 'bg-[#5C9EE2] text-white cursor-not-allowed opacity-70'; // Blue-White
                btnDisabled = true;
            } else if (isRejected) {
                btnClass = 'bg-[#E25C5C] text-white hover:bg-[#C54B4B]';
                btnText = 'DETAIL';
                btnIcon = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
            }

            row.innerHTML = `
                <div class="w-16 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] ${cfg.bg} ${cfg.text}">
                    <span class="text-[8px] font-bold opacity-80 leading-tight">${dateStr}</span>
                    <span class="text-[9px] font-black tracking-tight mt-0.5">${cfg.tag}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold flex items-center gap-2">
                        <span>${timeStr}</span>
                        <span class="opacity-40">·</span>
                        <span>Room ${item.class_id_record || '-'}</span>
                        <span class="opacity-40">·</span>
                        <span class="px-1.5 py-0.5 rounded-sm ${vCfg.bg} ${vCfg.text} text-[8px] font-black uppercase tracking-tighter">${vCfg.label}</span>
                    </div>
                    <div class="px-3 py-2 border-b-2 border-[#1E1E1E] font-bold text-sm leading-tight truncate">
                        ${escapeHTML(item.firstname_record || '')} ${escapeHTML(item.lastname_record || '')}
                    </div>
                    <div class="px-3 py-1 text-[11px] font-bold opacity-60 italic truncate">
                        ID: ${escapeHTML(item.stu_id_record || '-')} <span class="opacity-40">|</span> ${escapeHTML(detailText)}${escapeHTML(verifierInfo)}
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
            if (isPending) {
                btn.addEventListener('click', () => openNoteModal(item));
            } else if (isRejected) {
                btn.addEventListener('click', () => openRejectModal(item));
            }
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

        // Filter by date
        if (dateFilter && dateFilter.value) {
            const selectedDate = dateFilter.value;
            query = query
                .gte('created_at', `${selectedDate}T00:00:00.000Z`)
                .lte('created_at', `${selectedDate}T23:59:59.999Z`);
        }

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
    if (roomFilter) roomFilter.addEventListener('change', renderLogs); // Room change doesn't require new DB fetch
    if (dateFilter) dateFilter.addEventListener('change', fetchLogs); // Date change requires new DB fetch
    if (searchFilter) searchFilter.addEventListener('input', renderLogs); // Instant Search
    if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = '#admin-dashboard'; });

    // Click backdrop to close modal
    const backdropNote = document.getElementById('backdrop-note');
    if (backdropNote) backdropNote.addEventListener('click', closeNoteModal);

    // Verify All button & modal
    if (btnVerifyAll) btnVerifyAll.addEventListener('click', openVerifyAllModal);
    if (btnVerifyAllClose) btnVerifyAllClose.addEventListener('click', closeVerifyAllModal);
    if (btnVerifyAllCancel) btnVerifyAllCancel.addEventListener('click', closeVerifyAllModal);
    if (btnVerifyAllSubmit) btnVerifyAllSubmit.addEventListener('click', handleVerifyAllSubmit);

    // Reject Detail Modal handlers
    const closeRejectModal = () => {
        if (!rejectDetailModal) return;
        const modalContent = rejectDetailModal.querySelector('.modal-content');
        const backdrop = document.getElementById('backdrop-reject-detail');
        if (modalContent && backdrop) {
            modalContent.classList.replace('fade-in', 'fade-out');
            backdrop.classList.replace('backdrop-fade-in', 'backdrop-fade-out');
            setTimeout(() => {
                rejectDetailModal.classList.add('hidden');
                modalContent.classList.replace('fade-out', 'fade-in');
                backdrop.classList.replace('backdrop-fade-out', 'backdrop-fade-in');
            }, 400);
        } else {
            rejectDetailModal.classList.add('hidden');
        }
    };

    const openRejectModal = (item) => {
        if (!rejectDetailModal) return;
        
        if (rejectReasonText) rejectReasonText.textContent = item.teacher_note || '(No reason provided)';
        if (rejectVerifierName && item.verifier) {
            rejectVerifierName.textContent = `${item.verifier.firstname} ${item.verifier.lastname || ''}`.trim();
        }
        if (rejectVerifierRole && item.verifier) {
            rejectVerifierRole.textContent = item.verifier.role || 'STAFF';
        }
        
        if (rejectVerifyTime && item.verified_at) {
            const vTime = new Date(item.verified_at);
            rejectVerifyTime.textContent = vTime.toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric', 
                hour: '2-digit', minute: '2-digit' 
            });
        }

        const backdrop = document.getElementById('backdrop-reject-detail');
        const modalContent = rejectDetailModal.querySelector('.modal-content');
        rejectDetailModal.classList.remove('hidden');
        if (modalContent) modalContent.classList.add('fade-in');
        if (backdrop) backdrop.classList.add('backdrop-fade-in');
    };

    if (btnRejectDetailClose) btnRejectDetailClose.addEventListener('click', closeRejectModal);
    if (btnRejectDetailConfirm) btnRejectDetailConfirm.addEventListener('click', closeRejectModal);
    const backdropReject = document.getElementById('backdrop-reject-detail');
    if (backdropReject) backdropReject.addEventListener('click', closeRejectModal);

    // Init
    const init = async () => {
        await checkUserPermissions();
        await fetchLogs();
    };
    init();

    // ============================================================
    //  VERIFY ALL MODAL LOGIC
    // ============================================================

    // Get filtered logs (by room + search)
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
        const items = getFilteredLogs().filter(item => !item.verification_status || item.verification_status === 'pending');
        if (items.length === 0) return;

        // Update count
        if (verifyAllCount) verifyAllCount.textContent = `${items.length} items`;

        // Populate student list
        if (verifyAllList) {
            verifyAllList.innerHTML = '';
            items.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 'flex items-center gap-3 py-3 border-b-2 border-[#1E1E1E]/10 last:border-0';
                
                // Dropdown Options
                const options = [
                    { val: 'present',  label: 'Present',  color: 'bg-[#73CB8F]' },
                    { val: 'sick',     label: 'Sick',     color: 'bg-[#E25C5C] text-white' },
                    { val: 'personal', label: 'Personal', color: 'bg-[#F2A00F]' },
                    { val: 'activity', label: 'Activity', color: 'bg-[#5C9EE2] text-white' },
                    { val: 'absent',   label: 'Absent',   color: 'bg-[#1E1E1E] text-white' }
                ];

                const currentStatus = item.status?.toLowerCase() || 'present';

                row.innerHTML = `
                    <span class="w-7 h-7 shrink-0 flex items-center justify-center border-2 border-[#1E1E1E] text-xs font-black bg-[#EEEDDE] shadow-[2px_2px_0px_#1E1E1E]">${idx + 1}</span>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-black truncate">${escapeHTML(item.firstname_record || '')} ${escapeHTML(item.lastname_record || '')}</p>
                        <p class="text-[9px] font-bold opacity-50 uppercase tracking-tighter">ID: ${escapeHTML(item.stu_id_record || '-')} · ROOM: ${escapeHTML(item.class_id_record || '-')}</p>
                    </div>
                    <div class="shrink-0 w-[100px]">
                        <select class="verify-all-status-select w-full px-2 py-1.5 border-2 border-[#1E1E1E] text-[10px] font-black uppercase shadow-[2px_2px_0px_#1E1E1E] focus:outline-none cursor-pointer bg-white" data-id="${item.id}">
                            ${options.map(opt => `<option value="${opt.val}" ${opt.val === currentStatus ? 'selected' : ''}>${opt.label}</option>`).join('')}
                        </select>
                    </div>
                `;
                verifyAllList.appendChild(row);

                // Add color change listener for the select
                const select = row.querySelector('.verify-all-status-select');
                const updateSelectStyle = (val) => {
                    const optCfg = options.find(o => o.val === val);
                    select.className = `verify-all-status-select w-full px-2 py-1.5 border-2 border-[#1E1E1E] text-[10px] font-black uppercase shadow-[2px_2px_0px_#1E1E1E] focus:outline-none cursor-pointer ${optCfg.color}`;
                };
                select.addEventListener('change', (e) => updateSelectStyle(e.target.value));
                updateSelectStyle(currentStatus);
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
            content.classList.remove('fade-out');
            content.classList.add('fade-in');
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
            content.classList.remove('fade-in');
            content.classList.add('fade-out');
            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');
            setTimeout(() => {
                verifyAllModal.classList.add('hidden');
                content.classList.remove('fade-out');
                content.classList.add('fade-in');
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
        if (verifyAllCountdownLabel) verifyAllCountdownLabel.textContent = 'Please review info...';

        verifyAllCountdownTimer = setInterval(() => {
            secondsLeft--;
            if (verifyAllCountdownNumber) verifyAllCountdownNumber.textContent = secondsLeft;
            if (verifyAllCountdownCircle) verifyAllCountdownCircle.style.strokeDashoffset = `${totalDash * ((5 - secondsLeft) / 5)}`;

            if (secondsLeft <= 0) {
                clearInterval(verifyAllCountdownTimer);
                verifyAllCountdownTimer = null;
                if (verifyAllCountdownLabel) verifyAllCountdownLabel.textContent = 'Ready!';
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
        const items = getFilteredLogs().filter(item => !item.verification_status || item.verification_status === 'pending');
        if (items.length === 0) return;

        // Lock button
        if (btnVerifyAllSubmit) {
            btnVerifyAllSubmit.disabled = true;
            btnVerifyAllSubmit.textContent = 'Processing...';
            btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        try {
            // Collect statuses from dropdowns
            const selects = document.querySelectorAll('.verify-all-status-select');
            
            // Batch update using Promise.all for safe partial updates
            const updatePromises = Array.from(selects).map(sel => {
                return supabase
                    .from('attendance_logs')
                    .update({
                        final_status: sel.value,
                        verification_status: 'approved',
                        verified_by: currentUserId,
                        verified_at: new Date().toISOString()
                    })
                    .eq('id', sel.getAttribute('data-id'));
            });

            const results = await Promise.all(updatePromises);

            // Check for errors in any of the updates
            const errorResult = results.find(res => res.error);
            if (errorResult) {
                console.error('Batch update error:', errorResult.error);
                alert('Error occurred during save: ' + errorResult.error.message);
                if (btnVerifyAllSubmit) {
                    btnVerifyAllSubmit.disabled = false;
                    btnVerifyAllSubmit.textContent = 'Approve All';
                    btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
                }
                return;
            }

            // Success
            closeVerifyAllModal();
            setTimeout(() => {
                fetchLogs();
            }, 350);

        } catch (err) {
            console.error('Unexpected error:', err);
            alert('An unexpected error occurred');
            if (btnVerifyAllSubmit) {
                btnVerifyAllSubmit.disabled = false;
                btnVerifyAllSubmit.textContent = 'Approve All';
                btnVerifyAllSubmit.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#73CB8F] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
            }
        }
    }
}