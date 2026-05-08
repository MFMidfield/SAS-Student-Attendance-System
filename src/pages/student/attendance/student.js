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

    // Fetch user name from metadata
    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata && studentNameElem) {
            const { firstname, lastname } = user.user_metadata;
            studentNameElem.textContent = `${firstname} ${lastname}`;
        }
    };
    fetchUserName();

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
    const confirmBtn = document.getElementById('btn-confirm');
    const cancelBtn = document.getElementById('btn-cancel');

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
    };

    const handleSubmit = async () => {
        // 1. ดึง ID ของคนปัจจุบัน
        const { data: { user } } = await supabase.auth.getUser();
        const status = currentStatus;
        const reason = reasonBox.value || "-";

        if (user) {
            // 2. บันทึกลงตาราง Log
            const { error } = await supabase
                .from('attendance_logs')
                .insert([
                    {
                        student_id: user.id,
                        status: status, // หรือรับค่าจาก Select box
                        note: reason
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

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const backdrop = document.getElementById('backdrop');
            if (modal && timerDisplay) {
                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }

                modal.classList.remove('hidden');
                let timeLeft = 10;
                timerDisplay.textContent = timeLeft;

                Timer = setInterval(() => {
                    timeLeft--;
                    timerDisplay.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        closeModal();
                    }
                }, 1000);
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