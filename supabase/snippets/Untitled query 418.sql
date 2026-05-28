-- Migration: Add Roll Number (เลขที่) feature
-- Adds roll_no to profiles and roll_no_record to attendance_logs
-- Updates related trigger functions to copy the roll number.

-- 1. Add column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roll_no INT DEFAULT 0;

-- 2. Add column to attendance_logs
ALTER TABLE public.attendance_logs 
ADD COLUMN IF NOT EXISTS roll_no_record INT;

-- 3. Update handle_new_user function to pull roll_no from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, email, stu_id, firstname, lastname, class_id, role, roll_no, created_at)
  values (
    new.id,
    new.email, -- ดึง email จาก auth.users มาใส่ตรงๆ
    coalesce(new.raw_user_meta_data->>'stu_id', '-'),
    coalesce(new.raw_user_meta_data->>'firstname', 'New'),
    coalesce(new.raw_user_meta_data->>'lastname', 'User'),
    coalesce(new.raw_user_meta_data->>'class_id', 'N/A'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce((new.raw_user_meta_data->>'roll_no')::integer, 0), -- เพิ่มตรงนี้
    new.created_at
  );
  return new;
end;
$$;

-- 4. Update copy_student_info_to_log function to fetch roll_no
CREATE OR REPLACE FUNCTION public.copy_student_info_to_log() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  -- ดึงข้อมูลทุกอย่างที่จำเป็น (firstname, lastname, stu_id, class_id, roll_no) มาในครั้งเดียว
  select stu_id, firstname, lastname, class_id, roll_no 
  into new.stu_id_record, new.firstname_record, new.lastname_record, new.class_id_record, new.roll_no_record
  from public.profiles
  where id = new.student_id;
  
  -- จัดการเรื่อง Note ว่าง (Default value)
  if (new.note is null or new.note = '') then
    new.note := '-';
  end if;
  
  return new;
end;
$$;
