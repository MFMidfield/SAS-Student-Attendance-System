import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from '../../../lib/ui.js'

export function initLeaderAttendance(imageLogo, imageBander) {
    const statusButtons = {
        'present': document.getElementById('btn-present'),
        'activity': document.getElementById('btn-activity'),
        'sick': document.getElementById('btn-sick'),
        'personal': document.getElementById('btn-personal')
    };
    const reasonBox = document.getElementById('reason-box');
    const submitBtn = document.getElementById('btn-submit');
    const backBtn = document.getElementById('btn-back');
    const studentImage = document.getElementById('student-image');
    const banderImage = document.getElementById('bander-image');
    const studentNameElem = document.getElementById('student-name');
    const saveIcon = document.getElementById('saveIcon')
    const subjectDisplay = document.getElementById('subject-display');
    const subjectContainer = document.getElementById('subject-container');
    const dateContainer = document.getElementById('date-container');
    const dateInput = document.getElementById('attendance-date');
    const leaveScopeContainer = document.getElementById('leave-scope-container');
    const scopeButtons = {
        'full_day': document.getElementById('scope-full'),
        'morning': document.getElementById('scope-morning'),
        'afternoon': document.getElementById('scope-afternoon')
    };

    // Fetch user profile and name
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata && studentNameElem) {
            const { firstname, lastname } = user.user_metadata;
            studentNameElem.textContent = `${firstname} ${lastname}`;
        }
        
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('class_id')
                .eq('id', user.id)
                .single();
            return { ...user, profile };
        }
        return null;
    };

    let isClassActive = false;
    let currentSubjectName = "";
    let hasCheckedPresentToday = false;
    let hasUsedDailyLeave = false;

    // Helper: Get initial attendance date based on 8 PM logic
    const getInitialDate = () => {
        const now = new Date();
        const target = new Date(now);
        // If after 8 PM (20:00), default to tomorrow
        if (now.getHours() >= 20) {
            target.setDate(target.getDate() + 1);
        }
        return target.toISOString().split('T')[0];
    };

    // Set initial date
    if (dateInput) dateInput.value = getInitialDate();

    // 1. Fetch current subject based on time
    const fetchCurrentSubject = async (userProfile) => {
        if (!userProfile || !userProfile.profile) return;
        
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const { data: schedules } = await supabase
            .from('schedule')
            .select('subject_name, start_time, end_time')
            .eq('room', userProfile.profile.class_id)
            .eq('day_of_week', dayOfWeek);

        const current = (schedules || []).find(item => {
            const start = parseInt(item.start_time.replace(/:/g, '').substring(0, 4));
            const end = parseInt(item.end_time.replace(/:/g, '').substring(0, 4));
            return currentTime >= start && currentTime <= end;
        });

        if (current) {
            isClassActive = true;
            currentSubjectName = current.subject_name;
            if (subjectDisplay) {
                subjectDisplay.textContent = current.subject_name;
            }
        } else {
            isClassActive = false;
            currentSubjectName = "";
            if (subjectDisplay) {
                subjectDisplay.textContent = "No class scheduled";
            }
        }
    };

    let lastFullDayLeave = false;
    let lastAnyPresent = false;

    // Function to re-validate submission limits for a specific date and status
    const checkSubmissionLimits = async (targetDate) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check for ANY leave on this date
        const { data: leaveLogs } = await supabase
            .from('attendance_logs')
            .select('status, leave_scope, subject')
            .eq('student_id', user.id)
            .eq('attendance_date', targetDate)
            .in('status', ['sick', 'personal', 'activity']);

        // 2. Check for ANY present log on this date
        const { data: presentLogs } = await supabase
            .from('attendance_logs')
            .select('id, subject')
            .eq('student_id', user.id)
            .eq('attendance_date', targetDate)
            .eq('status', 'present');

        // Reset flags
        hasCheckedPresentToday = false;
        hasUsedDailyLeave = false;
        
        lastFullDayLeave = (leaveLogs || []).some(l => l.leave_scope === 'full_day');
        lastAnyPresent = (presentLogs || []).length > 0;

        // If trying to check present, see if this SPECIFIC subject is done
        if (isClassActive && currentSubjectName) {
            const subjectDone = (presentLogs || []).some(l => l.subject === currentSubjectName);
            if (subjectDone) hasCheckedPresentToday = true;
        }

        // If any leave exists for this date, we consider leave "used" for this date
        if ((leaveLogs || []).length > 0) hasUsedDailyLeave = true;

        // Update UI with conflict logic
        updateUI(lastFullDayLeave, lastAnyPresent);
    };

    fetchUser().then(userData => {
        if (userData) {
            fetchCurrentSubject(userData).then(() => {
                checkSubmissionLimits(dateInput?.value || new Date().toISOString().split('T')[0]);
            });
        }
    });


    /* 
    // Fetch subjects from schedule based on student's class_id
    const fetchSubjects = async (user) => {
        if (!user || !subjectSelect) return;

        // 1. Get class_id from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('class_id')
            .eq('id', user.id)
            .single();

        if (!profile) return;

        // 2. Get subjects from schedule table
        const { data: schedules, error } = await supabase
            .from('schedule')
            .select('subject_name')
            .eq('room', profile.class_id);

        if (error) {
            console.error('Error fetching subjects:', error.message);
            return;
        }

        // 3. Populate select box (Unique subjects only)
        const uniqueSubjects = [...new Set(schedules.map(s => s.subject_name))];

        subjectSelect.innerHTML = '<option value="" disabled selected>Select Subject</option>';
        uniqueSubjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
        // Auto-select first subject if available
        if (uniqueSubjects.length > 0) {
            // subjectSelect.value = uniqueSubjects[0]; // Optional: auto select
        }
    };
    */

    fetchUser().then(userData => {
        if (userData) fetchCurrentSubject(userData);
    });

    if (studentImage && imageLogo) {
        studentImage.src = imageLogo;
    }

    if (banderImage && imageBander) {
        banderImage.src = imageBander;
    }
    
    let currentStatus = 'present';
    let currentLeaveScope = 'full_day';

    function updateUI(hasFullDayLeave = false, hasAnyPresent = false) {
        Object.values(statusButtons).forEach(btn => {
            if (btn) btn.classList.remove('btn-active');
        });
        if (statusButtons[currentStatus]) {
            statusButtons[currentStatus].classList.add('btn-active');
        }
        if (currentStatus === 'present') {
            if (subjectContainer) subjectContainer.classList.remove('hidden');
            if (dateContainer) dateContainer.classList.add('hidden');
            if (leaveScopeContainer) leaveScopeContainer.classList.add('hidden');
        } else {
            if (subjectContainer) subjectContainer.classList.add('hidden');
            if (dateContainer) dateContainer.classList.remove('hidden');
            if (leaveScopeContainer) leaveScopeContainer.classList.remove('hidden');
            
            // Highlight active scope button
            Object.entries(scopeButtons).forEach(([key, btn]) => {
                if (!btn) return;
                if (key === currentLeaveScope) {
                    btn.classList.add('bg-[#F2C00F]', 'text-[#1E1E1E]');
                    btn.classList.remove('bg-white');
                } else {
                    btn.classList.remove('bg-[#F2C00F]', 'text-[#1E1E1E]');
                    btn.classList.add('bg-white');
                }
            });
        }

        // Disable submit button if conditions aren't met
        if (submitBtn) {
            let isDisabled = false;
            let reason = "";

            if (hasFullDayLeave) {
                isDisabled = true;
                reason = "Full day leave active";
            } else if (currentStatus === 'present') {
                if (!isClassActive) {
                    isDisabled = true;
                    reason = "No class now";
                } else if (hasCheckedPresentToday) {
                    isDisabled = true;
                    reason = "Already submitted";
                }
            } else if (['sick', 'personal', 'activity'].includes(currentStatus)) {
                if (hasUsedDailyLeave) {
                    isDisabled = true;
                    reason = "Leave already submitted";
                } else if (hasAnyPresent && currentLeaveScope === 'full_day') {
                    isDisabled = true;
                    reason = "Already present today";
                } else if (!reasonBox || !reasonBox.value || reasonBox.value.trim() === "") {
                    isDisabled = true;
                    reason = "Reason required";
                }
            }

            if (isDisabled) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed', 'grayscale');
                submitBtn.innerHTML = `<span>${reason}</span>`;
            } else {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'grayscale');
                submitBtn.innerHTML = `
                    <svg class="w-6 h-6" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Confirm
                `;
            }
        }
    }

    function selectStatus(status) {
        currentStatus = status;
        // 1. Update UI colors immediately for responsiveness
        updateUI(lastFullDayLeave, lastAnyPresent); 
        // 2. Re-validate in background
        checkSubmissionLimits(dateInput?.value || new Date().toISOString().split('T')[0]);
    }

    // Attach listeners
    if (statusButtons.present) statusButtons.present.addEventListener('click', () => selectStatus('present'));
    if (statusButtons.activity) statusButtons.activity.addEventListener('click', () => selectStatus('activity'));
    if (statusButtons.sick) statusButtons.sick.addEventListener('click', () => selectStatus('sick'));
    if (statusButtons.personal) statusButtons.personal.addEventListener('click', () => selectStatus('personal'));

    if (reasonBox) {
        reasonBox.addEventListener('input', () => {
            updateUI(lastFullDayLeave, lastAnyPresent);
        });
    }

    // Leave Scope buttons
    if (scopeButtons.full_day) scopeButtons.full_day.addEventListener('click', () => { 
        currentLeaveScope = 'full_day'; 
        updateUI(lastFullDayLeave, lastAnyPresent);
        checkSubmissionLimits(dateInput?.value || new Date().toISOString().split('T')[0]); 
    });
    if (scopeButtons.morning) scopeButtons.morning.addEventListener('click', () => { 
        currentLeaveScope = 'morning'; 
        updateUI(lastFullDayLeave, lastAnyPresent);
        checkSubmissionLimits(dateInput?.value || new Date().toISOString().split('T')[0]); 
    });
    if (scopeButtons.afternoon) scopeButtons.afternoon.addEventListener('click', () => { 
        currentLeaveScope = 'afternoon'; 
        updateUI(lastFullDayLeave, lastAnyPresent);
        checkSubmissionLimits(dateInput?.value || new Date().toISOString().split('T')[0]); 
    });

    if (dateInput) {
        dateInput.addEventListener('change', async () => {
            // Show checking state immediately
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<span>Validating...</span>`;
            }
            await checkSubmissionLimits(dateInput.value);
        });
    }

    let countdownTimer;
    const modal = document.getElementById('modal');
    const countdownCircle = document.getElementById('countdown-circle');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownLabel = document.getElementById('countdown-label');
    const confirmBtn = document.getElementById('btn-confirm');
    const cancelBtn = document.getElementById('btn-cancel');

    // Summary elements
    const summaryStatus = document.getElementById('summary-status');
    const summarySubject = document.getElementById('summary-subject');
    const summaryReason = document.getElementById('summary-reason');

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdrop = document.getElementById('backdrop');

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
        if (countdownTimer) {
            clearInterval(countdownTimer);
            countdownTimer = null;
        }
    };

    const handleSubmit = async () => {
        // 1. ดึง ID ของคนปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();
        const status = currentStatus;
        const reason = reasonBox.value || "-";
        const subject = currentSubjectName || "-";
        const scope = currentLeaveScope;

        // Check reason for non-present statuses
        if (['sick', 'personal', 'activity'].includes(status) && (!reason || reason === "-" || reason === "")) {
            showToast('Please enter a reason', 'error');
            if (reasonBox) {
                reasonBox.classList.add('shake-animation', 'border-red-500');
                setTimeout(() => reasonBox.classList.remove('shake-animation', 'border-red-500'), 1000);
            }
            return;
        }

        if (user) {
            // 2. บันทึกลงตาราง Log
            const selectedDate = ['sick', 'personal', 'activity'].includes(status) 
                ? (dateInput?.value || new Date().toISOString().split('T')[0])
                : new Date().toISOString().split('T')[0];

            const finalSubject = subject;
            const finalScope = ['sick', 'personal', 'activity'].includes(status) ? scope : 'period';

            const { error } = await supabase
                .from('attendance_logs')
                .insert([
                    {
                        student_id: user.id,
                        status: status,
                        note: reason,
                        subject: finalSubject,
                        attendance_date: selectedDate,
                        leave_scope: finalScope
                    }
                ]);

            if (error) {
                console.error('Error recording attendance:', error.message);
                showToast(error.message, 'error');
            } else {
                showToast('Attendance recorded successfully!', 'success');
                // Re-validate everything immediately
                await checkSubmissionLimits(selectedDate);
            }
        }
    };

    let errorTimeout;
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const subject = currentSubjectName || "";

            // Final check on submit
            if (currentStatus === 'present' && !isClassActive) {
                showToast('No class active now', 'error');
                return;
            }
            
            if (['sick', 'personal', 'activity'].includes(currentStatus) && (!reasonBox.value || reasonBox.value.trim() === "")) {
                showToast('Reason is required for leaves', 'error');
                reasonBox.classList.add('shake-animation', 'border-red-500');
                setTimeout(() => reasonBox.classList.remove('shake-animation', 'border-red-500'), 1000);
                return;
            }

            const backdrop = document.getElementById('backdrop');
            if (modal) {
                // Populate summary info
                if (summaryStatus) {
                    summaryStatus.textContent = currentStatus;
                    // Apply color based on status
                    const statusColors = {
                        'present': 'text-[#219653]',
                        'activity': 'text-[#5B8DEF]',
                        'sick': 'text-[#E25C5C]',
                        'personal': 'text-[#B08968]'
                    };
                    summaryStatus.className = `text-xs font-black uppercase ${statusColors[currentStatus] || ''}`;
                }
                if (summarySubject) {
                    if (['sick', 'personal', 'activity'].includes(currentStatus)) {
                        const scopeNames = { 'full_day': 'All Day', 'morning': 'Morning', 'afternoon': 'Afternoon' };
                        const scopeText = scopeNames[currentLeaveScope] || 'All Day';
                        summarySubject.innerHTML = `Date: ${dateInput?.value || '-'}<br><span class="text-[10px] opacity-70">${scopeText}</span>`;
                    } else {
                        summarySubject.textContent = subject;
                    }
                }
                if (summaryReason) summaryReason.textContent = reasonBox.value || "-";

                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }

                modal.classList.remove('hidden');

                // Handle 5-second countdown
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
                    confirmBtn.textContent = 'Confirm';
                    
                    let secondsLeft = 5;
                    const totalDash = 97.39;

                    if (countdownCircle) countdownCircle.style.strokeDashoffset = '0';
                    if (countdownNumber) countdownNumber.textContent = '5';
                    if (countdownLabel) countdownLabel.textContent = 'Please wait...';

                    countdownTimer = setInterval(() => {
                        secondsLeft--;
                        if (countdownNumber) countdownNumber.textContent = secondsLeft;
                        if (countdownCircle) countdownCircle.style.strokeDashoffset = `${totalDash * ((5 - secondsLeft) / 5)}`;

                        if (secondsLeft <= 0) {
                            clearInterval(countdownTimer);
                            countdownTimer = null;
                            if (countdownLabel) countdownLabel.textContent = 'Ready!';
                            if (countdownNumber) countdownNumber.textContent = '✓';
                            
                            // Unlock button
                            confirmBtn.disabled = false;
                            confirmBtn.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#219653] text-[#1E1E1E] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
                            confirmBtn.textContent = '✓ Confirm';
                        }
                    }, 1000);
                }
            }
        });
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            await handleSubmit();
            const reason = reasonBox ? reasonBox.value : "";
            console.log("Form Submitted!");
            console.log("Status:", currentStatus);
            console.log("Reason:", reason);

            if (reasonBox) reasonBox.value = "";
            // if (subjectSelect) subjectSelect.selectedIndex = 0;

            selectStatus('present');
            closeModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    // Back to leader dashboard
    backBtn.addEventListener('click', () => {
        window.location.hash = '#leader-dashboard';
    });

    // Initial UI state
    updateUI();
}