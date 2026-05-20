import { supabase } from "../../../lib/supabaseClient";
import { showToast } from "../../../lib/ui";

export function initAdminUserEdit(imageLogo, imageBander) {
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
    let userClassId = null; // เก็บ class_id ของนักเรียน

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const editIdInput = document.getElementById('edit-id');
    const closeBtn = document.getElementById('btn-close');
    const confirmBtn = document.getElementById('btn-confirm');
    const emailDisplay = document.getElementById('user-email-display');
    const deleteBtn = document.getElementById('btn-delete');
    const scheduleList = document.getElementById('schedule-list');
    const roleFilter = document.getElementById('role-filter');
    const classFilter = document.getElementById('class-filter');

    // Delete Confirmation Elements
    const deleteConfirmModal = document.getElementById('modal-delete-confirm');
    const deleteTimerDisplay = document.getElementById('delete-timer');
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete');
    const cancelDeleteBtn = document.getElementById('btn-cancel-delete');

    // Profile Fields
    const firstnameInput = document.getElementById('firstname');
    const lastnameInput = document.getElementById('lastname');
    const stuIdInput = document.getElementById('stu_id');
    const classIdInput = document.getElementById('class_id');
    const roleInput = document.getElementById('role');

    // --- Classroom Status Helper ---
    const updateClassroomStatus = () => {
        if (!classIdInput || !roleInput) return;

        // หา Option N/A ใน select
        const naOption = Array.from(classIdInput.options).find(opt => opt.value === 'N/A');

        if (roleInput.value === 'admin') {
            if (naOption) naOption.hidden = false; // แสดง N/A
            classIdInput.value = 'N/A';
            classIdInput.disabled = true;
            classIdInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
        } else {
            if (naOption) naOption.hidden = true; // ซ่อน N/A
            classIdInput.disabled = false;
            classIdInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');

            // ถ้าค่าปัจจุบันเป็น N/A ให้ล้างออกเพื่อให้เลือกห้องจริงได้
            if (classIdInput.value === 'N/A') {
                classIdInput.value = '';
            }
        }
    };

    // --- Check Role & Permissions ---
    const checkUserPermissions = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // ดึง Role และ class_id จากตาราง profiles
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

    const openModal = (data = null) => {
        if (!modal) return;
        modal.classList.remove('hidden');

        if (data) {
            modalTitle.textContent = 'Edit User';
            editIdInput.value = data.id;
            firstnameInput.value = data.firstname || '';
            lastnameInput.value = data.lastname || '';
            stuIdInput.value = data.stu_id || '';
            classIdInput.value = data.class_id || '';
            roleInput.value = data.role || 'student';

            // แสดง Email (ถ้ามีใน data)
            if (emailDisplay) {
                emailDisplay.textContent = data.email || 'N/A';
            }

            // ตรวจสอบสถานะ Classroom ทันทีที่เปิด Modal
            updateClassroomStatus();

            // แสดงปุ่ม Delete เมื่ออยู่ในโหมด Edit
            if (deleteBtn) deleteBtn.classList.remove('hidden');
        }
    };

    const validateFields = () => {
        const fieldsToCheck = ['firstname', 'lastname', 'class_id', 'role'];
        let isAllValid = true;

        fieldsToCheck.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // ถ้าเป็น Role Admin ไม่ต้องตรวจสอบช่อง Classroom (เพราะถูก disabled และเป็น N/A)
                if (id === 'class_id' && roleInput.value === 'admin') {
                    return;
                }

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

    const logList = document.getElementById('schedule-list');
    const searchFilter = document.getElementById('search-filter');

    let allUsersData = []; // เก็บข้อมูลผู้ใช้ทั้งหมด

    // --- Render Users (Apply Filters) ---
    const renderUsers = () => {
        if (!scheduleList) return;

        const currentRole = roleFilter ? roleFilter.value : 'all';
        const currentClass = classFilter ? classFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        // 1. กรองตาม Role
        let filtered = currentRole === 'all'
            ? allUsersData
            : allUsersData.filter(item => item.role === currentRole);

        // 2. กรองตาม ห้องเรียน
        if (currentClass !== 'all') {
            filtered = filtered.filter(item => item.class_id === currentClass);
        }

        // 3. กรองตามคำค้นหา (ชื่อ, นามสกุล, รหัส)
        if (searchTerm) {
            filtered = filtered.filter(item => {
                const fullName = `${item.firstname} ${item.lastname}`.toLowerCase();
                const stuId = (item.stu_id || '').toLowerCase();
                return fullName.includes(searchTerm) || stuId.includes(searchTerm);
            });
        }

        if (filtered.length === 0) {
            scheduleList.innerHTML = `<div class="text-center py-10 opacity-30 font-bold uppercase italic tracking-tighter">
                ${searchTerm ? 'No users matching your search.' : 'No users found.'}
            </div>`;
            return;
        }

        scheduleList.innerHTML = '';
        filtered.forEach(item => {
            const row = document.createElement('div');
            row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in";

            const displayName = `${item.firstname || ''} ${item.lastname || ''}`.trim() || '(No Name)';
            const stuId = item.stu_id || '-';
            const classId = item.class_id || '-';

            row.innerHTML = `
                <div class="w-14 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] bg-[#F2C00F] px-1">
                    <span class="text-[8px] font-bold opacity-60 uppercase text-center">${item.role || 'N/A'}</span>
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold truncate">
                        ID: ${stuId} &nbsp;|&nbsp; Class: ${classId}
                    </div>
                    <div class="px-3 py-2 font-bold text-[13px] leading-tight truncate">
                        ${displayName}
                    </div>
                </div>
                <button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
            `;

            row.querySelector('.edit-item-btn').addEventListener('click', () => openModal(item));
            scheduleList.appendChild(row);
        });
    };

    // --- Fetch Users from Database ---
    const fetchUsers = async () => {
        if (!scheduleList) return;
        scheduleList.innerHTML = '<div class="text-center py-10 opacity-50 font-bold italic">Loading...</div>';
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });

        if (error) {
            scheduleList.innerHTML = '<div class="text-center py-10 text-red-500 font-bold">Error loading data</div>';
            return;
        }

        allUsersData = data || [];
        renderUsers();
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

        const { error } = await supabase.from('profiles').delete().eq('id', id);

        if (error) {
            showToast("Failed to delete", "error");
        } else {
            showToast("Deleted successfully", "success");
            closeDeleteConfirm();
            closeModal();
            fetchUsers();
        }
    };

    const handleSave = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const profileData = {
            firstname: firstnameInput.value.trim(),
            lastname: lastnameInput.value.trim(),
            stu_id: stuIdInput.value.trim() || null,
            class_id: roleInput.value === 'admin' ? 'N/A' : (classIdInput.value || null),
            role: roleInput.value,
        };

        const id = editIdInput.value;
        if (!id) {
            showToast("No user selected", "error");
            return;
        }

        const { error } = await supabase.from('profiles').update(profileData).eq('id', id);

        if (error) {
            showToast("Failed to save user", "error");
        } else {
            showToast("User saved successfully!", "success");
            closeModal();
            fetchUsers();
        }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (deleteBtn) deleteBtn.addEventListener('click', openDeleteConfirmModal);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleActualDelete);
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
    if (roleFilter) roleFilter.addEventListener('change', renderUsers);
    if (classFilter) classFilter.addEventListener('change', renderUsers);
    if (searchFilter) searchFilter.addEventListener('input', renderUsers);
    if (roleInput) roleInput.addEventListener('change', updateClassroomStatus);

    if (confirmBtn) confirmBtn.addEventListener('click', () => {
        if (validateFields()) {
            handleSave();
        } else {
            showToast("Please fill in all fields", "error");
        }
    });

    // เริ่มต้นระบบ: เช็คสิทธิ์ก่อน แล้วค่อยดึงข้อมูล
    const init = async () => {
        await checkUserPermissions();
        await fetchUsers();
    };
    init();

    backBtn.addEventListener('click', () => {
        window.location.hash = '#admin-dashboard';
    });
}