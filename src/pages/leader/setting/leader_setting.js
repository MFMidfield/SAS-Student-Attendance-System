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
    const infoRole = document.getElementById('info-role');

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
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (studentRoleElem) studentRoleElem.textContent = profile.role || 'Leader';
                if (infoRole) infoRole.textContent = profile.role || 'Leader';
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
                // เริ่ม Fade-out ทั้งเนื้อหาและ Backdrop
                modalContent.classList.remove('fade-in');
                modalContent.classList.add('fade-out');

                backdrop.classList.remove('backdrop-fade-in');
                backdrop.classList.add('backdrop-fade-out');

                setTimeout(() => {
                    modal.classList.add('hidden');

                    // Reset classes สำหรับครั้งต่อไป
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

    let cropperInstance = null; // เก็บ instance ของ Cropper.js

    // --- Modal helpers ---
    const openAvatarModal = () => {
        if (avatarModal) avatarModal.classList.remove('hidden');
    };

    const closeAvatarModal = () => {
        if (avatarModal) avatarModal.classList.add('hidden');
        // ทำลาย Cropper และรีเซ็ตทุกอย่าง
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

    // --- เปิด Modal เมื่อกดปุ่ม Change Avatar ---
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', openAvatarModal);
    }

    // --- กดปุ่ม Select Image ให้เปิด File Picker ---
    if (btnSelectImage) {
        btnSelectImage.addEventListener('click', () => {
            if (avatarInput) avatarInput.click();
        });
    }

    // --- เมื่อเลือกไฟล์รูปภาพ ---
    if (avatarInput) {
        avatarInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            const file = files[0];

            // ตรวจสอบว่าเป็นรูปภาพหรือไม่
            if (!file.type.startsWith('image/')) {
                showToast('กรุณาเลือกไฟล์รูปภาพเท่านั้น', 'error');
                avatarInput.value = '';
                return;
            }

            // ทำลาย Cropper เก่า (ถ้ามี)
            if (cropperInstance) {
                cropperInstance.destroy();
                cropperInstance = null;
            }

            // สร้าง URL จากไฟล์และแสดงรูปใน Crop Area
            const imageUrl = URL.createObjectURL(file);
            cropImageElem.src = imageUrl;
            cropImageElem.style.opacity = '1';

            // ซ่อน Placeholder
            if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');

            // เริ่มต้น Cropper.js (ใช้ Cropper จาก CDN ที่โหลดไว้ใน HTML)
            cropperInstance = new Cropper(cropImageElem, {
                aspectRatio: 1,       // บังคับ 1:1 (สี่เหลี่ยมจัตุรัส)
                viewMode: 1,          // กรอบ crop ไม่หลุดนอกรูป
                dragMode: 'move',     // ลากเลื่อนรูปได้ (ไม่ใช่ลากกรอบ)
                autoCropArea: 0.85,   // เริ่มต้น crop 85% ของพื้นที่
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

    // --- กด Cancel ปิด Avatar Modal ---
    if (cancelAvatarBtn) {
        cancelAvatarBtn.addEventListener('click', closeAvatarModal);
    }

    // --- กด Save เปิด Confirm Modal ---
    if (saveAvatarBtn) {
        saveAvatarBtn.addEventListener('click', () => {
            if (!cropperInstance) {
                showToast('กรุณาเลือกรูปภาพก่อน', 'error');
                return;
            }
            openSaveModal();
        });
    }

    // --- กด Confirm Save → Crop + Upload + บันทึกลง DB ---
    if (confirmSaveBtn) {
        confirmSaveBtn.addEventListener('click', async () => {
            if (!cropperInstance) {
                closeSaveModal();
                return;
            }

            // Disable ปุ่มระหว่างอัปโหลด
            confirmSaveBtn.disabled = true;
            confirmSaveBtn.textContent = 'Uploading...';

            try {
                // 1. ดึงข้อมูล User ที่ล็อกอินอยู่
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาล็อกอินใหม่');
                const userId = user.id;

                // 2. Crop รูปภาพเป็น Canvas ขนาด 500x500px
                const canvas = cropperInstance.getCroppedCanvas({
                    width: 500,
                    height: 500,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });

                // 3. แปลง Canvas เป็น Blob (ไฟล์ JPEG)
                const blob = await new Promise((resolve) => {
                    canvas.toBlob(resolve, 'image/jpeg', 0.9);
                });

                // 4. กำหนดชื่อไฟล์และ path สำหรับ Storage
                const fileName = `${userId}_${Date.now()}.jpg`;
                const filePath = `${userId}/${fileName}`;

                // 5. อัปโหลดรูปขึ้น Supabase Storage (bucket: avatars)
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, blob, {
                        contentType: 'image/jpeg',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // 6. ดึง Public URL ของรูปที่อัปโหลด
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                const imageUrl = publicUrlData.publicUrl;

                // 7. ตรวจสอบว่า user มี avatar ใน user_assets อยู่แล้วหรือยัง
                const { data: existingAsset } = await supabase
                    .from('user_assets')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('asset_type', 'avatar')
                    .maybeSingle();

                if (existingAsset) {
                    // อัปเดต URL ของ record เดิม
                    const { error: updateError } = await supabase
                        .from('user_assets')
                        .update({ url: imageUrl })
                        .eq('id', existingAsset.id);
                    if (updateError) throw updateError;
                } else {
                    // สร้าง record ใหม่
                    const { error: insertError } = await supabase
                        .from('user_assets')
                        .insert({
                            user_id: userId,
                            asset_type: 'avatar',
                            url: imageUrl
                        });
                    if (insertError) throw insertError;
                }

                // 8. อัปเดตรูปโปรไฟล์บนหน้าทันที
                if (studentImage) {
                    studentImage.src = imageUrl;
                }

                showToast('อัปเดตรูปโปรไฟล์สำเร็จ!');

                // 9. ปิด Modal ทั้งหมดและเคลียร์ข้อมูล
                closeSaveModal();
                closeAvatarModal();

            } catch (error) {
                console.error('Upload error:', error);
                showToast(error.message || 'เกิดข้อผิดพลาดในการอัปโหลด', 'error');
            } finally {
                // Reset ปุ่ม
                confirmSaveBtn.disabled = false;
                confirmSaveBtn.textContent = '✓ Confirm';
            }
        });
    }

    // --- กด Cancel Save ปิด Confirm Modal ---
    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', closeSaveModal);
    }
}
