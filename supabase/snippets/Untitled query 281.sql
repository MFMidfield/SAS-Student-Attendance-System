-- กันเหนียว Policy สำหรับนักเรียน: ไม่อนุญาตให้ลบ log เลยไม่ว่ากรณีใด
DROP POLICY IF EXISTS "Students cannot delete logs" ON public.attendance_logs;
CREATE POLICY "Students cannot delete logs" 
ON public.attendance_logs 
FOR DELETE 
TO authenticated 
USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'); 
-- (ให้เฉพาะ admin ที่ลบได้)
