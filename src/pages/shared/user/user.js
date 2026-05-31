import { supabase } from "../../../lib/supabaseClient";
import { showToast, escapeHTML } from "../../../lib/ui";

export function initUser(role, userAvatar, pfdefault) {
    const backBtn = document.getElementById('btn-back');
    const portalTitle = document.getElementById('portal-title');
    if (portalTitle) {
        if (role === 'admin') portalTitle.textContent = 'Admin Portal';
        else if (role === 'teacher') portalTitle.textContent = 'Teacher Portal';
        else if (role === 'leader') portalTitle.textContent = 'Leader Portal';
        else portalTitle.textContent = 'Student Portal';
    }

    const hasEditAccess = (role === 'admin');

    const avatarPreview = document.getElementById('user-edit-avatar-preview');
    const btnEditAvatar = document.getElementById('btn-edit-avatar');
    const btnAddUser = document.getElementById('btn-add-user');

    // Cropper Elements
    const avatarModal = document.getElementById('avatar-modal');
    const saveModal = document.getElementById('save-modal');
    const cancelAvatarBtn = document.getElementById('btn-cancel-avatar');
    const saveAvatarBtn = document.getElementById('btn-save-avatar');
    const confirmSaveBtn = document.getElementById('btn-confirm-save');
    const cancelSaveBtn = document.getElementById('btn-cancel-save');
    const btnSelectImage = document.getElementById('btn-select-image');
    const cropperInput = document.getElementById('avatar-input');
    const cropImageElem = document.getElementById('avatar-crop-image');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');

    let cropperInstance = null;

    let Timer;
    let deleteTimer;
    let userRole = role; // Default from parameter
    let userClassId = null; // Store current user class_id

    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const editIdInput = document.getElementById('edit-id');
    const closeBtn = document.getElementById('btn-close');
    const confirmBtn = document.getElementById('btn-confirm');
    const emailDisplay = document.getElementById('user-email-display');
    const deleteBtn = document.getElementById('btn-delete');
    const scheduleList = document.getElementById('schedule-list');
    
    // Filters
    const roleFilter = document.getElementById('role-filter');
    const classFilter = document.getElementById('class-filter');
    const searchFilter = document.getElementById('search-filter');

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
    const rollNoInput = document.getElementById('roll_no');

    // --- Classroom Status Helper ---
    const updateClassroomStatus = () => {
        if (!classIdInput || !roleInput) return;

        // Find N/A option in select
        const naOption = Array.from(classIdInput.options).find(opt => opt.value === 'N/A');

        if (roleInput.value === 'admin') {
            if (naOption) naOption.hidden = false; // Show N/A
            classIdInput.value = 'N/A';
            classIdInput.disabled = true;
            classIdInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
            if (rollNoInput) {
                rollNoInput.value = 0;
                rollNoInput.disabled = true;
                rollNoInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
            }
        } else {
            if (naOption) naOption.hidden = true; // Hide N/A
            classIdInput.disabled = false;
            classIdInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
            if (rollNoInput) {
                rollNoInput.disabled = false;
                rollNoInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
            }

            // If current value is N/A, clear it to allow selecting a real room
            if (classIdInput.value === 'N/A') {
                classIdInput.value = '';
            }
        }
    };

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
            if (btnAddUser) btnAddUser.classList.remove('hidden');
            if (roleFilter) roleFilter.classList.remove('hidden');
            if (classFilter) classFilter.classList.remove('hidden');
        } else {
            // For Teacher/Leader, just show their own class
            if (classFilter) classFilter.classList.add('hidden');
            if (roleFilter) roleFilter.classList.add('hidden');
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
        if (!hasEditAccess || !modal) return;
        modal.classList.remove('hidden');

        if (data) {
            modalTitle.textContent = 'Edit User';
            editIdInput.value = data.id;
            firstnameInput.value = data.firstname || '';
            lastnameInput.value = data.lastname || '';
            stuIdInput.value = data.stu_id || '';
            classIdInput.value = data.class_id || '';
            roleInput.value = data.role || 'student';
            if (rollNoInput) rollNoInput.value = data.roll_no !== undefined ? data.roll_no : 0;

            // Show Email (if present in data)
            if (emailDisplay) {
                emailDisplay.textContent = data.email || 'N/A';
            }

            // Check Classroom status immediately when opening Modal
            updateClassroomStatus();

            // Show Delete button in Edit mode
            if (deleteBtn) deleteBtn.classList.remove('hidden');
        }

        if (data) {
            const avatarData = data.user_assets?.find(a => a.asset_type === 'avatar');
            avatarPreview.src = avatarData ? avatarData.url : pfdefault;
        }

    };

    const openAvatarModal = () => {
        if (avatarModal) avatarModal.classList.remove('hidden');
    };

    const closeAvatarModal = () => {
        if (avatarModal) avatarModal.classList.add('hidden');
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (cropImageElem) {
            cropImageElem.src = '';
            cropImageElem.style.opacity = '0';
        }
        if (cropperInput) cropperInput.value = '';
        if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
    };

    const openSaveModal = () => {
        if (saveModal) saveModal.classList.remove('hidden');
    };

    const closeSaveModal = () => {
        if (saveModal) saveModal.classList.add('hidden');
    };

    if (hasEditAccess) {
        if (btnEditAvatar) btnEditAvatar.addEventListener('click', openAvatarModal);
        
        if (btnSelectImage) {
            btnSelectImage.addEventListener('click', () => {
                if (cropperInput) cropperInput.click();
            });
        }

        if (cropperInput) {
            cropperInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;

                const file = files[0];
                if (!file.type.startsWith('image/')) {
                    showToast('Please select an image file', 'error');
                    cropperInput.value = '';
                    return;
                }

                if (cropperInstance) {
                    cropperInstance.destroy();
                    cropperInstance = null;
                }

                const imageUrl = URL.createObjectURL(file);
                cropImageElem.src = imageUrl;
                cropImageElem.style.opacity = '1';

                if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');

                cropperInstance = new Cropper(cropImageElem, {
                    aspectRatio: 1,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 0.85,
                    responsive: true,
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });
            });
        }

        if (cancelAvatarBtn) cancelAvatarBtn.addEventListener('click', closeAvatarModal);

        if (saveAvatarBtn) {
            saveAvatarBtn.addEventListener('click', () => {
                if (!cropperInstance) {
                    showToast('Please select an image first', 'error');
                    return;
                }
                openSaveModal();
            });
        }

        if (cancelSaveBtn) cancelSaveBtn.addEventListener('click', closeSaveModal);

        if (confirmSaveBtn) {
            confirmSaveBtn.addEventListener('click', async () => {
                if (!cropperInstance || !editIdInput.value) {
                    closeSaveModal();
                    return;
                }

                confirmSaveBtn.disabled = true;
                confirmSaveBtn.textContent = 'Uploading...';
                const targetUserId = editIdInput.value;

                try {
                    const canvas = cropperInstance.getCroppedCanvas({
                        width: 500,
                        height: 500,
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: 'high',
                    });

                    const blob = await new Promise((resolve) => {
                        canvas.toBlob(resolve, 'image/jpeg', 0.9);
                    });

                    const fileName = `${targetUserId}_${Date.now()}.jpg`;
                    const filePath = `${targetUserId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, blob, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    const imageUrl = publicUrlData.publicUrl;

                    const { data: existingAsset } = await supabase
                        .from('user_assets')
                        .select('id')
                        .eq('user_id', targetUserId)
                        .eq('asset_type', 'avatar')
                        .maybeSingle();

                    if (existingAsset) {
                        const { error: updateError } = await supabase
                            .from('user_assets')
                            .update({ url: imageUrl })
                            .eq('id', existingAsset.id);
                        if (updateError) throw updateError;
                    } else {
                        const { error: insertError } = await supabase
                            .from('user_assets')
                            .insert([{
                                user_id: targetUserId,
                                asset_type: 'avatar',
                                url: imageUrl
                            }]);
                        if (insertError) throw insertError;
                    }

                    showToast('Avatar updated successfully!');
                    avatarPreview.src = imageUrl;
                    
                    closeSaveModal();
                    closeAvatarModal();
                    fetchUsers(); // Refresh the list

                } catch (error) {
                    console.error(error);
                    showToast('Failed to upload avatar', 'error');
                } finally {
                    confirmSaveBtn.disabled = false;
                    confirmSaveBtn.textContent = '✓ Confirm';
                }
            });
        }
    }

    const validateFields = () => {
        const fieldsToCheck = ['firstname', 'lastname', 'class_id', 'role'];
        let isAllValid = true;

        fieldsToCheck.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // If Role is Admin, no need to validate Classroom (since it's disabled and N/A)
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

    let allUsersData = []; // Store all user data

    // --- Render Users (Apply Filters) ---
    const renderUsers = () => {
        const currentRole = roleFilter ? roleFilter.value : 'all';
        const currentClass = classFilter ? classFilter.value : 'all';
        const searchTerm = searchFilter ? searchFilter.value.toLowerCase().trim() : '';

        let filtered = allUsersData;

        if (hasEditAccess) {
            // 1. Filter by Role
            if (currentRole !== 'all') {
                filtered = filtered.filter(item => item.role === currentRole);
            }
            // 2. Filter by Classroom
            if (currentClass !== 'all') {
                filtered = filtered.filter(item => item.class_id === currentClass);
            }
        }

        // 3. Filter by search term (firstname, lastname, stu_id)
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

            const avatarData = item.user_assets?.find(a => a.asset_type === 'avatar');
            const avatarUrl = avatarData ? avatarData.url : pfdefault;
            const row = document.createElement('div');
            row.className = "flex border-2 border-[#1E1E1E] shadow-[3px_3px_0px_#1E1E1E] bg-white overflow-hidden fade-in mb-3";

            const displayName = `${item.firstname || ''} ${item.lastname || ''}`.trim() || '(No Name)';
            const stuId = item.stu_id || '-';
            const classId = item.class_id || '-';

            row.innerHTML = `
                <div class="w-15 shrink-0 flex flex-col items-center justify-center border-r-2 border-[#1E1E1E] bg-[#F2C00F] overflow-hidden">
                    <img src="${avatarUrl}" class="w-full h-full object-cover">
                </div>
                <div class="flex-1 flex flex-col min-w-0">
                    <div class="px-3 py-1 border-b-2 border-[#1E1E1E] bg-[#EEEDDE]/50 text-[10px] font-bold truncate">
                        ${escapeHTML(stuId)} &nbsp;|&nbsp; ${escapeHTML(item.roll_no ?? 0)} &nbsp;|&nbsp; ${escapeHTML(classId)} |&nbsp; ${escapeHTML(item.role || 'N/A')}
                    </div>
                    <div class="px-3 py-2 font-bold text-[13px] leading-tight truncate">
                        ${escapeHTML(displayName)}
                    </div>
                </div>
                ${hasEditAccess ? `
                <button class="edit-item-btn w-12 shrink-0 flex items-center justify-center border-l-2 border-[#1E1E1E] bg-white hover:bg-[#F2C00F] transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                ` : ''}
            `;

            if (hasEditAccess) {
                row.querySelector('.edit-item-btn').addEventListener('click', () => openModal(item));
            }
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
        
        if ((role === 'leader' || role === 'teacher') && userClassId) {
            query = query.eq('class_id', userClassId).in('role', ['leader', 'student']);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

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
            roll_no: roleInput.value === 'admin' ? 0 : (parseInt(rollNoInput?.value?.trim(), 10) || 0),
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
    if (hasEditAccess) {
        if (deleteBtn) deleteBtn.addEventListener('click', openDeleteConfirmModal);
        if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', handleActualDelete);
        if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteConfirm);
        if (roleFilter) roleFilter.addEventListener('change', renderUsers);
        if (classFilter) classFilter.addEventListener('change', renderUsers);
        if (roleInput) roleInput.addEventListener('change', updateClassroomStatus);

        if (confirmBtn) confirmBtn.addEventListener('click', () => {
            if (validateFields()) {
                handleSave();
            } else {
                showToast("Please fill in all fields", "error");
            }
        });
    }

    if (searchFilter) searchFilter.addEventListener('input', renderUsers);

    // Initializing: Check permissions first, then fetch data
    const init = async () => {
        await checkUserPermissions();
        await fetchUsers();
    };
    init();

    backBtn.addEventListener('click', () => {
        window.location.hash = `#${role}-dashboard`;
    });
}
