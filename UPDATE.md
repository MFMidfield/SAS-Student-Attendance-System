Date/Month/Year
9/5/26
-เพิ่ม modal
-เพิ่ม toast
-เพิ่ม dashboad-student
-เพิ่ม setting-student

10/5/26
-เพิ่ม dashboad-admin
-เพิ่ม user-edit-admin
-เพิ่ม setting-admin
-เพิ่ม schedule-admin
-เพิ่ม verify-log-admin
-ปรับแต่ง Neubrutalist Design (Login, Register, Admin Logs, Approve, Verify)
-ปรับโครงสร้าง Auth Folder
-เพิ่มระบบ Parent Check (ตัวอย่าง)
-เพิ่ม Filter วันในหน้า Schedule Admin
-เพิ่ม Animation นับถอยหลังในหน้ายืนยันการเช็คชื่อ (Student)

11/5/26
-เพิ่มระบบ Upload และ Crop รูปโปรไฟล์ (Admin Setting)
-เชื่อมต่อ Supabase Storage (avatars) และฐานข้อมูล user_assets
-ปรับโครงสร้างการดึงข้อมูลโปรไฟล์แบบรวมศูนย์ (Centralized Profile Fetching) ใน main.js
-เพิ่มระบบยืนยันการบันทึก (Save Confirmation Modal)
-เปลี่ยนการใช้ Emoji เป็น SVG ในหน้า Setting เพื่อความสวยงามและ Premium

12/5/26
- ปรับโครงสร้างตารางเข้าเรียนเป็น Unified Table (ใช้ตารางเดียวจัดการอัปเดตสถานะทั้งหมด)
- เพิ่มปุ่ม Dropdown แก้ไขสถานะและกล่องใส่เหตุผล (บังคับกรอก) พร้อม Validation แบบสั่น ตอนกด Unapprove
- ปรับปรุง UI ปุ่มกดในตารางหน้า Approve ให้แสดงป้ายสถานะ (Pending/Approved/Rejected) และแสดงชื่อผู้ตรวจสอบ
- เพิ่ม Modal หน้าต่างแสดงรายละเอียดเหตุผลที่ถูก Reject 
- ปรับปรุงระบบ Verify All โดยย้ายปุ่มไปไว้ท้ายตาราง, กรองเฉพาะนักเรียนที่รอตรวจ, และสามารถเลือกสถานะรายคน (รวมถึงสถานะ Absent) ก่อนกดอนุมัติรวดเดียวผ่าน Batch Update

13/5/26
- ปรับโครงสร้างระบบ (Unified Architecture) สำหรับ Teacher และ Leader ให้ใช้งานระบบตรวจเช็คชื่อ (Attendance Approve) ตัวเดียวกับ Admin เพื่อความเสถียรและลดโค้ดที่ซ้ำซ้อน
- ยกเลิกการใช้งานตาราง `attendance_verify` อย่างถาวร และเปลี่ยนมาใช้ระบบ Status Update ในตาราง `attendance_logs` เพียงตารางเดียว
- ปรับปรุงหน้า Admin Logs ให้เป็นหน้าสรุปข้อมูล (Purely Informational) สำหรับการตรวจสอบย้อนหลังและ Export ข้อมูลเท่านั้น
- พัฒนาระบบ Validation ในการส่งใบลา (Sick/Personal/Activity) โดยบังคับกรอกเหตุผลและระบุช่วงเวลา (Full Day/Morning/Afternoon) พร้อม UI แจ้งเตือนหากมีข้อมูลซ้ำซ้อน
- ปรับจูน UI และ Animation ของ Modal ยืนยันตัวตน (Countdown Timer) ให้เป็นมาตรฐานเดียวกันทั้งระบบ