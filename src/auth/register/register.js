import { supabase } from '../../lib/supabaseClient.js'

export function initRegister() {
    const registerBtn = document.getElementById('register');
    const btnBack = document.getElementById('btn-back')

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.hash = ''
        })
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
            { id: 'class_id', name: 'Class Room' },
            { id: 'stu_id', name: 'Student ID' },
            { id: 'password', name: 'Password' },
            { id: 'confirm-password', name: 'Confirm Password' }
        ];

        let hasEmpty = false;
        const msgElement = document.getElementById('msg');

        fields.forEach(field => {
            const element = document.getElementById(field.id);
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

        const email = document.getElementById('email').value
        const fname = document.getElementById('firstname').value
        const lname = document.getElementById('lastname').value
        const class_id = document.getElementById('class_id').value
        const stu_id = document.getElementById('stu_id').value
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

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    firstname: fname,
                    lastname: lname,
                    class_id: class_id,
                    stu_id: stu_id,
                    role: 'student'
                }
            }
        })

        if (error) {
            msgElement.textContent = error.message
            msgElement.className = 'text-red-500 text-center font-bold text-sm'
        } else {
            msgElement.textContent = 'Registration successful! Please check your email.'
            msgElement.className = 'text-green-600 text-center font-bold text-sm'
        }
    })
}
