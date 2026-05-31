import { supabase } from '../../lib/supabaseClient.js'
import { createClient } from '@supabase/supabase-js'

const tempSupabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: false,
        }
    }
);

export function initAdminRegister() {
    const registerBtn = document.getElementById('register');
    const btnBack = document.getElementById('btn-back');
    const roleSelect = document.getElementById('role');
    const classSelect = document.getElementById('class_id');
    const stuIdInput = document.getElementById('stu_id');
    const stuIdLabel = document.getElementById('stu_id_label');
    const rollNoInput = document.getElementById('roll_no');

    if (btnBack) {
        btnBack.addEventListener('click', async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();
                if (profile && profile.role === 'admin') {
                    window.location.hash = '#admin-user-edit';
                    return;
                }
            }
            window.location.hash = '';
        });
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            const role = roleSelect.value;
            // Update labels and behaviors based on selected role
            if (role === 'admin') {
                stuIdLabel.textContent = 'Admin ID';
                stuIdInput.placeholder = 'ADM-00000';
                classSelect.value = 'N/A';
                classSelect.disabled = true;
                classSelect.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
                if (rollNoInput) { rollNoInput.value = 0; rollNoInput.disabled = true; rollNoInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60'); }
            } else if (role === 'teacher') {
                stuIdLabel.textContent = 'Staff ID';
                stuIdInput.placeholder = 'TCH-00000';
                classSelect.disabled = false;
                classSelect.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
                if (classSelect.value === 'N/A') classSelect.value = '';
                if (rollNoInput) { rollNoInput.value = 0; rollNoInput.disabled = true; rollNoInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-60'); }
            } else if (role === 'leader') {
                stuIdLabel.textContent = 'Leader ID';
                stuIdInput.placeholder = '00000';
                classSelect.disabled = false;
                classSelect.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
                if (classSelect.value === 'N/A') classSelect.value = '';
                if (rollNoInput) { rollNoInput.disabled = false; rollNoInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60'); if (rollNoInput.value === '0') rollNoInput.value = ''; }
            } else {
                // Student
                stuIdLabel.textContent = 'Student ID';
                stuIdInput.placeholder = '00000';
                classSelect.disabled = false;
                classSelect.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60');
                if (classSelect.value === 'N/A') classSelect.value = '';
                if (rollNoInput) { rollNoInput.disabled = false; rollNoInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-60'); if (rollNoInput.value === '0') rollNoInput.value = ''; }
            }
        });
    }

    if (!registerBtn) return;

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    const filterNonEnglish = (e) => {
        const regex = /[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~` ]/g;
        if (regex.test(e.target.value)) {
            e.target.value = e.target.value.replace(regex, '');
        }
    };

    if (passwordInput) passwordInput.addEventListener('input', filterNonEnglish);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', filterNonEnglish);

    registerBtn.addEventListener('click', async () => {
        const fields = [
            { id: 'email', name: 'Email' },
            { id: 'firstname', name: 'Firstname' },
            { id: 'lastname', name: 'Lastname' },
            { id: 'role', name: 'Role' },
            { id: 'class_id', name: 'Class Room' },
            { id: 'stu_id', name: 'ID' },
            { id: 'roll_no', name: 'Roll Number' },
            { id: 'password', name: 'Password' },
            { id: 'confirm-password', name: 'Confirm Password' }
        ];

        let hasEmpty = false;
        const msgElement = document.getElementById('msg');
        const selectedRole = roleSelect ? roleSelect.value : 'student';

        fields.forEach(field => {
            const element = document.getElementById(field.id);
            // Skip class room validation if role is admin
            if (field.id === 'class_id' && selectedRole === 'admin') {
                return;
            }
            if (field.id === 'roll_no' && (selectedRole === 'admin' || selectedRole === 'teacher')) {
                return;
            }

            if (!element.value || element.value.trim() === "") {
                element.classList.add('border-red-500');
                element.classList.remove('border-[#1E1E1E]');
                element.classList.add('shake-animation');
                hasEmpty = true;
            } else {
                element.classList.remove('shake-animation');
                element.classList.remove('border-red-500');
                element.classList.add('border-[#1E1E1E]');
            }

            if (!element.dataset.hasListener) {
                element.addEventListener('input', () => {
                    if (element.value.trim() !== "") {
                        element.classList.remove('border-red-500');
                        element.classList.add('border-[#1E1E1E]');
                    }
                });
                element.dataset.hasListener = "true";
            }
        });

        if (hasEmpty) {
            msgElement.textContent = 'Please fill in all fields!'
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
            setTimeout(() => {
                fields.forEach(field => {
                    const element = document.getElementById(field.id);
                    element.classList.remove('border-red-500');
                    element.classList.remove('shake-animation');
                    element.classList.add('border-[#1E1E1E]');
                });
                msgElement.textContent = '';
            }, 2000);
            return;
        }

        const email = document.getElementById('email').value.trim()
        const fname = document.getElementById('firstname').value.trim()
        const lname = document.getElementById('lastname').value.trim()
        const role = selectedRole
        const class_id = selectedRole === 'admin' ? 'N/A' : document.getElementById('class_id').value
        const stu_id = document.getElementById('stu_id').value.trim()
        const roll_no = (selectedRole === 'admin' || selectedRole === 'teacher') ? 0 : (parseInt(document.getElementById('roll_no').value.trim(), 10) || 0)
        const password = document.getElementById('password').value
        const confirmPassword = document.getElementById('confirm-password').value

        const passwordRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~` ]*$/;
        if (!passwordRegex.test(password)) {
            msgElement.textContent = 'Password must contain only English characters!'
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
            const pwdElem = document.getElementById('password');
            pwdElem.classList.add('border-red-500');
            setTimeout(() => {
                pwdElem.classList.remove('border-red-500');
                pwdElem.classList.add('border-[#1E1E1E]');
                msgElement.textContent = '';
            }, 2000);
            return
        }

        if (password !== confirmPassword) {
            msgElement.textContent = 'Passwords do not match!'
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
            const confirmPwdElem = document.getElementById('confirm-password');
            confirmPwdElem.classList.add('border-red-500');
            setTimeout(() => {
                confirmPwdElem.classList.remove('border-red-500');
                confirmPwdElem.classList.add('border-[#1E1E1E]');
                msgElement.textContent = '';
            }, 2000);
            return
        }

        // Validate Student/Leader ID: must be 5-digit number
        if (role === 'student' || role === 'leader') {
            const numRegex = /^\d{5}$/;
            if (!numRegex.test(stu_id)) {
                msgElement.textContent = 'Student ID must be exactly 5 digits!'
                msgElement.className = 'text-red-500 text-center font-bold text-sm'
                const stuElem = document.getElementById('stu_id');
                stuElem.classList.add('border-red-500');
                setTimeout(() => {
                    stuElem.classList.remove('border-red-500');
                    stuElem.classList.add('border-[#1E1E1E]');
                    msgElement.textContent = '';
                }, 2000);
                return;
            }
        }

        msgElement.textContent = 'Registering...'
        msgElement.className = 'text-blue-500 text-center font-bold text-sm'

        const { data, error } = await tempSupabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    firstname: fname,
                    lastname: lname,
                    class_id: class_id,
                    stu_id: stu_id,
                    role: role,
                    roll_no: roll_no
                }
            }
        })

        if (error) {
            msgElement.textContent = error.message
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
        } else {
            msgElement.textContent = 'Registration successful! Redirecting to login...'
            msgElement.className = 'text-green-600 text-center font-bold text-sm'
            setTimeout(() => {
                window.location.hash = '#admin-user-edit';
            }, 1500);
        }
    })
}
