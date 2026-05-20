import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from '../../../lib/ui.js'

export function initStudent(imageLogo, imageBander) {
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
    const subjectSelect = document.getElementById('subject-select');

    // Fetch user name from metadata
    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata && studentNameElem) {
            const { firstname, lastname } = user.user_metadata;
            studentNameElem.textContent = `${firstname} ${lastname}`;
        }
        return user;
    };

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

    fetchUserName().then(user => {
        if (user) fetchSubjects(user);
    });

    if (studentImage && imageLogo) {
        studentImage.src = imageLogo;
    }

    if (banderImage && imageBander) {
        banderImage.src = imageBander;
    }

    let currentStatus = 'present';

    function updateUI() {
        Object.values(statusButtons).forEach(btn => {
            if (btn) btn.classList.remove('btn-active');
        });
        if (statusButtons[currentStatus]) {
            statusButtons[currentStatus].classList.add('btn-active');
        }
    }

    function selectStatus(status) {
        currentStatus = status;
        updateUI();
    }

    // Attach listeners
    if (statusButtons.present) statusButtons.present.addEventListener('click', () => selectStatus('present'));
    if (statusButtons.activity) statusButtons.activity.addEventListener('click', () => selectStatus('activity'));
    if (statusButtons.sick) statusButtons.sick.addEventListener('click', () => selectStatus('sick'));
    if (statusButtons.personal) statusButtons.personal.addEventListener('click', () => selectStatus('personal'));

    let Timer;
    const modal = document.getElementById('modal');
    const timerDisplay = document.getElementById('timer');
    const timerLabel = document.getElementById('timer-label');
    const timerUnit = document.getElementById('timer-unit');
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
        clearInterval(Timer);
        if (confirmBtn && confirmBtn._waitInterval) {
            clearInterval(confirmBtn._waitInterval);
        }
    };

    const handleSubmit = async () => {
        // 1. ดึง ID ของคนปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();
        const status = currentStatus;
        const reason = reasonBox.value || "-";
        const subject = subjectSelect?.value || "";

        if (!subject || subject === "") {
            showToast('กรุณาเลือกวิชาเรียนก่อนกดยืนยัน', 'error');
            return;
        }

        if (user) {
            // 2. บันทึกลงตาราง Log
            const { error } = await supabase
                .from('attendance_logs')
                .insert([
                    {
                        student_id: user.id,
                        status: status, // หรือรับค่าจาก Select box
                        note: reason,
                        subject: subject
                    }
                ]);

            if (error) {
                console.error('Error recording attendance:', error.message);
                showToast(error.message, 'error');
            } else {
                showToast('บันทึกการเข้าเรียนสำเร็จ!', 'success');
            }
        }
    };

    let errorTimeout;
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const subject = subjectSelect ? subjectSelect.value : '';

            if (!subject || subject === "") {
                showToast('กรุณาเลือกวิชาเรียนก่อนกดยืนยัน', 'error');

                if (subjectSelect) {
                    if (errorTimeout) clearTimeout(errorTimeout);
                    subjectSelect.classList.add('shake-animation', 'border-error');
                    subjectSelect.classList.remove('border-[#1E1E1E]');
                    subjectSelect.classList.add('border-red-500');
                    errorTimeout = setTimeout(() => {
                        subjectSelect.classList.remove('shake-animation', 'border-error');
                        subjectSelect.classList.remove('border-red-500');
                        subjectSelect.classList.add('border-[#1E1E1E]');
                    }, 3000);
                }
                return;
            }

            const backdrop = document.getElementById('backdrop');
            if (modal && timerDisplay) {
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
                if (summarySubject) summarySubject.textContent = subject;
                if (summaryReason) summaryReason.textContent = reasonBox.value || "-";

                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }

                modal.classList.remove('hidden');
                let timeLeft = 10;
                timerDisplay.textContent = timeLeft;

                // Handle 5-second delay for confirm button
                if (confirmBtn) {
                    confirmBtn.disabled = true;
                    confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    let waitTime = 5;
                    confirmBtn.textContent = `Confirm (${waitTime})`;
                    
                    // Show review message
                    if (timerLabel) timerLabel.textContent = "Please review your information";
                    if (timerDisplay) timerDisplay.classList.add('hidden');
                    if (timerUnit) timerUnit.classList.add('hidden');

                    const waitInterval = setInterval(() => {
                        waitTime--;
                        if (waitTime > 0) {
                            confirmBtn.textContent = `Confirm (${waitTime})`;
                        } else {
                            clearInterval(waitInterval);
                            confirmBtn.disabled = false;
                            confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                            confirmBtn.textContent = '✓ Confirm';

                            // Restore auto-close timer labels and start countdown
                            if (timerLabel) timerLabel.textContent = "Auto-closing in";
                            if (timerDisplay) {
                                timerDisplay.classList.remove('hidden');
                                timerDisplay.textContent = timeLeft;
                            }
                            if (timerUnit) timerUnit.classList.remove('hidden');

                            Timer = setInterval(() => {
                                timeLeft--;
                                if (timerDisplay) timerDisplay.textContent = timeLeft;
                                if (timeLeft <= 0) {
                                    closeModal();
                                }
                            }, 1000);
                        }
                    }, 1000);

                    // Store waitInterval on the button so it can be cleared if modal closes early
                    confirmBtn._waitInterval = waitInterval;
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
            if (subjectSelect) subjectSelect.selectedIndex = 0;
            selectStatus('present');
            closeModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    // Back to student dashboard
    backBtn.addEventListener('click', () => {
        window.location.hash = '#student-dashboard';
    });

    // Initial UI state
    updateUI();
}