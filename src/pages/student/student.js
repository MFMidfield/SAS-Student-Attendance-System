import { supabase } from '../../lib/supabaseClient.js'

export function initStudent(imageUrl) {
    const statusButtons = {
        'present': document.getElementById('btn-present'),
        'sick': document.getElementById('btn-sick'),
        'personal': document.getElementById('btn-personal')
    };
    const reasonBox = document.getElementById('reason-box');
    const submitBtn = document.getElementById('btn-submit');
    const logoutBtn = document.getElementById('btn-logout');
    const studentImage = document.getElementById('student-image');

    if (studentImage && imageUrl) {
        studentImage.src = imageUrl;
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
    if (statusButtons.sick) statusButtons.sick.addEventListener('click', () => selectStatus('sick'));
    if (statusButtons.personal) statusButtons.personal.addEventListener('click', () => selectStatus('personal'));

    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const reason = reasonBox ? reasonBox.value : "";
            console.log("Form Submitted!");
            console.log("Status:", currentStatus);
            console.log("Reason:", reason);

            if (reasonBox) reasonBox.value = "";
            selectStatus('present');
            alert("Check-in successful!");
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