import { supabase } from '../../../lib/supabaseClient.js'

export function initAdminDashBoard(imageLogo, imageBander) {
    const userEditBtn = document.getElementById('btn-user-edit')
    const logsBtn = document.getElementById('btn-logs')
    const scheduleBtn = document.getElementById('btn-schedule')
    const activityBtn = document.getElementById('btn-activity')
    const settingBtn = document.getElementById('btn-setting')
    const approveBtn = document.getElementById('btn-approve')
    const verifyLogsBtn = document.getElementById('btn-verify-logs')
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
    if (userEditBtn) {
        userEditBtn.addEventListener('click', () => {
            window.location.hash = '#admin-user-edit';
        });
    }
    if (logsBtn) {
        logsBtn.addEventListener('click', () => {
            window.location.hash = '#admin-logs';
        });
    }
    if (verifyLogsBtn) {
        verifyLogsBtn.addEventListener('click', () => {
            window.location.hash = '#admin-verify-logs';
        });
    }
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            window.location.hash = '#admin-approve';
        });
    }
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            window.location.hash = '#admin-schedule';
        });
    }
    if (activityBtn) {
        activityBtn.addEventListener('click', () => {
            window.location.hash = '#student';
        });
    }
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            window.location.hash = '#admin-setting';
        });
    }
}