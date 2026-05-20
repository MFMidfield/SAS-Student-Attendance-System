import { supabase } from "../../../lib/supabaseClient";
import { showToast, escapeHTML } from "../../../lib/ui";
import { importCSV } from "../../../lib/import.js";

export function initAdminSchedule(imageLogo, imageBander) {
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


    let Timer;
    let deleteTimer;
    let userRole = 'student'; // Default role
    let userClassId = null; // Store student class_id (e.g. "4/9")

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
    const importBtn = document.getElementById('btn-import');
    const dayFilterBtns = document.querySelectorAll('.day-filter-btn');

    let selectedDayFilter = '1';

    // Delete Confirmation Elements
    const deleteConfirmModal = document.getElementById('modal-delete-confirm');
    const deleteTimerDisplay = document.getElementById('delete-timer');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');

    // Import Modal Elements
    const modalImport = document.getElementById('modal-import');
    const closeImportBtn = document.getElementById('btn-close-import');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('import-file-input');
    const processImportBtn = document.getElementById('btn-process-import');
    const downloadTemplateBtn = document.getElementById('btn-download-template');
    const previewBody = document.getElementById('import-preview-body');
    const previewCount = document.getElementById('preview-count');
    const importStep1 = document.getElementById('import-step-1');
    const importStep2 = document.getElementById('import-step-2');

    let importedData = [];

    // Fields
    const dayInput = document.getElementById('days');
    const periodInput = document.getElementById('period');
    const startTimeInput = document.getElementById('start_time');
    const endTimeInput = document.getElementById('end_time');
    const subjectInput = document.getElementById('subject');
    const classIdInput = document.getElementById('class_id');
    const teacherNameInput = document.getElementById('teacherName');

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

            // Show Add button and room filter only for admin or teacher
            if (userRole === 'admin' || userRole === 'teacher') {
                if (addBtn) addBtn.classList.remove('hidden');
                if (importBtn) importBtn.classList.remove('hidden');
                if (roomFilter) roomFilter.classList.remove('hidden');
            }
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
    };

    const openModal = (mode = 'add', data = null) => {
        if (!modal) return;
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

            // --- Restrictions for special subjects (Period 0 or Homeroom) ---
            const isSpecial = (data.period === 0 || (data.subject_name || '').toLowerCase() === 'homeroom');

            if (isSpecial) {
                // Prohibit deletion
                if (deleteBtn) deleteBtn.classList.add('hidden');
                // Lock important fields
                dayInput.disabled = true;
                periodInput.disabled = true;
                startTimeInput.disabled = true;
                endTimeInput.disabled = true;
                subjectInput.disabled = true;
                classIdInput.disabled = true;

                // Add styles to look locked
                [dayInput, periodInput, startTimeInput, endTimeInput, subjectInput, classIdInput].forEach(el => {
                    el.classList.add('opacity-50', 'cursor-not-allowed');
                });
            } else {
                // Show Delete button in normal Edit mode
                if (deleteBtn) deleteBtn.classList.remove('hidden');
                // Unlock fields
                [dayInput, periodInput, startTimeInput, endTimeInput, subjectInput, classIdInput].forEach(el => {
                    el.disabled = false;
                    el.classList.remove('opacity-50', 'cursor-not-allowed');
                });
            }
        } else {
            modalTitle.textContent = 'Add Schedule';
            editIdInput.value = '';
            // Reset fields
            [startTimeInput, endTimeInput, subjectInput, classIdInput, teacherNameInput].forEach(i => i.value = '');
            
            // Unlock all fields for Add mode
            [dayInput, periodInput, startTimeInput, endTimeInput, subjectInput, classIdInput].forEach(el => {
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

    let allSchedulesData = [];

    const renderSchedules = () => {
        if (!scheduleList) return;

        const currentFilter = roomFilter ? roomFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // --- Filter by selected room ---
        let filteredData = currentFilter === 'all'
            ? allSchedulesData
            : allSchedulesData.filter(item => item.room === currentFilter);

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

            const canManage = (userRole === 'admin' || userRole === 'teacher');

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
                ${canManage ? `
                <button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                ` : ''}
            `;

            if (canManage) {
                row.querySelector('.edit-item-btn').addEventListener('click', () => openModal('edit', item));
            }
            scheduleList.appendChild(row);
        });
    };

    const fetchSchedules = async () => {
        scheduleList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase.from('schedule').select('*');

        // Student: fetch only their own room's schedule (compare with room column)
        if (userRole === 'student' && userClassId) {
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

        // --- Update Room Filter options ---
        const currentFilter = roomFilter.value;
        const rooms = [...new Set(allSchedulesData.map(item => item.room))].filter(Boolean);
        roomFilter.innerHTML = '<option value="all">ALL ROOMS</option>';
        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room;
            option.textContent = `ROOM ${room}`;
            roomFilter.appendChild(option);
        });
        roomFilter.value = currentFilter;

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

        const daysMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };

        const scheduleData = {
            subject_name: subjectInput.value,
            day_of_week: daysMap[dayInput.value],
            period: parseInt(periodInput.value),
            start_time: startTimeInput.value,
            end_time: endTimeInput.value,
            room: classIdInput.value,
            teacher_name: teacherNameInput.value
        };

        let result;
        if (editIdInput.value) {
            result = await supabase.from('schedule').update(scheduleData).eq('id', editIdInput.value);
        } else {
            result = await supabase.from('schedule').insert([scheduleData]);
        }

        if (result.error) {
            showToast("Failed to save schedule", "error");
        } else {
            showToast("Schedule saved successfully!", "success");
            closeModal();
            fetchSchedules();
        }
    };

    if (addBtn) addBtn.addEventListener('click', () => openModal('add'));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (deleteBtn) deleteBtn.addEventListener('click', openDeleteConfirmModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleActualDelete);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
    if (roomFilter) roomFilter.addEventListener('change', renderSchedules);
    if (searchFilter) searchFilter.addEventListener('input', renderSchedules);

    /*
    // --- Import Flow ---
    const openImportModal = () => {
        if (!modalImport) return;
        modalImport.classList.remove('hidden');
        resetImportModal();
    };

    const closeImportModal = () => {
        if (!modalImport) return;
        modalImport.classList.add('hidden');
    };

    const resetImportModal = () => {
        importStep1.classList.remove('hidden');
        importStep2.classList.add('hidden');
        processImportBtn.classList.add('hidden');
        previewBody.innerHTML = '';
        fileInput.value = '';
        importedData = [];
    };

    const handleFileSelect = async (file) => {
        try {
            const data = await importCSV(file);
            if (!data || data.length === 0) {
                showToast("No data found in file", "error");
                return;
            }

            importedData = data;
            renderImportPreview();
            importStep1.classList.add('hidden');
            importStep2.classList.remove('hidden');
            processImportBtn.classList.remove('hidden');
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    const renderImportPreview = () => {
        previewBody.innerHTML = '';
        previewCount.textContent = importedData.length;

        importedData.slice(0, 10).forEach(row => {
            const tr = document.createElement('tr');
            tr.className = "border-b border-[#1E1E1E]/10";
            tr.innerHTML = `
                <td class="p-2">${row.Day || row.day || '-'}</td>
                <td class="p-2">${row.Period || row.period || '-'}</td>
                <td class="p-2 truncate max-w-[100px]">${row.Subject || row.subject_name || row.subject || '-'}</td>
                <td class="p-2">${row.Room || row.room || '-'}</td>
                <td class="p-2 truncate max-w-[100px]">${row.Teacher || row.teacher_name || row.teacher || '-'}</td>
                <td class="p-2">${row.Start || row.start_time || '-'} - ${row.End || row.end_time || '-'}</td>
            `;
            previewBody.appendChild(tr);
        });

        if (importedData.length > 10) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td colspan="6" class="p-2 text-center opacity-50 italic">... and ${importedData.length - 10} more rows</td>`;
            previewBody.appendChild(tr);
        }
    };

    const processImport = async () => {
        const daysMap = { "sunday": 0, "monday": 1, "tuesday": 2, "wednesday": 3, "thursday": 4, "friday": 5, "saturday": 6, "sun": 0, "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6 };
        
        const formattedData = importedData.map(row => {
            const dayStr = (row.Day || row.day || "").toString().toLowerCase();
            const dayNum = daysMap[dayStr] !== undefined ? daysMap[dayStr] : parseInt(dayStr);
            
            return {
                subject_name: row.Subject || row.subject_name || row.subject,
                day_of_week: dayNum,
                period: parseInt(row.Period || row.period),
                start_time: row.Start || row.start_time || row["Start Time"],
                end_time: row.End || row.end_time || row["End Time"],
                room: (row.Room || row.room || "").toString(),
                teacher_name: row.Teacher || row.teacher_name || row.teacher
            };
        }).filter(item => !isNaN(item.day_of_week) && !isNaN(item.period) && item.room);

        if (formattedData.length === 0) {
            showToast("No valid data to import", "error");
            return;
        }

        processImportBtn.disabled = true;
        processImportBtn.textContent = "Importing...";

        // Use upsert with conflict on (day_of_week, period, room)
        // Note: This requires a unique constraint on these columns in the DB.
        // If not present, it will just insert.
        const { error } = await supabase
            .from('schedule')
            .upsert(formattedData, { onConflict: 'day_of_week,period,room' });

        if (error) {
            console.error("Import error:", error);
            showToast("Import failed: " + error.message, "error");
        } else {
            showToast(`Imported ${formattedData.length} records successfully!`, "success");
            closeImportModal();
            fetchSchedules();
        }

        processImportBtn.disabled = false;
        processImportBtn.textContent = "Confirm Import";
    };

    if (importBtn) importBtn.addEventListener('click', openImportModal);
    if (closeImportBtn) closeImportBtn.addEventListener('click', closeImportModal);
    if (processImportBtn) processImportBtn.addEventListener('click', processImport);

    if (dropZone) {
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('border-[#F2C00F]', 'bg-[#F2C00F]/10');
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('border-[#F2C00F]', 'bg-[#F2C00F]/10');
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('border-[#F2C00F]', 'bg-[#F2C00F]/10');
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });
    }

    if (downloadTemplateBtn) {
        downloadTemplateBtn.addEventListener('click', () => {
            const templateData = [
                {
                    "Day": "Monday",
                    "Period": 1,
                    "Subject": "Core Mathematics",
                    "Room": "4/9",
                    "Teacher": "John Doe",
                    "Start": "08:30",
                    "End": "09:20"
                },
                {
                    "Day": "Tuesday",
                    "Period": 2,
                    "Subject": "Physics",
                    "Room": "5/9",
                    "Teacher": "Jane Smith",
                    "Start": "09:20",
                    "End": "10:10"
                }
            ];

            const worksheet = XLSX.utils.json_to_sheet(templateData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule Template");
            
            // Export to XLSX
            XLSX.writeFile(workbook, "schedule_template.xlsx");
        });
    }
    */

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

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
        if (validateFields()) {
            handleSave();
        } else {
            showToast("Please fill in all fields", "error");
        }
    });

    // Initializing: Check permissions first, then fetch data
    const init = async () => {
        await checkUserPermissions();
        await fetchSchedules();
    };
    init();

    backBtn.addEventListener('click', () => {
        window.location.hash = '#admin-dashboard';
    });
}