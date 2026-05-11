import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from "../../../lib/ui";

export function initLeaderActivity(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');

    // Back to leader dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#leader-dashboard';
        });
    }

    // Detail Modal Elements
    const modalDetail = document.getElementById('modal-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const backdropDetail = document.getElementById('backdrop-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailDate = document.getElementById('detail-date');
    const detailLocation = document.getElementById('detail-location');
    const detailOrganizer = document.getElementById('detail-organizer');
    const detailDescription = document.getElementById('detail-description');

    let activitiesData = [];

    const fetchActivities = async () => {
        const listContainer = document.getElementById('event-list');
        listContainer.innerHTML = `
            <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                <p class="text-sm font-bold text-[#1E1E1E]/40 uppercase">Loading activities...</p>
            </div>
        `;

        const { data, error } = await supabase
            .from('school_activities')
            .select('*')
            .order('activity_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) {
            console.error('Error fetching activities:', error);
            showToast('Failed to load activities', 'error');
            listContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-sm font-bold text-[#E25C5C] uppercase">Error loading data</p>
                </div>
            `;
            return;
        }

        activitiesData = data || [];
        renderActivities();
    };

    const renderActivities = () => {
        const listContainer = document.getElementById('event-list');
        listContainer.innerHTML = '';

        if (activitiesData.length === 0) {
            listContainer.innerHTML = `
                <div class="bg-white border-2 border-[#1E1E1E] p-4 text-center shadow-[3px_3px_0px_#1E1E1E]">
                    <p class="text-sm font-bold text-[#1E1E1E]/40 uppercase">No activities found</p>
                </div>
            `;
            return;
        }

        activitiesData.forEach(activity => {
            const dateObj = new Date(activity.activity_date);
            const monthShort = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const dayNum = dateObj.getDate().toString().padStart(2, '0');
            const dayShort = dateObj.toLocaleString('en-US', { weekday: 'short' }).toUpperCase();

            const startTime = activity.start_time.substring(0, 5);
            const endTime = activity.end_time.substring(0, 5);

            const div = document.createElement('div');
            div.className = 'activity-row bg-white border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] overflow-hidden cursor-pointer hover:bg-[#F2C00F]/5 transition-colors group/row';
            div.dataset.id = activity.id;
            div.innerHTML = `
                <div class="flex items-stretch h-full">
                    <!-- Date Badge -->
                    <div class="w-16 shrink-0 bg-[#F2C00F] border-r-2 border-[#1E1E1E] flex flex-col items-center justify-center p-2 group-hover/row:bg-[#1E1E1E] group-hover/row:text-white transition-colors">
                        <span class="text-[8px] font-black uppercase opacity-60">${monthShort}</span>
                        <span class="text-xl font-black leading-tight">${dayNum}</span>
                        <span class="text-[8px] font-black uppercase opacity-60">${dayShort}</span>
                    </div>
                    <!-- Event Content -->
                    <div class="flex-1 p-3 min-w-0">
                        <div class="flex items-start justify-between gap-2 h-full">
                            <div class="flex-1 flex flex-col min-w-0 justify-center h-full">
                                <p class="text-xs font-black text-[#1E1E1E] uppercase tracking-wide truncate">${escapeHtml(activity.title)}</p>
                                <p class="text-[9px] font-bold text-[#1E1E1E]/50 mt-0.5">${startTime} - ${endTime} • ${escapeHtml(activity.location || 'TBA')}</p>
                                <p class="text-[9px] font-bold text-[#1E1E1E]/40 mt-1 line-clamp-1">${escapeHtml(activity.description || 'No description')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            listContainer.appendChild(div);
        });

        // Add event listeners
        document.querySelectorAll('.activity-row').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.id;
                openDetailModal(id);
            });
        });
    };

    const escapeHtml = (unsafe) => {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // --- Detail Modal Logic ---

    const openDetailModal = (id) => {
        const activity = activitiesData.find(a => a.id === id);
        if (!activity) return;

        detailTitle.textContent = activity.title;
        const dateObj = new Date(activity.activity_date);
        const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
        detailDate.textContent = `${dateStr} • ${activity.start_time.substring(0, 5)} - ${activity.end_time.substring(0, 5)}`;
        detailLocation.textContent = activity.location || 'Not Specified';
        detailOrganizer.textContent = activity.organizer || 'School';
        detailDescription.textContent = activity.description || 'No description provided.';

        modalDetail.classList.remove('hidden');
    };

    const closeDetailModal = () => {
        if (modalDetail) {
            const modalContent = modalDetail.querySelector('.fade-in');
            const backdropElem = document.getElementById('backdrop-detail');

            if (modalContent && backdropElem) {
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');
                backdropElem.classList.remove('backdrop-fade-in');
                backdropElem.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modalDetail.classList.add('hidden');
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');
                    backdropElem.classList.remove('backdrop-fade-out');
                    backdropElem.classList.add('backdrop-fade-in');
                }, 400);
            } else {
                modalDetail.classList.add('hidden');
            }
        }
    };

    if (btnCloseDetail) btnCloseDetail.addEventListener('click', closeDetailModal);
    if (backdropDetail) backdropDetail.addEventListener('click', closeDetailModal);

    // Initial fetch
    fetchActivities();
}
