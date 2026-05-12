// ==========================================
// COMMON JAVASCRIPT PATTERNS & TEMPLATES
// ==========================================

import { supabase } from '../../../lib/supabaseClient.js';
import { showToast } from '../../../lib/ui.js';

/**
 * 1. Fetch User Name Template
 * Fetches the currently logged-in user's metadata and updates the UI.
 */
export const fetchUserNameTemplate = async () => {
    const studentNameElem = document.getElementById('student-name');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user && user.user_metadata && studentNameElem) {
        const { firstname, lastname } = user.user_metadata;
        studentNameElem.textContent = `${firstname} ${lastname}`;
    }
    return user;
};

/**
 * 2. Check User Permissions Template
 * Retrieves the user's role and class_id from the profiles table.
 */
export const checkUserPermissionsTemplate = async () => {
    let userRole = 'student';
    let userClassId = null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, class_id')
        .eq('id', user.id)
        .single();

    if (profile) {
        userRole = profile.role;
        userClassId = profile.class_id;
    }
    return { userRole, userClassId, user };
};

/**
 * 3. Modal Open/Close Template (with animations)
 * Handles fade-in and fade-out animations for modals and backdrops.
 */
export const initModalTemplate = () => {
    const modal = document.getElementById('modal');
    const backdrop = document.getElementById('backdrop');
    let timer;

    const openModal = (data = null) => {
        if (!modal) return;
        modal.classList.remove('hidden');
        
        // If data is passed, populate inputs here
        if (data) {
            // e.g. document.getElementById('edit-id').value = data.id;
        }
    };

    const closeModal = () => {
        if (!modal) return;
        const modalContent = modal.querySelector('.fade-in');

        if (modalContent && backdrop) {
            modalContent.classList.remove('fade-in');
            modalContent.classList.add('fade-out');

            backdrop.classList.remove('backdrop-fade-in');
            backdrop.classList.add('backdrop-fade-out');

            setTimeout(() => {
                modal.classList.add('hidden');
                
                // Reset classes for next time
                modalContent.classList.remove('fade-out');
                modalContent.classList.add('fade-in');

                backdrop.classList.remove('backdrop-fade-out');
                backdrop.classList.add('backdrop-fade-in');
            }, 400);
        } else {
            modal.classList.add('hidden');
        }
        if (timer) clearInterval(timer);
    };

    return { openModal, closeModal };
};

/**
 * 4. Countdown Timer / Confirmation Modal Template
 * Common pattern used in submit/delete modals where a wait time is required.
 */
export const confirmModalWithTimerTemplate = () => {
    const confirmBtn = document.getElementById('btn-confirm');
    const countdownCircle = document.getElementById('countdown-circle');
    const countdownNumber = document.getElementById('countdown-number');
    const countdownLabel = document.getElementById('countdown-label');
    let countdownTimer;

    const startCountdown = (seconds = 5) => {
        if (!confirmBtn) return;
        
        confirmBtn.disabled = true;
        // Apply disabled styling
        confirmBtn.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-gray-300 text-gray-500 cursor-not-allowed';
        
        let secondsLeft = seconds;
        const totalDash = 97.39; // Adjust based on SVG circle size

        if (countdownCircle) countdownCircle.style.strokeDashoffset = '0';
        if (countdownNumber) countdownNumber.textContent = secondsLeft.toString();
        if (countdownLabel) countdownLabel.textContent = 'Please wait...';

        countdownTimer = setInterval(() => {
            secondsLeft--;
            if (countdownNumber) countdownNumber.textContent = secondsLeft.toString();
            if (countdownCircle) countdownCircle.style.strokeDashoffset = `${totalDash * ((seconds - secondsLeft) / seconds)}`;

            if (secondsLeft <= 0) {
                clearInterval(countdownTimer);
                
                if (countdownLabel) countdownLabel.textContent = 'Ready!';
                if (countdownNumber) countdownNumber.textContent = '✓';
                
                // Unlock button
                confirmBtn.disabled = false;
                // Apply enabled styling
                confirmBtn.className = 'flex-1 py-3 border-2 border-[#1E1E1E] shadow-[4px_4px_0px_#1E1E1E] font-black text-sm uppercase tracking-wider transition-all bg-[#219653] text-[#1E1E1E] hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer';
            }
        }, 1000);
    };

    const clearCountdown = () => {
        if (countdownTimer) clearInterval(countdownTimer);
    };

    return { startCountdown, clearCountdown };
};

/**
 * 5. Data Filtering & Rendering Template
 * Pattern for fetching data, applying search/select filters, and rendering lists.
 */
export const dataListTemplate = () => {
    const listContainer = document.getElementById('data-list');
    const searchFilter = document.getElementById('search-filter');
    const roleFilter = document.getElementById('role-filter');
    
    let allData = [];

    const fetchData = async () => {
        if (listContainer) listContainer.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        
        const { data, error } = await supabase.from('some_table').select('*');
        if (error) {
            showToast('Error loading data', 'error');
            return;
        }
        allData = data || [];
        renderData();
    };

    const renderData = () => {
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';
        const role = roleFilter ? roleFilter.value : 'all';

        let filtered = allData;

        if (role !== 'all') {
            filtered = filtered.filter(item => item.role === role);
        }

        if (searchTerm) {
            filtered = filtered.filter(item => 
                (item.name || '').toLowerCase().includes(searchTerm)
            );
        }

        if (listContainer) {
            listContainer.innerHTML = '';
            if (filtered.length === 0) {
                listContainer.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">No data found.</div>`;
                return;
            }

            filtered.forEach(item => {
                const row = document.createElement('div');
                row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in";
                row.innerHTML = `
                    <div class="p-3">
                        ${item.name}
                    </div>
                `;
                listContainer.appendChild(row);
            });
        }
    };

    // Attach listeners
    if (searchFilter) searchFilter.addEventListener('input', renderData);
    if (roleFilter) roleFilter.addEventListener('change', renderData);

    return { fetchData, renderData };
};
