-- สร้าง Function ตรวจสอบการแก้ไข Profiles
CREATE OR REPLACE FUNCTION public.restrict_profile_critical_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ถ้าผู้แก้ไม่ใช่ admin
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    -- ตรวจสอบว่าแอบเปลี่ยนรหัสนักเรียนหรือไม่
    IF OLD.stu_id IS DISTINCT FROM NEW.stu_id THEN
      RAISE EXCEPTION 'ไม่อนุญาตให้เปลี่ยนรหัสนักเรียน (stu_id) ด้วยตัวเอง';
    END IF;
    -- ตรวจสอบว่าแอบย้ายห้องเรียนหรือไม่
    IF OLD.class_id IS DISTINCT FROM NEW.class_id THEN
      RAISE EXCEPTION 'ไม่อนุญาตให้เปลี่ยนห้องเรียน (class_id) ด้วยตัวเอง';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- นำ Trigger ไปผูกกับตาราง profiles (ก่อน update)
DROP TRIGGER IF EXISTS prevent_unauthorized_profile_update ON public.profiles;
CREATE TRIGGER prevent_unauthorized_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_profile_critical_fields();
