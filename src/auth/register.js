import { supabase } from '../lib/supabaseClient.js'

export function initRegister() {
    const registerBtn = document.getElementById('register');
    const btnBack = document.getElementById('btn-back')

    if(btnBack){
        btnBack.addEventListener('click', () => {
            window.location.hash = ''
        })
    }

    if (!registerBtn) return;

    registerBtn.addEventListener('click', async () => {
        const email = document.getElementById('email').value
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const confirmPassword = document.getElementById('confirm-password').value
        const msgElement = document.getElementById('msg');

        if (password !== confirmPassword) {
            msgElement.textContent = 'Passwords do not match!'
            msgElement.className = 'text-red-500 text-center font-bold'
            return
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username: username,
                    role: 'student'
                }
            }
        })

        if (error) {
            msgElement.textContent = error.message
            msgElement.className = 'text-red-500 text-center font-bold'
        } else {
            msgElement.textContent = 'Registration successful! Please check your email.'
            msgElement.className = 'text-green-600 text-center font-bold'
        }
    })
}
