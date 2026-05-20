import { supabase } from '../../lib/supabaseClient.js'

export function initLogin() {
    const loginForm = document.getElementById('loginForm')
    const msgElement = document.getElementById('msg')
    const btnBack = document.getElementById('btn-back')

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.hash = ''
        })
    }

    if (!loginForm) return

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            const regex = /[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~` ]/g;
            if (regex.test(e.target.value)) {
                e.target.value = e.target.value.replace(regex, '');
            }
        });
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const fields = [
            { id: 'email', name: 'Email' },
            { id: 'password', name: 'Password' }
        ];
        let hasEmpty = false;
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!element.value || element.value.trim() === "") {
                element.classList.add('border-red-500');
                element.classList.remove('border-[#1E1E1E]');
                hasEmpty = true;
            } else {
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
            msgElement.textContent = 'Please fill in all fields.'
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
            setTimeout(() => {
                fields.forEach(field => {
                    const element = document.getElementById(field.id);
                    element.classList.remove('border-red-500');
                    element.classList.add('border-[#1E1E1E]');
                });
                msgElement.textContent = '';
            }, 2000);
            return
        }
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value.trim()
        msgElement.textContent = 'Logging in...'
        msgElement.className = 'text-blue-500 text-center font-bold text-sm'
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                msgElement.textContent = error.message
                msgElement.className = 'text-red-500 text-center font-bold text-sm'
            } else {
                const user = data.user
                
                // Fetch profile to check role and stu_id
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, stu_id')
                    .eq('id', user.id)
                    .single();

                if (profileError || !profile) {
                    await supabase.auth.signOut();
                    msgElement.textContent = 'Profile not found.';
                    msgElement.className = 'text-red-500 text-center font-bold text-sm';
                    return;
                }

                const role = profile.role;
                const enteredStuId = document.getElementById('student-id').value.trim();

                // Check Student ID for student role
                if (role === 'student') {
                    if (!enteredStuId || enteredStuId !== profile.stu_id) {
                        await supabase.auth.signOut();
                        msgElement.textContent = 'Invalid Student ID.';
                        msgElement.className = 'text-red-500 text-center font-bold text-sm';
                        return;
                    }
                }

                msgElement.textContent = 'Login successful! Redirecting...'
                msgElement.className = 'text-green-600 text-center font-bold text-sm'
                if (role === 'student') setTimeout(() => window.location.hash = '#student-dashboard', 1000)
                else if (role === 'admin') setTimeout(() => window.location.hash = '#admin-dashboard', 1000)
                else if (role === 'leader') setTimeout(() => window.location.hash = '#leader', 1000)
                else if (role === 'teacher') setTimeout(() => window.location.hash = '#teacher', 1000)
            }
        } catch (err) {
            msgElement.textContent = 'An unexpected error occurred.'
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
        }
    })
}
