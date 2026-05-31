-- ลบ Policy เดิม
DROP POLICY IF EXISTS "Admins and Teachers can manage schedules" ON public.schedule;

-- สร้างใหม่: Admin จัดการได้หมด, Teacher จัดการได้แค่ห้องตัวเอง
CREATE POLICY "Strict schedule management" 
ON public.schedule 
FOR ALL 
TO authenticated 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') 
  OR 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'teacher') 
    AND 
    (auth.jwt() -> 'user_metadata' ->> 'class_id' = room)
  )
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') 
  OR 
  (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'teacher') 
    AND 
    (auth.jwt() -> 'user_metadata' ->> 'class_id' = room)
  )
);
