import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from '../../../lib/ui.js'

export function initAdminSetting(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');
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

    // Back to student dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#student-dashboard';
        });
    }

    let logoutTimer;
    const modal = document.getElementById('logout-modal');
    const timerDisplay = document.getElementById('logout-timer');
    const confirmLogoutBtn = document.getElementById('btn-confirm-logout');
    const cancelLogoutBtn = document.getElementById('btn-cancel-logout');

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdrop = document.getElementById('logout-backdrop');
            
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
        clearInterval(logoutTimer);
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const backdrop = document.getElementById('logout-backdrop');
            if (modal && timerDisplay) {
                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }
                
                modal.classList.remove('hidden');
                let timeLeft = 10;
                timerDisplay.textContent = timeLeft;

                logoutTimer = setInterval(() => {
                    timeLeft--;
                    timerDisplay.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        closeModal();
                    }
                }, 1000);
            }
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                showToast(error.message, 'error');
                closeModal();
            } else {
                showToast('Log out succeed')
                window.location.hash = '';
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            closeModal();
        });
    }
}