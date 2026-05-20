import { supabase } from '../../../lib/supabaseClient.js'

export function initStudentDashBoard(imageLogo, imageBander) {
    const attendanceBtn = document.getElementById('btn-attendance')
    const scheduleBtn = document.getElementById('btn-schedule')
    const activityBtn = document.getElementById('btn-activity')
    const settingBtn = document.getElementById('btn-setting')
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

    // route
    if (attendanceBtn) {
        attendanceBtn.addEventListener('click', () => {
            window.location.hash = '#student';
        });
    }
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            window.location.hash = '#student';
        });
    }
    if (activityBtn) {
        activityBtn.addEventListener('click', () => {
            window.location.hash = '#student';
        });
    }
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            window.location.hash = '#student-setting';
        });
    }
}