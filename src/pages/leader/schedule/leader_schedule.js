import { supabase } from "../../../lib/supabaseClient";
import { showToast, escapeHTML } from "../../../lib/ui";

export function initLeaderSchedule(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');
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

    if (studentImage && imageLogo) studentImage.src = imageLogo;
    if (banderImage && imageBander) banderImage.src = imageBander;

    let userRole = 'leader'; // Default role
    let userClassId = null; // Store leader's class_id (e.g. "4/9")

    const scheduleList = document.getElementById('schedule-list');
    const searchFilter = document.getElementById('search-filter');
    const dayFilterBtns = document.querySelectorAll('.day-filter-btn');

    let selectedDayFilter = '1';

    // --- Check Role & Permissions ---
    const checkUserPermissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('role, class_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            userRole = profile.role;
            userClassId = profile.class_id;
        }
    };

    let allSchedulesData = [];

    const renderSchedules = () => {
        if (!scheduleList) return;

        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        let filteredData = allSchedulesData;

        // --- Filter by search term (Subject, Teacher, Room, Period) ---
        if (searchTerm) {
            filteredData = filteredData.filter(item => {
                const subject = (item.subject_name || '').toLowerCase();
                const teacher = (item.teacher_name || '').toLowerCase();
                const room = (item.room || '').toLowerCase();
                const period = (item.period || '').toString();

                return subject.includes(searchTerm) ||
                    teacher.includes(searchTerm) ||
                    room.includes(searchTerm) ||
                    period.includes(searchTerm);
            });
        }

        // --- Filter by selected day ---
        if (selectedDayFilter !== 'all') {
            const dayNum = parseInt(selectedDayFilter);
            filteredData = filteredData.filter(item => item.day_of_week === dayNum);
        }

        if (filteredData.length === 0) {
            scheduleList.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                No schedule found for this day or matching your search.
            </div>`;
            return;
        }

        scheduleList.innerHTML = '';
        filteredData.forEach(item => {
            const row = document.createElement('div');
            row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in mb-3";
            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const dayName = dayNames[item.day_of_week] || "N/A";

            row.innerHTML = `
                <div class="w-14 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] bg-[#F2C00F]">
                    <span class="text-[10px] font-bold opacity-60">${dayName}</span>
                    <span class="text-2xl font-black">${item.period}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold">
                        ${item.start_time.substring(0, 5)} - ${item.end_time.substring(0, 5)}
                    </div>
                    <div class="px-3 py-2 border-b-2 border-[#1E1E1E] font-bold text-md leading-tight truncate">
                        ${escapeHTML(item.subject_name)}
                    </div>
                    <div class="px-3 py-1 text-[11px] font-bold opacity-60 italic truncate">
                        ${escapeHTML(item.teacher_name)} (${escapeHTML(item.room)})
                    </div>
                </div>
            `;
            scheduleList.appendChild(row);
        });
    };

    const fetchSchedules = async () => {
        scheduleList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase.from('schedule').select('*');

        // Leader, Teacher or Student: fetch only their own room's schedule (compare with room column)
        if ((userRole === 'leader' || userRole === 'teacher' || userRole === 'student') && userClassId) {
            query = query.eq('room', userClassId);
        }

        const { data, error } = await query
            .order('day_of_week', { ascending: true })
            .order('period', { ascending: true });

        if (error) {
            scheduleList.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">Error loading data</div>';
            return;
        }

        allSchedulesData = data || [];
        renderSchedules();
    };

    if (searchFilter) searchFilter.addEventListener('input', renderSchedules);

    // --- Day Filter Event Listeners ---
    dayFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            selectedDayFilter = btn.getAttribute('data-day');

            // Update button UI
            dayFilterBtns.forEach(b => {
                b.classList.remove('bg-[#F2C00F]');
                b.classList.add('bg-white');
            });
            btn.classList.remove('bg-white');
            btn.classList.add('bg-[#F2C00F]');

            renderSchedules();
        });
    });

    // Initialize system: Check permissions then fetch data
    const init = async () => {
        await checkUserPermissions();
        await fetchSchedules();
    };
    init();

    backBtn.addEventListener('click', () => { window.location.hash = '#leader-dashboard'; });
}
