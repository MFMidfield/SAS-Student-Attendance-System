-- ลบ Policy เดิมที่กว้างเกินไป
DROP POLICY IF EXISTS "Staff update logs" ON public.attendance_logs;

-- สร้าง Policy ใหม่: 
-- Admin แก้ได้ทุกคน
-- Teacher และ Leader แก้ได้เฉพาะรายการที่ class_id_record ตรงกับ class_id ของตัวเอง
CREATE POLICY "Strict staff update logs" 
ON public.attendance_logs 
FOR UPDATE 
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') 
  OR 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('teacher', 'leader')) 
    AND 
    (auth.jwt() -> 'user_metadata' ->> 'class_id' = class_id_record)
  )
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') 
  OR 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' IN ('teacher', 'leader')) 
    AND 
    (auth.jwt() -> 'user_metadata' ->> 'class_id' = class_id_record)
  )
);
