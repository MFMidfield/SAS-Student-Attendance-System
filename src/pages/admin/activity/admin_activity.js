import { supabase } from '../../../lib/supabaseClient.js'

export function initAdminActivity(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');
    const studentImage = document.getElementById('student-image');
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

    // Back to admin dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#admin-dashboard';
        });
    }

    // Note: Activity CRUD functionality will be implemented in a future update.
    // The UI is designed and ready for integration with a Supabase 'events' or 'activities' table.
}
