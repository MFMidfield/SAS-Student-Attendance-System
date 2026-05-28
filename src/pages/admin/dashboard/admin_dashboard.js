import { supabase } from '../../../lib/supabaseClient.js'

export function initAdminDashBoard(imageLogo, imageBander) {
    const attachClick = (idBase, hash) => {
        document.querySelectorAll(`[id^="${idBase}"]`).forEach(el => {
            el.addEventListener('click', (e) => { 
                e.preventDefault();
                window.location.hash = hash; 
            });
        });
    };
    
    attachClick('btn-user-edit', '#admin-user-edit');
    attachClick('btn-logs', '#admin-logs');
    attachClick('btn-schedule', '#admin-schedule');
    attachClick('btn-activity', '#admin-activity');
    attachClick('btn-setting', '#admin-setting');
    attachClick('btn-approve', '#admin-approve');
    attachClick('btn-verify-logs', '#admin-verify-logs');

    const setTextContent = (idBase, text) => {
        document.querySelectorAll(`[id^="${idBase}"]`).forEach(el => {
            el.textContent = text;
        });
    };
    
    const setSrc = (idBase, src) => {
        if (!src) return;
        document.querySelectorAll(`[id^="${idBase}"]`).forEach(el => {
            if (el.tagName === 'IMG') el.src = src;
        });
    };

    // Fetch user name from metadata
    const fetchUserName = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata) {
            const { firstname, lastname } = user.user_metadata;
            setTextContent('student-name', `${firstname} ${lastname}`);
        }
    };
    fetchUserName();

    // Fetch admin summary stats
    const fetchAdminStats = async () => {
        // Total users
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
        setTextContent('stat-users', userCount ?? 0);

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
        setTextContent('stat-pending', pendingCount ?? 0);

        // Verified attendance logs (today)
        const { count: verifiedCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .in('verification_status', ['approved', 'rejected'])
            .gte('created_at', todayStart.toISOString())
            .lte('created_at', todayEnd.toISOString());
        setTextContent('stat-verified', verifiedCount ?? 0);

        // Distinct classes
        const { data: classData } = await supabase
            .from('profiles')
            .select('class_id');
        if (classData) {
            const uniqueClasses = new Set(
                classData
                    .map(p => p.class_id)
                    .filter(c => c && c !== 'N/A' && c !== '-')
            );
            setTextContent('stat-classes', uniqueClasses.size);
        }
    };
    fetchAdminStats();

    setSrc('student-image', imageLogo);
}
