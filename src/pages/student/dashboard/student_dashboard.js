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
        return user;
    };

    // Fetch attendance stats for current month
    const fetchStats = async (user) => {
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        const { data: logs, error } = await supabase
            .from('attendance_verify')
            .select('status')
            .eq('student_id', user.id)
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

        if (error) {
            console.error('Error fetching stats:', error.message);
            return;
        }

        // Count statuses
        const counts = { present: 0, activity: 0, sick: 0, personal: 0 };
        (logs || []).forEach(log => {
            const s = log.status?.toLowerCase();
            if (counts.hasOwnProperty(s)) counts[s]++;
        });

        // Update stat display
        const statPresent = document.getElementById('stat-present');
        const statActivity = document.getElementById('stat-activity');
        const statSick = document.getElementById('stat-sick');
        const statPersonal = document.getElementById('stat-personal');
        // const attendanceRate = document.getElementById('attendance-rate');
        // const attendanceBar = document.getElementById('attendance-bar');

        if (statPresent) statPresent.textContent = counts.present;
        if (statActivity) statActivity.textContent = counts.activity;
        if (statSick) statSick.textContent = counts.sick;
        if (statPersonal) statPersonal.textContent = counts.personal;

        // Calculate attendance rate (present + activity = attending)
        // const total = counts.present + counts.activity + counts.sick + counts.personal;
        // const attending = counts.present + counts.activity;
        // const rate = total > 0 ? Math.round((attending / total) * 100) : 0;

        // if (attendanceRate) attendanceRate.textContent = `${total > 0 ? rate : '--'}%`;
        // if (attendanceBar) {
        //     // Small delay for animation effect
        //     setTimeout(() => {
        //         attendanceBar.style.width = `${total > 0 ? rate : 0}%`;
        //     }, 300);
        // }
    };

    // Fetch today's schedule
    const fetchTodaySchedule = async (user) => {
        const scheduleContainer = document.getElementById('schedule-container');
        if (!scheduleContainer || !user) return;

        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes(); // Format: HHMM

        // 1. Get student's class_id from profiles
        const { data: profile } = await supabase
            .from('profiles')
            .select('class_id')
            .eq('id', user.id)
            .single();

        if (!profile || profile.class_id === 'N/A' || profile.class_id === '-') {
            scheduleContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-[10px] font-bold text-[#1E1E1E]/40 uppercase tracking-wider">No class assigned</p>
                </div>`;
            return;
        }

        // 2. Fetch today's schedule for this class
        const { data: schedules, error } = await supabase
            .from('schedule')
            .select('*')
            .eq('room', profile.class_id)
            .eq('day_of_week', dayOfWeek)
            .order('period', { ascending: true });

        if (error) {
            console.error('Error fetching schedule:', error.message);
            scheduleContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-[10px] font-bold text-[#D96C6C] uppercase">Error loading schedule</p>
                </div>`;
            return;
        }

        if (!schedules || schedules.length === 0) {
            scheduleContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-6 text-center shadow-[3px_3px_0px_#1E1E1E] flex flex-col items-center gap-2">
                    <div class="text-2xl">🍃</div>
                    <p class="text-[10px] font-black text-[#1E1E1E]/40 uppercase tracking-widest">No classes scheduled for today</p>
                </div>`;
            return;
        }

        // 3. Render schedule
        scheduleContainer.innerHTML = '';

        schedules.forEach(item => {
            const startStr = item.start_time.replace(/:/g, '').substring(0, 4);
            const endStr = item.end_time.replace(/:/g, '').substring(0, 4);
            const start = parseInt(startStr);
            const end = parseInt(endStr);

            const isCurrent = currentTime >= start && currentTime <= end;

            const card = document.createElement('div');
            card.className = `flex items-center gap-3 p-3 border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] transition-all hover:-translate-y-0.5 ${isCurrent ? 'bg-[#F2C00F]/10 border-[#F2C00F]/50 ring-2 ring-[#F2C00F]/20' : 'bg-white'}`;

            card.innerHTML = `
                <div class="w-12 h-12 shrink-0 border-2 border-[#1E1E1E] flex flex-col items-center justify-center ${isCurrent ? 'bg-[#F2C00F]' : 'bg-[#EEEDDE]'} shadow-[2px_2px_0px_#1E1E1E]">
                    <span class="text-[9px] font-black opacity-50 uppercase">P${item.period}</span>
                    <span class="text-[10px] font-black">${item.start_time.substring(0, 5)}</span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <p class="font-black text-xs text-[#1E1E1E] truncate uppercase">${item.subject_name}</p>
                        ${isCurrent ? '<span class="px-1.5 py-0.5 bg-[#219653] text-[8px] font-black text-white uppercase rounded-sm animate-pulse">Now</span>' : ''}
                    </div>
                    <div class="flex items-center gap-1.5 mt-0.5">
                         <svg class="w-2.5 h-2.5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <p class="text-[9px] font-bold text-[#1E1E1E]/50 uppercase truncate">${item.teacher_name}</p>
                    </div>
                </div>
                <div class="shrink-0 text-right">
                    <p class="text-[8px] font-black text-[#1E1E1E]/30 uppercase">Ends</p>
                    <p class="text-[10px] font-black text-[#1E1E1E]">${item.end_time.substring(0, 5)}</p>
                </div>
            `;
            scheduleContainer.appendChild(card);
        });
    };

    fetchUserName().then(user => {
        if (user) {
            fetchStats(user);
            fetchTodaySchedule(user);
        }
    });

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
            window.location.hash = '#student-schedule';
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