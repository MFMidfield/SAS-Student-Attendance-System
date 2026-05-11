import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from "../../../lib/ui";

export function initTeacherActivity(imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');

    // Back to admin dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#teacher-dashboard';
        });
    }

    // Modal Elements
    const modal = document.getElementById('modal');
    const backdrop = document.getElementById('backdrop');
    const btnAddEvent = document.getElementById('btn-add-event');
    const btnClose = document.getElementById('btn-close');
    const btnSave = document.getElementById('btn-save');
    const btnDelete = document.getElementById('btn-delete');
    
    // Form Inputs
    const modalTitle = document.getElementById('modal-title');
    const editIdInput = document.getElementById('edit-id');
    const titleInput = document.getElementById('title');
    const dateInput = document.getElementById('activity_date');
    const locationInput = document.getElementById('location');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const organizerInput = document.getElementById('organizer');
    const descriptionInput = document.getElementById('description');

    // Detail Modal Elements
    const modalDetail = document.getElementById('modal-detail');
    const btnCloseDetail = document.getElementById('btn-close-detail');
    const backdropDetail = document.getElementById('backdrop-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailDate = document.getElementById('detail-date');
    const detailLocation = document.getElementById('detail-location');
    const detailOrganizer = document.getElementById('detail-organizer');
    const detailDescription = document.getElementById('detail-description');

    // Confirm Modal Elements
    const confirmModal = document.getElementById('modal-confirm');
    const confirmBackdrop = document.getElementById('backdrop-confirm');
    const btnConfirmAction = document.getElementById('btn-confirm-action');
    const btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmDesc = document.getElementById('confirm-desc');
    const confirmIcon = document.getElementById('confirm-icon');
    const confirmIconWrapper = document.getElementById('confirm-icon-wrapper');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownLabel = document.getElementById('countdown-label');
    const countdownCircle = document.getElementById('countdown-circle');
    const countdownWrapper = document.getElementById('countdown-wrapper');

    let activitiesData = [];
    let countdownInterval = null;
    let pendingAction = null; // { type: 'save' | 'delete', data?: any }

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
                    <!-- Edit Button -->
                    <button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors" data-id="${activity.id}">
                        <svg class="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                </div>
            `;
            listContainer.appendChild(div);
        });

        // Add event listeners
        document.querySelectorAll('.activity-row').forEach(row => {
            row.addEventListener('click', (e) => {
                // If the click is on the edit button, don't open detail
                if (e.target.closest('.edit-item-btn')) return;
                
                const id = row.dataset.id;
                openDetailModal(id);
            });
        });

        document.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click
                const id = btn.dataset.id;
                openModal(id);
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



    // --- Modal Logic ---

    const openModal = (id = null) => {
        modal.classList.remove('hidden');
        if (id) {
            const activity = activitiesData.find(a => a.id === id);
            if (activity) {
                modalTitle.textContent = 'Edit Activity';
                editIdInput.value = activity.id;
                titleInput.value = activity.title;
                dateInput.value = activity.activity_date;
                locationInput.value = activity.location || '';
                startTimeInput.value = activity.start_time.substring(0, 5);
                endTimeInput.value = activity.end_time.substring(0, 5);
                organizerInput.value = activity.organizer || '';
                descriptionInput.value = activity.description || '';
                btnDelete.classList.remove('hidden');
            }
        } else {
            modalTitle.textContent = 'Add Activity';
            editIdInput.value = '';
            titleInput.value = '';
            dateInput.value = '';
            locationInput.value = '';
            startTimeInput.value = '';
            endTimeInput.value = '';
            organizerInput.value = '';
            descriptionInput.value = '';
            btnDelete.classList.add('hidden');
        }
    };

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdropElem = document.getElementById('backdrop');

            if (modalContent && backdropElem) {
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');
                backdropElem.classList.remove('backdrop-fade-in');
                backdropElem.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modal.classList.add('hidden');
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');
                    backdropElem.classList.remove('backdrop-fade-out');
                    backdropElem.classList.add('backdrop-fade-in');
                }, 400);
            } else {
                modal.classList.add('hidden');
            }
        }
    };

    btnAddEvent.addEventListener('click', () => openModal());
    btnClose.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

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

    // --- Confirmation Modal Logic ---

    const openConfirmModal = (type, data = null) => {
        pendingAction = { type, data };
        confirmModal.classList.remove('hidden');
        btnConfirmAction.disabled = true;
        btnConfirmAction.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
        btnConfirmAction.classList.remove('bg-[#73CB8F]', 'bg-[#E25C5C]', 'text-[#1E1E1E]', 'text-white', 'active:translate-x-[2px]', 'active:translate-y-[2px]', 'active:shadow-none');
        
        clearInterval(countdownInterval);

        const unlockButton = () => {
            countdownNumber.textContent = '✓';
            countdownLabel.textContent = 'Ready';
            btnConfirmAction.disabled = false;
            btnConfirmAction.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            btnConfirmAction.classList.add('active:translate-x-[2px]', 'active:translate-y-[2px]', 'active:shadow-none');
            
            if (type === 'save') {
                btnConfirmAction.classList.add('bg-[#73CB8F]', 'text-[#1E1E1E]');
            } else {
                btnConfirmAction.classList.add('bg-[#E25C5C]', 'text-white');
            }
        };

        if (type === 'save') {
            confirmTitle.textContent = 'Save Activity';
            confirmDesc.textContent = 'Are you sure you want to save these details?';
            confirmIconWrapper.className = 'w-14 h-14 border-2 border-[#1E1E1E] flex items-center justify-center shadow-[3px_3px_0px_#1E1E1E] bg-[#73CB8F]';
            confirmIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>';
            btnConfirmAction.textContent = 'Save';
            
            countdownNumber.textContent = '...';
            countdownLabel.textContent = 'Wait';
            countdownCircle.style.strokeDashoffset = '97.39'; 
            
            // Hide countdown UI for save action
            countdownWrapper.classList.add('hidden');

            setTimeout(unlockButton, 500);
        } else if (type === 'delete') {
            // Show countdown UI for delete action
            countdownWrapper.classList.remove('hidden');
            
            let seconds = 3;
            countdownNumber.textContent = seconds;
            countdownLabel.textContent = 'Please wait...';
            countdownCircle.style.strokeDashoffset = '0';

            confirmTitle.textContent = 'Delete Activity';
            confirmDesc.textContent = 'This action cannot be undone. Proceed?';
            confirmIconWrapper.className = 'w-14 h-14 border-2 border-[#1E1E1E] flex items-center justify-center shadow-[3px_3px_0px_#1E1E1E] bg-[#E25C5C]';
            confirmIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>';
            confirmIcon.classList.add('text-white');
            btnConfirmAction.textContent = 'Delete';

            countdownInterval = setInterval(() => {
                seconds--;
                if (seconds > 0) {
                    countdownNumber.textContent = seconds;
                    const offset = 97.39 - (seconds / 3) * 97.39;
                    countdownCircle.style.strokeDashoffset = offset;
                } else {
                    clearInterval(countdownInterval);
                    unlockButton();
                }
            }, 1000);
        }
    };

    const closeConfirmModal = () => {
        if (confirmModal) {
            const modalContent = confirmModal.querySelector('.fade-in');
            const backdropElem = document.getElementById('backdrop-confirm');

            if (modalContent && backdropElem) {
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');
                backdropElem.classList.remove('backdrop-fade-in');
                backdropElem.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    confirmModal.classList.add('hidden');
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');
                    backdropElem.classList.remove('backdrop-fade-out');
                    backdropElem.classList.add('backdrop-fade-in');
                    clearInterval(countdownInterval);
                    pendingAction = null;
                }, 400);
            } else {
                confirmModal.classList.add('hidden');
                clearInterval(countdownInterval);
                pendingAction = null;
            }
        }
    };

    btnConfirmCancel.addEventListener('click', closeConfirmModal);
    confirmBackdrop.addEventListener('click', closeConfirmModal);

    btnSave.addEventListener('click', () => {
        const id = editIdInput.value;
        const title = titleInput.value.trim();
        const activity_date = dateInput.value;
        const location = locationInput.value.trim();
        const start_time = startTimeInput.value;
        const end_time = endTimeInput.value;
        const organizer = organizerInput.value.trim();
        const description = descriptionInput.value.trim();

        if (!title || !activity_date || !start_time || !end_time) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        if (start_time >= end_time) {
            showToast('Start time must be before end time', 'error');
            return;
        }

        const data = { id, title, activity_date, location, start_time, end_time, organizer, description };
        openConfirmModal('save', data);
    });

    btnDelete.addEventListener('click', () => {
        const id = editIdInput.value;
        if (id) {
            openConfirmModal('delete', { id });
        }
    });

    btnConfirmAction.addEventListener('click', async () => {
        if (!pendingAction) return;

        btnConfirmAction.disabled = true;
        btnConfirmAction.innerHTML = '<span class="animate-pulse">Processing...</span>';

        if (pendingAction.type === 'save') {
            const { id, title, activity_date, location, start_time, end_time, organizer, description } = pendingAction.data;
            const payload = { title, activity_date, location, start_time, end_time, organizer, description };

            let error;
            if (id) {
                const res = await supabase.from('school_activities').update(payload).eq('id', id);
                error = res.error;
            } else {
                const res = await supabase.from('school_activities').insert([payload]);
                error = res.error;
            }

            if (error) {
                console.error(error);
                showToast('Error saving activity', 'error');
            } else {
                showToast('Activity saved successfully', 'success');
                closeModal();
                fetchActivities();
            }

        } else if (pendingAction.type === 'delete') {
            const { id } = pendingAction.data;
            const { error } = await supabase.from('school_activities').delete().eq('id', id);
            
            if (error) {
                console.error(error);
                showToast('Error deleting activity', 'error');
            } else {
                showToast('Activity deleted successfully', 'success');
                closeModal();
                fetchActivities();
            }
        }

        closeConfirmModal();
    });

    // Initial fetch
    fetchActivities();
}

