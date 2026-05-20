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

    // Fetch admin summary stats
    const fetchAdminStats = async () => {
        const statUsers = document.getElementById('stat-users');
        const statPending = document.getElementById('stat-pending');
        const statVerified = document.getElementById('stat-verified');
        const statClasses = document.getElementById('stat-classes');

        // Total users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        if (statUsers) statUsers.textContent = userCount ?? 0;

        // Pending attendance logs (today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count: pendingCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());
        if (statPending) statPending.textContent = pendingCount ?? 0;

        // Verified attendance logs (today)
        const { count: verifiedCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .in('verification_status', ['approved', 'rejected'])
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());
        if (statVerified) statVerified.textContent = verifiedCount ?? 0;

        // Distinct classes
        const { data: classData } = await supabase
            .from('profiles')
            .select('class_id');
        if (classData && statClasses) {
            const uniqueClasses = new Set(
                classData
                    .map(p => p.class_id)
                    .filter(c => c && c !== 'N/A' && c !== '-')
            );
            statClasses.textContent = uniqueClasses.size;
        }
    };
    fetchAdminStats();

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
            window.location.hash = '#admin-activity';
        });
    }
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            window.location.hash = '#admin-setting';
        });
    }
}