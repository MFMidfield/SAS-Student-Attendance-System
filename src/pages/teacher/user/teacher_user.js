import { supabase } from "../../../lib/supabaseClient";
import { escapeHTML } from "../../../lib/ui";

export function initTeacherUser(userAvatar, pfdefault) {
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

    if (studentImage && userAvatar) {
        studentImage.src = userAvatar;
    }

    let userRole = 'student'; 
    let userClassId = null; 

    const scheduleList = document.getElementById('schedule-list');
    const searchFilter = document.getElementById('search-filter');

    let allUsersData = []; // Store all user data

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

    // --- Render Users ---
    const renderUsers = () => {
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // Filter by search term (firstname, lastname, stu_id)
        let filtered = searchTerm 
            ? allUsersData.filter(item => {
                const fullName = `${item.firstname} ${item.lastname}`.toLowerCase();
                const stuId = (item.stu_id || '').toLowerCase();
                return fullName.includes(searchTerm) || stuId.includes(searchTerm);
            })
            : allUsersData;

        if (filtered.length === 0) {
            scheduleList.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                ${searchTerm ? 'No users matching your search.' : 'No users found.'}
            </div>`;
            return;
        }

        scheduleList.innerHTML = '';
        filtered.forEach(item => {
            const avatarData = item.user_assets?.find(a => a.asset_type === 'avatar');
            const avatarUrl = avatarData ? avatarData.url : pfdefault;
            const row = document.createElement('div');
            row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in";

            const displayName = `${item.firstname || ''} ${item.lastname || ''}`.trim() || '(No Name)';
            const stuId = item.stu_id || '-';
            const classId = item.class_id || '-';

            row.innerHTML = `
                <div class="w-15 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] bg-[#F2C00F] overflow-hidden">
                    <img src="${avatarUrl}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold truncate">
                        ID: ${escapeHTML(stuId)} &nbsp;|&nbsp; Class: ${escapeHTML(classId)} |&nbsp; Role: ${escapeHTML(item.role || 'N/A')}
                    </div>
                    <div class="px-3 py-2 font-bold text-[13px] leading-tight truncate">
                        ${escapeHTML(displayName)}
                    </div>
                </div>
            `;
            scheduleList.appendChild(row);
        });
    };

    // --- Fetch Users from Database ---
    const fetchUsers = async () => {
        if (!scheduleList) return;
        scheduleList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('profiles')
            .select(`*, user_assets(url, asset_type)`);

        if (userRole === 'teacher' && userClassId) {
            query = query.eq('class_id', userClassId).eq('role', 'student');
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            scheduleList.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">Error loading data</div>';
            return;
        }

        allUsersData = data || [];
        renderUsers();
    };

    if (searchFilter) searchFilter.addEventListener('input', renderUsers);

    const init = async () => {
        await checkUserPermissions();
        await fetchUsers();
    };
    init();

    if (backBtn) backBtn.addEventListener('click', () => {
        window.location.hash = '#teacher-dashboard';
    });
}
