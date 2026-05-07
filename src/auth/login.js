import { supabase } from '../lib/supabaseClient.js'

export function initLogin() {
    const loginForm = document.getElementById('loginForm')
    const msgElement = document.getElementById('msg')
    const btnBack = document.getElementById('btn-back')

    if(btnBack){
        btnBack.addEventListener('click', () => {
            window.location.hash = ''
        })
    }

    if (!loginForm) return

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        
        // ใช้ .trim() เพื่อตัดช่องว่างที่อาจติดมาจากการ Copy/Paste
        const email = document.getElementById('email').value.trim()
        const password = document.getElementById('password').value.trim()

        if (!email || !password) {
            msgElement.textContent = 'Please fill in all fields.'
            msgElement.className = 'text-red-500 text-center font-bold'
            return
        }

        msgElement.textContent = 'Logging in...'
        msgElement.className = 'text-blue-500 text-center font-bold'

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                // แสดงข้อความจาก Supabase (เช่น "Invalid login credentials")
                msgElement.textContent = error.message 
                msgElement.className = 'text-red-500 text-center font-bold'
                console.error('Login Error:', error.message)
            } else {
                const user = data.user
                const role = user.user_metadata.role // ต้อง set ตอน register

                msgElement.textContent = `Login successful! Redirecting...`
                msgElement.className = 'text-green-600 text-center font-bold'

                // [NEW] Routing based on Role
                if (role === 'student') {
                    setTimeout(() => window.location.hash = '#student', 1000)
                } else if (role === 'leader') {
                    setTimeout(() => window.location.hash = '#leader', 1000)
                } else if (role === 'teacher') {
                    setTimeout(() => window.location.hash = '#teacher', 1000)
                } else {
                    console.log('Unknown role:', role)
                }
            }
        } catch (err) {
            msgElement.textContent = 'An unexpected error occurred.'
            msgElement.className = 'text-red-500 text-center font-bold'
            console.error('Unexpected Error:', err)
        }
    })
}
