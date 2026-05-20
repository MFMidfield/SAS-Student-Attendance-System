# รายงานปัญหาความปลอดภัย (Security Audit Report)

> ตรวจสอบล่าสุด: 2026-05-20 | เรียงลำดับจากอันตรายมากไปน้อย

---

## 🔴 CRITICAL — ต้องแก้ไขทันที

---

### 1. ไม่มีการจำกัดข้อมูลระหว่างห้องเรียนสำหรับครูและผู้นำ (Missing Class-Scoped Data Filtering)

- **จุดที่พบ:** `src/pages/admin/admin_logs/admin_logs.js` บรรทัด 499–502
- **รายละเอียด:**
  การกรองข้อมูลใน `attendance_logs` กรองตาม `class_id_record` เฉพาะบทบาท `student` เท่านั้น ครู (`teacher`) และผู้นำ (`leader`) สามารถดูข้อมูลการเข้าเรียน **ของทุกห้อง** ในระบบได้โดยไม่มีการจำกัด แม้ว่าหน้า UI จะแสดง dropdown กรองห้อง แต่ข้อมูลทั้งหมดถูกดึงมาแล้วในครั้งเดียว
  ```javascript
  // ครูและผู้นำไม่มีการกรอง — เห็นข้อมูลทุกห้องเรียน
  if (userRole === 'student' && userClassId) {
      query = query.eq('class_id_record', userClassId);
  }
  ```
- **วิธีแก้ไข:**
  เพิ่ม filter สำหรับ `teacher` และ `leader` ให้กรองตาม `class_id` ของตัวเองด้วย และที่สำคัญกว่านั้นคือต้องกำหนด **RLS Policy** ใน Supabase ระดับฐานข้อมูลให้ครูเห็นเฉพาะข้อมูลห้องที่ตนรับผิดชอบ

---

### 2. การป้องกันขึ้นอยู่กับ JavaScript ฝั่ง Client เท่านั้น (Client-Side-Only Access Control)

- **จุดที่พบ:** `src/main.js` บรรทัด 187–197
- **รายละเอียด:**
  การตรวจสอบสิทธิ์บทบาท (Role) ทำงานในเบราว์เซอร์ผ่าน JavaScript ล้วน ๆ หากผู้ใช้ปิด JavaScript หรือแก้ไข DOM โดยตรง ก็สามารถข้ามไปยังหน้าของบทบาทอื่นได้ นอกจากนี้ หากนโยบาย **Row-Level Security (RLS)** ใน Supabase ไม่ได้รับการตั้งค่าอย่างถูกต้อง ผู้ใช้สามารถเรียก Supabase API โดยตรง (ผ่าน Postman หรือ curl) เพื่อเข้าถึงข้อมูลของบทบาทอื่นได้ทันที
  ```javascript
  // ตรวจสอบเฉพาะใน JS — ข้ามได้ใน DevTools
  if (route.allowedRoles && !route.allowedRoles.includes(userRole)) { ... }
  ```
- **วิธีแก้ไข:**
  ต้องกำหนด RLS Policy ในทุก Table ของ Supabase ให้ครอบคลุม การป้องกัน Client-side เป็นเพียงชั้น UI ไม่ใช่ชั้นความปลอดภัยจริง

---

### 3. ไม่มีการตรวจสอบ Ownership ก่อน แก้ไข/ลบข้อมูล (Missing Ownership Check — IDOR Risk)

- **จุดที่พบ:** `src/pages/admin/user/admin_userEdit.js`, `src/pages/admin/schedule/admin_schedule.js` และไฟล์ CRUD อื่น ๆ
- **รายละเอียด:**
  การลบหรืออัปเดตข้อมูล (ผู้ใช้, ตาราง, กิจกรรม) ไม่มีการตรวจสอบว่าผู้ใช้ปัจจุบันมีสิทธิ์จัดการ Resource นั้น ๆ หรือไม่ นอกเหนือจากการตรวจสอบบทบาทระดับ Client เนื่องจากไม่มี RLS รองรับ ผู้ที่ทราบ `id` ของ Record สามารถส่ง API call ตรงเพื่อลบข้อมูลนั้นได้ (IDOR — Insecure Direct Object Reference)
- **วิธีแก้ไข:**
  กำหนด RLS ใน Supabase ให้แต่ละบทบาทแก้ไขได้เฉพาะ Record ที่ตนมีสิทธิ์ และเพิ่ม Policy ที่ตรวจสอบ `auth.uid()` ในฝั่งฐานข้อมูล

---

## 🟠 HIGH — ควรแก้ไขโดยเร็ว

---

### 4. ครู/Admin ไม่ต้องกรอกรหัสนักเรียนตอน Login (Inconsistent Login Verification)

- **จุดที่พบ:** `src/auth/login/login.js` บรรทัด 96–103
- **รายละเอียด:**
  ขั้นตอน Login มีการตรวจสอบ `stu_id` เป็นชั้นที่สองสำหรับ `student` และ `leader` เท่านั้น บัญชี `admin` และ `teacher` ผ่านได้ด้วย Email + Password เพียงอย่างเดียว โดยไม่มีการยืนยันตัวตนชั้นที่สอง หากบัญชีครู/admin ถูก Brute-force หรือ Credential Stuffing ก็เข้าสู่ระบบได้เลย
  ```javascript
  if (role === 'student' || role === 'leader') {
      // ตรวจสอบ stu_id
  }
  // admin และ teacher ไม่มีการตรวจสอบเพิ่มเติม
  ```
- **วิธีแก้ไข:**
  เพิ่ม Two-Factor Authentication (2FA) สำหรับบัญชีที่มีสิทธิ์สูง หรืออย่างน้อยเพิ่มการยืนยัน Employee ID สำหรับครู/admin ด้วย

---

### 5. XSS ผ่านชื่อผู้ตรวจสอบที่ฝังใน innerHTML โดยไม่ Escape (Stored XSS via Verifier Name)

- **จุดที่พบ:**
  - `src/pages/admin/attendance_approve/admin_approve.js` บรรทัด 460
  - `src/pages/admin/admin_logs/admin_logs.js` บรรทัด 432
  - `src/pages/teacher/attendance_approve/teacher_approve.js` บรรทัด 460
  - `src/pages/leader/attendance_approve/leader_approve.js` บรรทัด 460
- **รายละเอียด:**
  ชื่อของผู้ตรวจสอบ (`item.verifier.firstname`) ถูกนำไปฝังใน string ที่ใช้กับ `innerHTML` โดยตรง โดยไม่ผ่าน `escapeHTML()` ซึ่งต่างจากฟิลด์อื่น ๆ ที่มีการ Escape แล้ว หากผู้ดูแลระบบตั้งชื่อบัญชีเป็น HTML เช่น `<img src=x onerror=alert(1)>` จะเกิด XSS ได้
  ```javascript
  // ไม่มี escapeHTML — อันตราย
  verifierInfo = `Verified by: ${item.verifier.firstname} (${item.verifier.role})`;
  ```
- **วิธีแก้ไข:**
  ห่อด้วย `escapeHTML()` ทุกครั้งก่อนใส่ใน innerHTML:
  ```javascript
  verifierInfo = `Verified by: ${escapeHTML(item.verifier.firstname)} (${escapeHTML(item.verifier.role)})`;
  ```

---

## 🟡 MEDIUM — ควรจัดการในรอบถัดไป

---

### 6. ความเสี่ยง XSS จาก URL รูปภาพ (Image Source XSS)

- **จุดที่พบ:** การใช้ `${item.avatarUrl}` หรือ URL จากฐานข้อมูลใน `<img src="...">`
- **รายละเอียด:**
  URL รูปภาพที่ดึงมาจาก `user_assets` ถูกนำไปใส่ใน attribute `src` โดยตรง แม้จะมีการใช้ `escapeHTML` กับข้อความทั่วไป แต่ URL ที่มีค่า `javascript:alert(1)` หรือมีเครื่องหมายคำพูดเพื่อปิด Tag แล้วฉีดโค้ดต่อท้ายจะเกิด XSS ได้
- **วิธีแก้ไข:**
  ตรวจสอบว่า URL ขึ้นต้นด้วย `https://` เท่านั้น หรือใช้ `encodeURI()` ก่อนนำไปใส่ใน attribute และที่ดีที่สุดคือใช้ Supabase Storage URL ที่สร้างจาก SDK โดยตรงแทนการเก็บ URL ดิบในฐานข้อมูล

---

### 7. Error Messages เปิดเผยข้อมูลภายใน (Information Disclosure via Error Messages)

- **จุดที่พบ:** หลายไฟล์ เช่น `src/auth/login/login.js` บรรทัด 73, `src/pages/admin/attendance_approve/admin_approve.js` บรรทัด 365
- **รายละเอียด:**
  ข้อความ error จาก Supabase (เช่น `error.message`) ถูกแสดงตรง ๆ ให้ผู้ใช้เห็นผ่าน `alert()` หรือใส่ใน DOM โดยไม่กรอง ข้อความเหล่านี้อาจเปิดเผยชื่อ Table, Constraint, หรือโครงสร้างฐานข้อมูลให้ผู้โจมตีทราบ
  ```javascript
  alert('Error occurred during save: ' + updateError.message);
  ```
- **วิธีแก้ไข:**
  แสดงข้อความ error แบบ Generic ให้ผู้ใช้ เช่น "เกิดข้อผิดพลาด กรุณาลองใหม่" และบันทึก error จริงไว้ใน console หรือระบบ logging แยกต่างหาก

---

### 8. ไม่มี Rate Limiting สำหรับการส่งข้อมูล (No Client-Side Rate Limiting)

- **จุดที่พบ:** ทุกหน้าที่มีการส่งฟอร์มหรือ Query ไปยัง Supabase
- **รายละเอียด:**
  ไม่มีการจำกัดความถี่การส่งข้อมูล ทำให้ผู้ใช้สามารถกด Submit ซ้ำหลายครั้งได้อย่างรวดเร็ว อาจก่อให้เกิดข้อมูลซ้ำซ้อนในฐานข้อมูล หรือ Spam รายการเข้าเรียน และอาจนำไปสู่ DoS ต่อ Supabase API ได้
- **วิธีแก้ไข:**
  เพิ่ม Debounce หรือ Disable ปุ่มหลังกด และตั้งค่า Rate Limiting ในระดับ Supabase Dashboard ด้วย

---

### 9. ไม่มี Audit Trail สำหรับ Action ที่สำคัญ (Missing Audit Logging)

- **จุดที่พบ:** `src/pages/admin/user/admin_userEdit.js`, `src/pages/admin/schedule/admin_schedule.js` และไฟล์อื่น ๆ
- **รายละเอียด:**
  การกระทำที่สำคัญ เช่น ลบผู้ใช้ เปลี่ยนบทบาท อนุมัติการเข้าเรียน ไม่มีการบันทึกว่าใครทำ เมื่อไหร่ ในหลาย Action ไม่สามารถย้อนดูได้ว่าใครเป็นผู้ดำเนินการ
- **วิธีแก้ไข:**
  สร้าง `admin_audit_logs` table หรือใช้ Postgres Trigger บันทึก `actor_id`, `action`, `target_id`, `timestamp` ทุกครั้งที่มี mutation สำคัญ

---

## 🟢 LOW — แนะนำให้แก้ไขในโอกาสถัดไป

---

### 10. Console Logs ใน Production Code (Debug Logs Exposure)

- **จุดที่พบ:** 48 จุด ใน 17 ไฟล์ทั่วทั้งโปรเจกต์ (เช่น `src/main.js`, `src/pages/student/attendance/student.js`, `src/pages/admin/admin_logs/admin_logs.js` ฯลฯ)
- **รายละเอียด:**
  มีการใช้ `console.log()`, `console.error()`, `console.warn()` จำนวนมาก ใน Production Build ข้อมูลเหล่านี้ปรากฏใน DevTools ของเบราว์เซอร์และอาจเปิดเผยข้อมูล Session, Error Stack, หรือโครงสร้างข้อมูลภายในให้ผู้ใช้ทั่วไปเห็นได้
- **วิธีแก้ไข:**
  ลบหรือแทนที่ด้วย Logging Wrapper ที่ปิดการทำงานใน Production เช่น ตรวจสอบ `import.meta.env.MODE !== 'production'`

---

### 11. ความเป็นส่วนตัวของข้อมูลนักเรียนในหน้า Parent Check (Privacy Concern)

- **จุดที่พบ:** `src/pages/parent_check/parent_check.js` (ยังไม่ได้พัฒนา)
- **รายละเอียด:**
  หน้า Parent Check ยังเป็น Stub ว่างเปล่า หากพัฒนาโดยใช้เพียง `stu_id` เป็น Key ในการเข้าถึงข้อมูล ใครก็ตามที่ทราบรหัสนักเรียนจะสามารถดูข้อมูลการเข้าเรียนและประวัติการขาดลาได้ทั้งหมด
- **วิธีแก้ไข:**
  ควรมีกลไกยืนยันตัวตนสองชั้น เช่น รหัสนักเรียน + เบอร์โทรศัพท์ผู้ปกครอง 4 หลักท้าย และต้องใช้ RLS จำกัดข้อมูลฝั่งฐานข้อมูลด้วย

---

## สรุปสถานะ

| ระดับ | จำนวน | รายการ |
|-------|--------|--------|
| 🔴 Critical | 3 | Data scoping, Client-only auth, IDOR |
| 🟠 High | 2 | Login verification, Stored XSS |
| 🟡 Medium | 4 | Image XSS, Error disclosure, Rate limiting, Audit logging |
| 🟢 Low | 2 | Console logs, Parent check privacy |
| **รวม** | **11** | |
