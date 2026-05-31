import { supabase } from "../../../lib/supabaseClient";
import { showToast, escapeHTML } from "../../../lib/ui";

export function initSchedule(role, imageLogo, imageBander) {
    const backBtn = document.getElementById('btn-back');
    // We don't have student-image or student-name in this HTML (except the portal title)
    // Wait, the HTML DOES NOT have student-image or bander-image.
    // Ah, wait. `admin_schedule.html` had no student-image or bander-image.
    // Let me double check `admin_schedule.html`.
    // Actually, `admin_schedule.html` DOES NOT have `student-image`!
    // But `admin_schedule.js` references it. If it's missing, it's just null.
    // Let me keep it for compatibility.

    const hasEditAccess = (role === 'admin' || role === 'teacher');
    let userClassId = null;

    const portalTitle = document.getElementById('portal-title');
    if (portalTitle) {
        if (role === 'admin') portalTitle.textContent = 'Admin Portal';
        else if (role === 'teacher') portalTitle.textContent = 'Teacher Portal';
        else if (role === 'leader') portalTitle.textContent = 'Leader Portal';
        else portalTitle.textContent = 'Student Portal';
    }

    const periodTimes = {
        "0": { start: "08:00", end: "08:30" },
        "1": { start: "08:30", end: "09:20" },
        "2": { start: "09:20", end: "10:10" },
        "3": { start: "10:10", end: "11:00" },
        "4": { start: "11:00", end: "11:50" },
        "5": { start: "11:50", end: "12:40" },
        "6": { start: "12:40", end: "13:30" },
        "7": { start: "13:30", end: "14:20" },
        "8": { start: "14:20", end: "15:10" },
        "9": { start: "15:10", end: "16:00" },
        "10": { start: "16:00", end: "16:50" }
    };

    let Timer;
    let deleteTimer;
    let draftedSchedules = []; // Store multiple drafted schedules

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const editIdInput = document.getElementById('edit-id');
    const closeBtn = document.getElementById('btn-close');
    const addBtn = document.getElementById('btn-add');
    const confirmBtn = document.getElementById('btn-confirm');
    const deleteBtn = document.getElementById('btn-delete');
    const scheduleList = document.getElementById('schedule-list');
    const roomFilter = document.getElementById('room-filter');
    const searchFilter = document.getElementById('search-filter');
    const dayFilterBtns = document.querySelectorAll('.day-filter-btn');

    // New Draft/Bulk Elements
    const btnAddToTemp = document.getElementById('btn-add-to-temp');
    const tempSection = document.getElementById('temp-list-section');
    const tempScheduleList = document.getElementById('temp-schedule-list');
    const tempCount = document.getElementById('temp-count');

    let selectedDayFilter = '1';
    let selectedRoomFilter = null;

    // Delete Confirmation Elements
    const deleteConfirmModal = document.getElementById('modal-delete-confirm');
    const deleteTimerDisplay = document.getElementById('delete-timer');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');

    // Fields
    const dayInput = document.getElementById('days');
    const periodInput = document.getElementById('period');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const subjectInput = document.getElementById('subject');
    const classIdInput = document.getElementById('class_id');
    const teacherNameInput = document.getElementById('teacherName');

    if (hasEditAccess) {
        const updateTimesForPeriod = () => {
            const pVal = periodInput.value;
            const timeSetup = periodTimes[pVal];
            if (timeSetup) {
                startTimeInput.value = timeSetup.start;
                endTimeInput.value = timeSetup.end;
                
                const startDisplay = document.getElementById('start_time_display');
                const endDisplay = document.getElementById('end_time_display');
                if (startDisplay) startDisplay.textContent = timeSetup.start;
                if (endDisplay) endDisplay.textContent = timeSetup.end;
            }

            // Lock subject check or auto-set Homeroom if period 0
            if (pVal === '0') {
                subjectInput.value = 'Homeroom';
                subjectInput.disabled = true;
                subjectInput.classList.add('opacity-50', 'cursor-not-allowed');
            } else {
                if (subjectInput.value === 'Homeroom') {
                    subjectInput.value = '';
                }
                subjectInput.disabled = false;
                subjectInput.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        };

        if (periodInput) {
            periodInput.addEventListener('change', updateTimesForPeriod);
        }

        if (subjectInput) {
            subjectInput.addEventListener('change', () => {
                if (subjectInput.value.toLowerCase() === 'homeroom') {
                    periodInput.value = '0';
                    updateTimesForPeriod();
                }
            });
        }
    }

    // --- Check Role & Permissions ---
    const checkUserPermissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch class_id from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('class_id')
            .eq('id', user.id)
            .single();

        if (profile) {
            userClassId = profile.class_id;
        }

        if (hasEditAccess) {
            if (addBtn) addBtn.classList.remove('hidden');
        }
        
        // Show room filter for admin and teacher, so they can manage multiple rooms
        if (role === 'admin' || role === 'teacher') {
            if (roomFilter) roomFilter.classList.remove('hidden');
        }
    };

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdrop = document.getElementById('backdrop');

            if (modalContent && backdrop) {
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');

                backdrop.classList.remove('backdrop-fade-in');
                backdrop.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modal.classList.add('hidden');
                    modalContent.classList.remove('fade-out');
                    modalContent.classList.add('fade-in');

                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }, 400);
            } else {
                modal.classList.add('hidden');
            }
        }
        clearInterval(Timer);
        // Clear drafts on close
        draftedSchedules = [];
        if (tempSection) tempSection.classList.add('hidden');
        if (confirmBtn) confirmBtn.textContent = 'Save';
    };

    const openModal = (mode = 'add', data = null) => {
        if (!hasEditAccess || !modal) return;
        modal.classList.remove('hidden');

        if (mode === 'edit' && data) {
            modalTitle.textContent = 'Edit Schedule';
            editIdInput.value = data.id;
            // Convert numbers 0-6 back to day names for Select
            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            dayInput.value = days[data.day_of_week];
            periodInput.value = data.period;
            startTimeInput.value = data.start_time;
            endTimeInput.value = data.end_time;
            subjectInput.value = data.subject_name;
            classIdInput.value = data.room;
            teacherNameInput.value = data.teacher_name;

            // Hide add to list in edit mode
            if (btnAddToTemp) btnAddToTemp.classList.add('hidden');
            if (confirmBtn) confirmBtn.textContent = 'Save';
            draftedSchedules = [];
            if (tempSection) tempSection.classList.add('hidden');

            // --- Restrictions for special subjects (Period 0 or Homeroom) ---
            const isSpecial = (data.period === 0 || (data.subject_name || '').toLowerCase() === 'homeroom');

            if (isSpecial) {
                // Prohibit deletion
                if (deleteBtn) deleteBtn.classList.add('hidden');
                // Lock important fields
                dayInput.disabled = true;
                periodInput.disabled = true;
                subjectInput.disabled = true;
                classIdInput.disabled = true;

                // Add styles to look locked
                [dayInput, periodInput, subjectInput, classIdInput].forEach(el => {
                    el.classList.add('opacity-50', 'cursor-not-allowed');
                });
            } else {
                // Show Delete button in normal Edit mode
                if (deleteBtn) deleteBtn.classList.remove('hidden');
                // Unlock fields
                [dayInput, periodInput, subjectInput, classIdInput].forEach(el => {
                    el.disabled = false;
                    el.classList.remove('opacity-50', 'cursor-not-allowed');
                });
            }

            // Update time displays
            const startDisplay = document.getElementById('start_time_display');
            const endDisplay = document.getElementById('end_time_display');
            const startVal = data.start_time ? data.start_time.substring(0, 5) : '--:--';
            const endVal = data.end_time ? data.end_time.substring(0, 5) : '--:--';
            if (startDisplay) startDisplay.textContent = startVal;
            if (endDisplay) endDisplay.textContent = endVal;
        } else {
            modalTitle.textContent = 'Add Schedule';
            editIdInput.value = '';
            // Reset fields
            [classIdInput, teacherNameInput].forEach(i => i.value = '');
            
            // Set default period to 1
            periodInput.value = "1";
            const timeSetup = periodTimes["1"];
            startTimeInput.value = timeSetup.start;
            endTimeInput.value = timeSetup.end;

            const startDisplay = document.getElementById('start_time_display');
            const endDisplay = document.getElementById('end_time_display');
            if (startDisplay) startDisplay.textContent = timeSetup.start;
            if (endDisplay) endDisplay.textContent = timeSetup.end;

            // Show add to list in add mode
            if (btnAddToTemp) btnAddToTemp.classList.remove('hidden');
            if (confirmBtn) confirmBtn.textContent = 'Save';
            draftedSchedules = [];
            if (tempSection) tempSection.classList.add('hidden');

            // Unlock subject and auto-clear
            subjectInput.value = '';
            subjectInput.disabled = false;
            subjectInput.classList.remove('opacity-50', 'cursor-not-allowed');

            // Unlock all fields for Add mode
            [dayInput, periodInput, classIdInput].forEach(el => {
                el.disabled = false;
                el.classList.remove('opacity-50', 'cursor-not-allowed');
            });

            // Hide Delete button in Add mode
            if (deleteBtn) deleteBtn.classList.add('hidden');
        }
    };

    const validateFields = () => {
        const fieldsToCheck = ['days', 'period', 'subject', 'class_id', 'teacherName', 'start_time', 'end_time'];
        let isAllValid = true;
        fieldsToCheck.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (!element.value || element.value.trim() === "") {
                    element.classList.add('border-red-500');
                    element.classList.add('shake-animation');
                    setTimeout(() => {
                        element.classList.remove('border-red-500');
                        element.classList.remove('shake-animation');
                        element.classList.add('border-[#1E1E1E]');
                    }, 3000);
                    isAllValid = false;
                } else {
                    element.classList.remove('border-red-500');
                }
            }
        });
        return isAllValid;
    };

    const renderTempList = () => {
        if (!tempScheduleList) return;
        
        if (draftedSchedules.length === 0) {
            if (tempSection) tempSection.classList.add('hidden');
            if (confirmBtn) confirmBtn.textContent = 'Save';
            return;
        }

        if (tempSection) tempSection.classList.remove('hidden');
        
        const count = draftedSchedules.length;
        if (tempCount) tempCount.textContent = count;
        if (confirmBtn) confirmBtn.textContent = `Insert All (${count})`;

        tempScheduleList.innerHTML = '';
        draftedSchedules.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = "flex items-center justify-between border-2 border-[#1E1E1E] p-2 bg-[#EEEDDE]/30 text-xs font-bold shadow-[2px_2px_0px_#1E1E1E] mb-2";
            
            const daysArray = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
            const dayName = daysArray[item.day_of_week] || "N/A";

            row.innerHTML = `
                <div class="flex-1 min-w-0 flex items-center gap-1.5">
                    <span class="bg-[#F2C00F] px-1 border border-[#1E1E1E] text-[9px] font-black">${dayName} P.${item.period}</span>
                    <span class="truncate font-bold text-[#1E1E1E]">${escapeHTML(item.subject_name)}</span>
                    <span class="opacity-50 text-[10px] truncate">(${escapeHTML(item.room)})</span>
                </div>
                <button type="button" class="btn-remove-temp text-[#E25C5C] hover:bg-red-50 p-1 border border-[#1E1E1E] bg-white transition-colors cursor-pointer" data-index="${index}">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            `;
            
            row.querySelector('.btn-remove-temp').addEventListener('click', () => {
                draftedSchedules.splice(index, 1);
                renderTempList();
            });

            tempScheduleList.appendChild(row);
        });
    };

    let allSchedulesData = [];

    const renderSchedules = () => {
        if (!scheduleList) return;

        const currentFilter = roomFilter ? roomFilter.value : '';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // --- Filter by selected room if available ---
        let filteredData = allSchedulesData;
        if (currentFilter) {
            filteredData = filteredData.filter(item => item.room === currentFilter);
        }

        // --- Filter by search term (subject, teacher, room, period) ---
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
            row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in";
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
                ${hasEditAccess ? `
                <button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                ` : ''}
            `;

            if (hasEditAccess) {
                row.querySelector('.edit-item-btn').addEventListener('click', () => openModal('edit', item));
            }
            scheduleList.appendChild(row);
        });
    };

    const fetchSchedules = async () => {
        scheduleList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        
        let query = supabase.from('schedule').select('*');

        // Only Leader and Student are restricted to their class_id
        if ((role === 'student' || role === 'leader') && userClassId) {
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

        // --- Update Room Filter options for Admin/Teacher ---
        if (role === 'admin' || role === 'teacher') {
            const rooms = [...new Set(allSchedulesData.map(item => item.room))].filter(Boolean);
            rooms.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

            roomFilter.innerHTML = '';
            // Option to show all
            if (role === 'teacher') {
                 const optionAll = document.createElement('option');
                 optionAll.value = '';
                 optionAll.textContent = 'All Classes';
                 roomFilter.appendChild(optionAll);
            }

            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `ROOM ${room}`;
                roomFilter.appendChild(option);
            });

            if (selectedRoomFilter === null) {
                if (role === 'admin' && rooms.length > 0) {
                    selectedRoomFilter = rooms[0]; // default to lowest room for admin
                } else {
                    selectedRoomFilter = '';
                }
            }
            roomFilter.value = selectedRoomFilter;
        }

        renderSchedules();
    };

    // --- Delete Flow ---
    const openDeleteConfirmModal = () => {
        if (!deleteConfirmModal) return;
        deleteConfirmModal.classList.remove('hidden');

        let timeLeft = 5;
        deleteTimerDisplay.textContent = timeLeft;

        clearInterval(deleteTimer);
        deleteTimer = setInterval(() => {
            timeLeft--;
            deleteTimerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                closeDeleteConfirm();
            }
        }, 1000);
    };

    const closeDeleteConfirm = () => {
        if (!deleteConfirmModal) return;
        const modalContent = deleteConfirmModal.querySelector('.fade-in');
        const backdrop = document.getElementById('backdrop-delete');

        if (modalContent && backdrop) {
            modalContent.classList.remove('fade-in');
            modalContent.classList.add('fade-out');
            backdrop.classList.add('backdrop-fade-out');

            setTimeout(() => {
                deleteConfirmModal.classList.add('hidden');
                modalContent.classList.remove('fade-out');
                modalContent.classList.add('fade-in');
                backdrop.classList.remove('backdrop-fade-out');
                clearInterval(deleteTimer);
            }, 400);
        } else {
            deleteConfirmModal.classList.add('hidden');
            clearInterval(deleteTimer);
        }
    };

    const handleActualDelete = async () => {
        const id = editIdInput.value;
        if (!id) return;

        const { error } = await supabase.from('schedule').delete().eq('id', id);

        if (error) {
            showToast("Failed to delete", "error");
        } else {
            showToast("Deleted successfully", "success");
            closeDeleteConfirm();
            closeModal();
            fetchSchedules();
        }
    };

    const handleSave = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let result;
        if (editIdInput.value) {
            const daysMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
            let subjValue = subjectInput.value;
            if (periodInput.value === '0' && (!subjValue || subjValue.trim() === '')) {
                subjValue = 'Homeroom';
            }
            const scheduleData = {
                subject_name: subjValue,
                day_of_week: daysMap[dayInput.value],
                period: parseInt(periodInput.value),
                start_time: startTimeInput.value,
                end_time: endTimeInput.value,
                room: classIdInput.value,
                teacher_name: teacherNameInput.value
            };
            result = await supabase.from('schedule').update(scheduleData).eq('id', editIdInput.value);
        } else {
            if (draftedSchedules.length > 0) {
                result = await supabase.from('schedule').insert(draftedSchedules);
            } else {
                const daysMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
                let subjValue = subjectInput.value;
                if (periodInput.value === '0' && (!subjValue || subjValue.trim() === '')) {
                    subjValue = 'Homeroom';
                }
                const scheduleData = {
                    subject_name: subjValue,
                    day_of_week: daysMap[dayInput.value],
                    period: parseInt(periodInput.value),
                    start_time: startTimeInput.value,
                    end_time: endTimeInput.value,
                    room: classIdInput.value,
                    teacher_name: teacherNameInput.value
                };
                result = await supabase.from('schedule').insert([scheduleData]);
            }
        }

        if (result.error) {
            showToast("Failed to save schedule", "error");
        } else {
            const savedCount = (!editIdInput.value && draftedSchedules.length > 0) ? draftedSchedules.length : 1;
            showToast(savedCount > 1 ? `Successfully inserted ${savedCount} schedules!` : "Schedule saved successfully!", "success");
            draftedSchedules = [];
            closeModal();
            fetchSchedules();
        }
    };

    if (hasEditAccess) {
        if (addBtn) addBtn.addEventListener('click', () => openModal('add'));
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (deleteBtn) deleteBtn.addEventListener('click', openDeleteConfirmModal);
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleActualDelete);
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
        
        if (btnAddToTemp) {
            btnAddToTemp.addEventListener('click', () => {
                if (!validateFields()) {
                    showToast("Please fill in all fields before adding to list", "error");
                    return;
                }

                const daysMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

                let subjValue = subjectInput.value;
                if (periodInput.value === '0' && (!subjValue || subjValue.trim() === '')) {
                    subjValue = 'Homeroom';
                }

                const scheduleData = {
                    subject_name: subjValue,
                    day_of_week: daysMap[dayInput.value],
                    period: parseInt(periodInput.value),
                    start_time: startTimeInput.value,
                    end_time: endTimeInput.value,
                    room: classIdInput.value,
                    teacher_name: teacherNameInput.value
                };

                // Check duplicate in local draft
                const isDuplicate = draftedSchedules.some(item => 
                    item.day_of_week === scheduleData.day_of_week && 
                    item.period === scheduleData.period && 
                    item.room === scheduleData.room
                );

                if (isDuplicate) {
                    showToast("This slot is already added to the draft list", "error");
                    return;
                }

                // Check duplicate in database loaded data
                const isDuplicateInDb = allSchedulesData.some(item => 
                    item.day_of_week === scheduleData.day_of_week && 
                    item.period === scheduleData.period && 
                    item.room === scheduleData.room
                );

                if (isDuplicateInDb) {
                    showToast("This slot already exists in the timetable", "error");
                    return;
                }

                draftedSchedules.push(scheduleData);
                showToast(`Added "${subjValue}" to draft list`, "success");

                renderTempList();

                // Clear subject input
                subjectInput.value = '';

                // Auto-increment period
                const currentPeriod = parseInt(periodInput.value);
                if (currentPeriod < 10 && currentPeriod >= 0) {
                    periodInput.value = (currentPeriod + 1).toString();
                    updateTimesForPeriod();
                }
            });
        }

        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            if (editIdInput.value) {
                if (validateFields()) {
                    handleSave();
                } else {
                    showToast("Please fill in all fields", "error");
                }
            } else {
                if (draftedSchedules.length > 0) {
                    handleSave();
                } else {
                    if (validateFields()) {
                        handleSave();
                    } else {
                        showToast("Please fill in all fields or add to list first", "error");
                    }
                }
            }
        });
    }

    if (roomFilter) {
        roomFilter.addEventListener('change', () => {
            selectedRoomFilter = roomFilter.value;
            renderSchedules();
        });
    }
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

    // Initializing: Check permissions first, then fetch data
    const init = async () => {
        await checkUserPermissions();
        await fetchSchedules();
    };
    init();

    backBtn.addEventListener('click', () => {
        window.location.hash = `#${role}-dashboard`;
    });
}
