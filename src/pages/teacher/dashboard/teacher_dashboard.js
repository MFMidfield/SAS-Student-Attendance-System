import { supabase } from '../../../lib/supabaseClient.js'

export function initTeacherDashBoard(imageLogo, imageBander) {
    const userEditBtn = document.getElementById('btn-user-edit')
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

    // Fetch teacher summary stats
    const fetchTeacherStats = async () => {
        const statUsers = document.getElementById('stat-total-users');
        const statPending = document.getElementById('stat-pending');
        const statVerified = document.getElementById('stat-verified');
        const classroomLabel = document.getElementById('classroom-label');

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from('profiles').select('class_id').eq('id', user.id).single();
        const userClassId = profile ? profile.class_id : null;

        if (!userClassId || userClassId === 'N/A') {
            if (statUsers) statUsers.textContent = '0';
            if (statPending) statPending.textContent = '0';
            if (statVerified) statVerified.textContent = '0';
            if (classroomLabel) classroomLabel.textContent = 'ROOM -';
            return;
        }

        // Update classroom label
        if (classroomLabel) classroomLabel.textContent = `ROOM ${userClassId}`;

        // Total users (Students in this class)
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', userClassId)
            .eq('role', 'student');
        if (statUsers) statUsers.textContent = userCount ?? 0;

        // Pending attendance logs (today, this class)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { count: pendingCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('class_id_record', userClassId)
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());
        if (statPending) statPending.textContent = pendingCount ?? 0;

        // Verified attendance logs (today, this class)
        const { count: verifiedCount } = await supabase
            .from('attendance_verify')
            .select('*', { count: 'exact', head: true })
            .eq('class_id_record', userClassId)
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());
        if (statVerified) statVerified.textContent = verifiedCount ?? 0;
    };
    fetchTeacherStats();

    if (studentImage && imageLogo) {
        studentImage.src = imageLogo;
    }

    // Navigation
    if (userEditBtn) {
        userEditBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-user';
        });
    }
    if (verifyLogsBtn) {
        verifyLogsBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-verify-logs';
        });
    }
    if (approveBtn) {
        approveBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-approve';
        });
    }
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-schedule';
        });
    }
    if (activityBtn) {
        activityBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-activity';
        });
    }
    if (settingBtn) {
        settingBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-setting';
        });
    }
}
