import { supabase } from '../../../lib/supabaseClient.js'
import { showToast } from '../../../lib/ui.js'

export function initLeaderSetting(userAvatar, imageBander) {
    const backBtn = document.getElementById('btn-back');
    const logoutBtn = document.getElementById('btn-logout');
    const studentImage = document.getElementById('student-image');
    const banderImage = document.getElementById('bander-image');
    const studentNameElem = document.getElementById('student-name');
    const studentRoleElem = document.getElementById('student-role');
    const infoEmail = document.getElementById('info-email');
    const infoStudentId = document.getElementById('info-student-id');
    const infoClass = document.getElementById('info-class');

    // Fetch user name from metadata and profile info
    const fetchUserInfo = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata && studentNameElem) {
            const { firstname, lastname } = user.user_metadata;
            studentNameElem.textContent = `${firstname} ${lastname}`;
        }

        // Populate email
        if (user && infoEmail) {
            infoEmail.textContent = user.email || '—';
        }

        // Fetch profile details
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, stu_id, class_id')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (studentRoleElem) studentRoleElem.textContent = profile.role || 'Leader';
                if (infoStudentId) infoStudentId.textContent = profile.stu_id || '—';
                if (infoClass) infoClass.textContent = profile.class_id || '—';
            }
        }
    };
    fetchUserInfo();

    if (studentImage && userAvatar) studentImage.src = userAvatar;
    if (banderImage && imageBander) banderImage.src = imageBander;

    // Back to leader dashboard
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.hash = '#leader-dashboard';
        });
    }

    let logoutTimer;
    const modal = document.getElementById('logout-modal');
    const timerDisplay = document.getElementById('logout-timer');
    const confirmLogoutBtn = document.getElementById('btn-confirm-logout');
    const cancelLogoutBtn = document.getElementById('btn-cancel-logout');

    const closeModal = () => {
        if (modal) {
            const modalContent = modal.querySelector('.fade-in');
            const backdrop = document.getElementById('logout-backdrop');

            if (modalContent && backdrop) {
                // Start Fade-out for both content and backdrop
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
        }
        clearInterval(logoutTimer);
    };

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const backdrop = document.getElementById('logout-backdrop');
            if (modal && timerDisplay) {
                // Reset backdrop animation
                if (backdrop) {
                    backdrop.classList.remove('backdrop-fade-out');
                    backdrop.classList.add('backdrop-fade-in');
                }

                modal.classList.remove('hidden');
                let timeLeft = 10;
                timerDisplay.textContent = timeLeft;

                logoutTimer = setInterval(() => {
                    timeLeft--;
                    timerDisplay.textContent = timeLeft;
                    if (timeLeft <= 0) {
                        closeModal();
                    }
                }, 1000);
            }
        });
    }

    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                showToast(error.message, 'error');
                closeModal();
            } else {
                showToast('Log out succeed')
                window.location.hash = '';
            }
        });
    }

    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', () => {
            closeModal();
        });
    }

    // =============================================
    // Avatar Upload & Crop Logic
    // =============================================
    const avatarModal = document.getElementById('avatar-modal');
    const saveModal = document.getElementById('save-modal');
    const changeAvatarBtn = document.getElementById('btn-change-avatar');
    const cancelAvatarBtn = document.getElementById('btn-cancel-avatar');
    const saveAvatarBtn = document.getElementById('btn-save-avatar');
    const confirmSaveBtn = document.getElementById('btn-confirm-save');
    const cancelSaveBtn = document.getElementById('btn-cancel-save');
    const btnSelectImage = document.getElementById('btn-select-image');
    const avatarInput = document.getElementById('avatar-input');
    const cropImageElem = document.getElementById('avatar-crop-image');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');

    let cropperInstance = null; // Store Cropper.js instance

    // --- Modal helpers ---
    const openAvatarModal = () => {
        if (avatarModal) avatarModal.classList.remove('hidden');
    };

    const closeAvatarModal = () => {
        if (avatarModal) avatarModal.classList.add('hidden');
        // Destroy Cropper and reset everything
        if (cropperInstance) {
            cropperInstance.destroy();
            cropperInstance = null;
        }
        if (cropImageElem) {
            cropImageElem.src = '';
            cropImageElem.style.opacity = '0';
        }
        if (avatarInput) avatarInput.value = '';
        if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
    };

    const openSaveModal = () => {
        if (saveModal) saveModal.classList.remove('hidden');
    };

    const closeSaveModal = () => {
        if (saveModal) saveModal.classList.add('hidden');
    };

    // --- Open Modal when Change Avatar button is clicked ---
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', openAvatarModal);
    }

    // --- Trigger File Picker when Select Image button is clicked ---
    if (btnSelectImage) {
        btnSelectImage.addEventListener('click', () => {
            if (avatarInput) avatarInput.click();
        });
    }

    // --- When a file is selected ---
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // Check if it's an image file
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file only', 'error');
                avatarInput.value = '';
                return;
            }

            // Destroy old Cropper (if any)
            if (cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }

            // Create URL from file and show image in Crop Area
            const imageUrl = URL.createObjectURL(file);
            cropImageElem.src = imageUrl;
            cropImageElem.style.opacity = '1';

            // Hide Placeholder
            if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');

            // Initialize Cropper.js (using Cropper from CDN loaded in HTML)
            cropperInstance = new Cropper(cropImageElem, {
                aspectRatio: 1,       // Force 1:1 (square)
                viewMode: 1,          // Crop box cannot exceed image bounds
                dragMode: 'move',     // Drag to move image (not crop box)
                autoCropArea: 0.85,   // Default crop area 85%
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

    // --- Cancel button to close Avatar Modal ---
    if (cancelAvatarBtn) {
        cancelAvatarBtn.addEventListener('click', closeAvatarModal);
    }

    // --- Save button to open Confirm Modal ---
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', () => {
            if (!cropperInstance) {
                showToast('Please select an image first', 'error');
                return;
            }
            openSaveModal();
        });
    }

    // --- Confirm Save → Crop + Upload + Save to DB ---
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
            if (!cropperInstance) {
                closeSaveModal();
                return;
            }

            // Disable button during upload
            confirmSaveBtn.disabled = true;
            confirmSaveBtn.textContent = 'Uploading...';

            try {
                // 1. Get current logged in user info
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('User info not found. Please log in again.');
                const userId = user.id;

                // 2. Crop image as Canvas 500x500px
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 500,
                    height: 500,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                // 3. Convert Canvas to Blob (JPEG file)
                const blob = await new Promise((resolve) => {
                    canvas.toBlob(resolve, 'image/jpeg', 0.9);
                });

                // 4. Define filename and path for Storage
                const fileName = `${userId}_${Date.now()}.jpg`;
                const filePath = `${userId}/${fileName}`;

                // 5. Upload image to Supabase Storage (bucket: avatars)
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // 6. Get Public URL of uploaded image
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                const imageUrl = publicUrlData.publicUrl;

                // 7. Check if user already has an avatar in user_assets
                const { data: existingAsset } = await supabase
                    .from('user_assets')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('asset_type', 'avatar')
                    .maybeSingle();

                if (existingAsset) {
                    // Update URL of existing record
                    const { error: updateError } = await supabase
                        .from('user_assets')
                        .update({ url: imageUrl })
                        .eq('id', existingAsset.id);
                    if (updateError) throw updateError;
                } else {
                    // Create new record
                    const { error: insertError } = await supabase
                        .from('user_assets')
                        .insert({
                            user_id: userId,
                            asset_type: 'avatar',
                            url: imageUrl
                        });
                    if (insertError) throw insertError;
                }

                // 8. Update profile picture on page immediately
                if (studentImage) {
                    studentImage.src = imageUrl;
                }

                showToast('Profile picture updated successfully!');

                // 9. Close all modals and clear data
                closeSaveModal();
                closeAvatarModal();

            } catch (error) {
                console.error('Upload error:', error);
                showToast(error.message || 'Error occurred during upload', 'error');
            } finally {
                // Reset button
                confirmSaveBtn.disabled = false;
                confirmSaveBtn.textContent = '✓ Confirm';
            }
        });
    }

    // --- Cancel Save to close Confirm Modal ---
    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', closeSaveModal);
    }
}
