import { supabase } from "../../../lib/supabaseClient";
import { showToast, escapeHTML } from "../../../lib/ui";

export function initStudentSchedule(imageLogo, imageBander) {
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

    if (studentImage && imageLogo) {
        studentImage.src = imageLogo;
    }

    if (banderImage && imageBander) {
        banderImage.src = imageBander;
    }

    let userRole = 'student'; // Default role
    let userClassId = null; // Store student's class_id (e.g., "4/9")

    const scheduleList = document.getElementById('schedule-list');
    const roomFilter = document.getElementById('room-filter');
    const dayFilter = document.getElementById('day-filter');

    // --- Check Role & Permissions ---
    const checkUserPermissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch Role and class_id from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, class_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            userRole = profile.role;
            userClassId = profile.class_id;
            
            // Show room filter only for admin or teacher roles
            if (userRole === 'admin' || userRole === 'teacher') {
                if (roomFilter) roomFilter.classList.remove('hidden');
            }
        }
    };

    // Day color mapping
    const dayColors = {
        0: 'bg-[#B29B58]',   // SUN
        1: 'bg-[#E46F20]',   // MON
        2: 'bg-[#D96C6C]',   // TUE
        3: 'bg-[#219653]',   // WED
        4: 'bg-[#E46F20]',   // THU
        5: 'bg-[#5B8DEF]',   // FRI
        6: 'bg-[#B08968]',   // SAT
    };

    const fetchSchedules = async () => {
        scheduleList.innerHTML = `
            <div class="space-y-3">
                <div class="w-full h-16 bg-[#1E1E1E]/10 border-2 border-[#1E1E1E]/20 skeleton"></div>
                <div class="w-full h-16 bg-[#1E1E1E]/10 border-2 border-[#1E1E1E]/20 skeleton" style="animation-delay:0.2s;"></div>
                <div class="w-full h-16 bg-[#1E1E1E]/10 border-2 border-[#1E1E1E]/20 skeleton" style="animation-delay:0.4s;"></div>
            </div>`;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase.from('schedule').select('*');

        // If student, fetch only their own class schedule
        if (userRole === 'student' && userClassId) {
            query = query.eq('room', userClassId);
        }

        const { data, error } = await query
            .order('day_of_week', { ascending: true })
            .order('period', { ascending: true });

        if (error) {
            scheduleList.innerHTML = `
                <div class="text-center py-10 flex flex-col items-center gap-3">
                    <div class="text-3xl">⚠️</div>
                    <p class="text-sm font-bold text-[#D96C6C]">Error loading schedule</p>
                </div>`;
            return;
        }

        // --- Update Room Filter options ---
        const currentFilter = roomFilter.value;
        const rooms = [...new Set(data.map(item => item.room))].filter(Boolean);
        roomFilter.innerHTML = '<option value="all">ALL ROOMS</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = `ROOM ${room}`;
            roomFilter.appendChild(option);
        });
        roomFilter.value = currentFilter;

        // --- Filter data by selected room and day ---
        const roomVal = roomFilter ? roomFilter.value : 'all';
        const dayVal = dayFilter ? dayFilter.value : 'all';

        let filteredData = data;
        
        if (roomVal !== 'all') {
            filteredData = filteredData.filter(item => item.room === roomVal);
        }
        
        if (dayVal !== 'all') {
            filteredData = filteredData.filter(item => item.day_of_week.toString() === dayVal);
        }

        if (filteredData.length === 0) {
            scheduleList.innerHTML = `
                <div class="text-center py-12 flex flex-col items-center gap-3">
                    <div class="text-4xl empty-float"><svg class="w-8 h-8" viewBox="-6 0 48 48" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Group_8" data-name="Group 8" transform="translate(-132 -89)"> <path id="Path_8" data-name="Path 8" d="M151,91h4V89h-4a4,4,0,0,0-4,4v18a4,4,0,1,0,4-4,3.955,3.955,0,0,0-2,.555V93A2,2,0,0,1,151,91Z" fill="#7d50f9"></path> <path id="Path_9" data-name="Path 9" d="M164,98H149v2h15a2,2,0,0,1,2,2v18a2,2,0,0,1-2,2H146a2,2,0,0,1-2-2V104a6,6,0,0,0-12,0v16a4,4,0,0,0,4,4h2v-2h-2a2,2,0,0,1-2-2V104a4,4,0,0,1,8,0v16a4,4,0,0,0,4,4h1v11h-9v2h28v-2h-9V124h7a4,4,0,0,0,4-4V102A4,4,0,0,0,164,98Zm-9,37h-6V124h2v6h2v-6h2Z" fill="#303033"></path> </g> </g></svg></div>
                    <p class="text-sm font-bold text-[#1E1E1E]/40 tracking-wider">There are no classes scheduled during this time.</p>
                </div>`;
            return;
        }

        scheduleList.innerHTML = '';
        filteredData.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = "schedule-card flex border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] bg-white overflow-hidden fade-in";
            row.style.animationDelay = `${index * 0.05}s`;

            const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const dayName = dayNames[item.day_of_week] || "N/A";
            const dayColor = dayColors[item.day_of_week] || 'bg-[#F2C00F]';

            row.innerHTML = `
                <div class="w-14 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] ${dayColor}">
                    <span class="text-[9px] font-bold opacity-70 uppercase">${dayName}</span>
                    <span class="text-xl font-black leading-tight">${item.period}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b border-[#1E1E1E]/15 bg-[#EEEDDE]/40 flex items-center gap-1.5">
                        <svg class="w-3 h-3 shrink-0 opacity-50" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="text-[10px] font-bold text-[#1E1E1E]/60">${item.start_time.substring(0, 5)} — ${item.end_time.substring(0, 5)}</span>
                    </div>
                    <div class="px-3 py-2 border-b border-[#1E1E1E]/10">
                        <p class="font-bold text-sm text-[#1E1E1E] leading-tight truncate">${escapeHTML(item.subject_name)}</p>
                    </div>
                    <div class="px-3 py-1.5 flex items-center gap-1.5">
                        <svg class="w-3 h-3 shrink-0 opacity-40" fill="none" stroke="#1E1E1E" stroke-width="2.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                        <span class="text-[10px] font-bold text-[#1E1E1E]/50 truncate">${escapeHTML(item.teacher_name)}</span>
                        <span class="ml-auto text-[9px] font-bold text-[#1E1E1E]/30 uppercase shrink-0">RM ${escapeHTML(item.room)}</span>
                    </div>
                </div>
            `;

            scheduleList.appendChild(row);
        });
    };

    if (roomFilter) roomFilter.addEventListener('change', fetchSchedules);
    if (dayFilter) dayFilter.addEventListener('change', fetchSchedules);

    // Set default day filter based on current day
    const setDefaultDay = () => {
        if (!dayFilter) return;
        const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        
        // If Saturday (6) or Sunday (0), default to Monday (1)
        if (today === 0 || today === 6) {
            dayFilter.value = "1";
        } else {
            // Check if today is a weekday (1-5), otherwise default to all or keep current
            if (today >= 1 && today <= 5) {
                dayFilter.value = today.toString();
            }
        }
    };

    // Initialize system: Check permissions then fetch data
    const init = async () => {
        setDefaultDay();
        await checkUserPermissions();
        await fetchSchedules();
    };
    init();

    backBtn.addEventListener('click', () => {
        window.location.hash = '#student-dashboard';
    });
}