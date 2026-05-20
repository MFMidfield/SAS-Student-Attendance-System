import { supabase } from '../../lib/supabaseClient.js'

export function initStudent(imageLogo, imageBander) {
    const statusButtons = {
        'present': document.getElementById('btn-present'),
        'activity': document.getElementById('btn-activity'),
        'sick': document.getElementById('btn-sick'),
        'personal': document.getElementById('btn-personal')
    };
    const reasonBox = document.getElementById('reason-box');
    const submitBtn = document.getElementById('btn-submit');
    const logoutBtn = document.getElementById('btn-logout');
    const studentImage = document.getElementById('student-image');
    const banderImage = document.getElementById('bander-image');
    const studentNameElem = document.getElementById('student-name');

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
            } else {
                alert('บันทึกการเข้าเรียนสำเร็จ!');
            }
        }
    };

    // Attach listeners
    if (statusButtons.present) statusButtons.present.addEventListener('click', () => selectStatus('present'));
    if (statusButtons.activity) statusButtons.activity.addEventListener('click', () => selectStatus('activity'));
    if (statusButtons.sick) statusButtons.sick.addEventListener('click', () => selectStatus('sick'));
    if (statusButtons.personal) statusButtons.personal.addEventListener('click', () => selectStatus('personal'));

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            await handleSubmit();
            const reason = reasonBox ? reasonBox.value : "";
            console.log("Form Submitted!");
            console.log("Status:", currentStatus);
            console.log("Reason:", reason);

            if (reasonBox) reasonBox.value = "";
            selectStatus('present');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert(error.message);
            } else {
                window.location.hash = '';
            }
        });
    }

    // Initial UI state
    updateUI();
}