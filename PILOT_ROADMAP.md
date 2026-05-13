# 🗺️ Pilot Phase Roadmap (1 Classroom Test)

แผนการดำเนินงานสำหรับการทดลองใช้กับนักเรียน 1 ห้องเรียน เพื่อให้ระบบพร้อมที่สุดในเวลาที่สั้นที่สุด

---

## 🚩 Phase 1: Preparation (Must-Have)
*เป้าหมาย: ลดความผิดพลาดของข้อมูล และทำให้ครูใช้งานได้จริง*

1.  **[UI/UX] Show Password Toggle**: เพิ่มในหน้า Login/Register ทันที
2.  **[/] Smart Subject Locking**: เมื่อกด "มาเรียน" ให้ระบบล็อกวิชาตามเวลาปัจจุบันอัตโนมัติ
3.  **[/] Conditional Leave**: ระบบเลือกลา (กิจ/ป่วย) พร้อมบังคับใส่เหตุผล
4.  **[UI] Teacher Quick View**: หน้าสรุปรายการเช็คชื่อสำหรับครูประจำชั้น (Filter เฉพาะห้องที่ทดลอง)
5.  **[Data] Export Excel**: ปุ่มดาวน์โหลด Log การเข้าเรียนของห้องทดลอง

---

## 🛠️ Phase 2: Management (Should-Have)
*เป้าหมาย: จัดการระบบได้ง่ายขึ้นเมื่อเจอเคสพิเศษ*

1.  **[Auth] Forgot Password Flow**: ระบบรีเซ็ตรหัสผ่านผ่านอีเมล
2.  **[Admin] User Edit UI**: หน้าจอให้ครูแก้ไขข้อมูลนักเรียนที่กรอกผิด (ชื่อ/นามสกุล/รหัสนักเรียน)
3.  **[Security] Restricted Sign-up**: ปิดสมัครสมาชิกทั่วไป ให้ Admin/ครู เป็นคนเพิ่มชื่อเท่านั้น
4.  **[Refactor] Component-based UI**: ปรับแต่ง Logic ซ้ำซ้อนเข้าสู่ `src/lib/ui.js`
    - [ ] Confirmation Modal with Countdown
    - [ ] Reject Detail Modal (Dynamic)
    - [ ] Profile Header Component
    - [ ] Loading Overlay / Spinner
    - [ ] Circular Countdown Utility


---

## 🚀 Phase 3: Scaling (Nice-to-Have)
*เป้าหมาย: ขยายผลสู่ทั้งระดับชั้นหรือทั้งโรงเรียน*

1.  **[Integration] LINE OA**: ระบบแจ้งเตือนผู้ปกครองแบบ Real-time
2.  **[Automation] Auto-Absent**: ระบบตัดชื่อ "ขาด" อัตโนมัติเมื่อหมดเวลา
3.  **[Data] Bulk Import**: ระบบอัปโหลดตารางสอนและรายชื่อนักเรียนผ่าน Excel
4.  **[System] Subject Teacher**: ระบบแยกสิทธิ์ครูประจำวิชาแต่ละคน

---

## 📝 Checklist สำหรับวันเริ่มทดลอง (Day 1)
- [ ] Account สำหรับนักเรียนครบทุกคน (หรือเตรียม Link สมัครที่ตรวจสอบได้)
- [ ] ตารางสอน (Schedule) ของห้องนั้นๆ ถูกนำเข้าระบบครบถ้วน
- [ ] ครูประจำชั้นเข้าใจวิธีการกด "Approve" หรือดูรายการเช็คชื่อ
- [ ] คู่มือการใช้งานสั้นๆ (1 หน้า) หรือคลิปวิดีโอแนะนำ 1 นาที