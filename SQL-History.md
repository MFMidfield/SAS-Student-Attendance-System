-- 1. สร้างตาราง Profiles (ถ้ายังไม่มี หรือจะลบสร้างใหม่)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  stu_id text unique,
  fullname text,
  lastname text,
  class_id text,
  updated_at timestamptz default now()
);

-- 2. สร้าง Function ที่จะทำงานเมื่อมี User ใหม่
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, stu_id, fullname, lastname, class_id)
  values (
    new.id,
    new.raw_user_meta_data->>'stu_id',
    new.raw_user_meta_data->>'fullname',
    new.raw_user_meta_data->>'lastname',
    new.raw_user_meta_data->>'class_id'
  );
  return new;
end;
$$;

-- 3. ผูก Function เข้ากับ Trigger ของตาราง auth.users
-- หมายเหตุ: ถ้าเคยสร้างไว้แล้วต้อง drop ของเก่าก่อน
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- เปิดใช้งาน Row Level Security (RLS) เพื่อความปลอดภัย
alter table profiles enable row level security;

-- สร้าง Policy: ยอมให้ User อ่านข้อมูลของตัวเองได้เท่านั้น
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- สร้าง Policy: ยอมให้ User แก้ไขข้อมูลของตัวเองได้เท่านั้น
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- เปิด RLS เพื่อความปลอดภัย
alter table attendance_logs enable row level security;

-- Policy: ให้นักเรียนบันทึกข้อมูลของตัวเองได้เท่านั้น
create policy "Students can insert their own logs" on attendance_logs
  for insert with check (auth.uid() = student_id);

-- Policy: ให้นักเรียนดูประวัติการเข้าเรียนของตัวเองได้เท่านั้น
create policy "Students can view their own logs" on attendance_logs
  for select using (auth.uid() = student_id);

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.attendance_logs 
add column stu_id_record text,
add column fullname_record text;

-- สร้าง Function สำหรับไปหยิบข้อมูลมาแปะ
create or replace function public.copy_student_info_to_log()
returns trigger
language plpgsql
security definer
as $$
begin
  -- ค้นหาข้อมูลจากตาราง profiles โดยใช้ id ของคนที่กำลังบันทึก
  select stu_id, fullname into new.stu_id_record, new.fullname_record
  from public.profiles
  where id = new.student_id;
  
  return new;
end;
$$;

-- สร้าง Trigger ให้ทำงานทุกครั้งก่อนมีการ Insert ข้อมูลลง attendance_logs
drop trigger if exists on_attendance_created on public.attendance_logs;

create trigger on_attendance_created
  before insert on public.attendance_logs
  for each row execute procedure public.copy_student_info_to_log();

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.attendance_logs 
alter column note set default '-';

-- สำหรับข้อมูลเก่าที่เป็น NULL อยู่แล้ว ให้ Update เป็นขีดให้หมด
update public.attendance_logs 
set note = '-' 
where note is null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.attendance_logs 
add column lastname_record text;

create or replace function public.copy_student_info_to_log()
returns trigger
language plpgsql
security definer
as $$
begin
  -- ดึง stu_id, fullname และ lastname มาพร้อมกันเลย
  select stu_id, fullname, lastname 
  into new.stu_id_record, new.fullname_record, new.lastname_record
  from public.profiles
  where id = new.student_id;
  
  -- จัดการเรื่อง Note ว่างไปในตัว (ตามที่คุยกันไว้ก่อนหน้า)
  if (new.note is null or new.note = '') then
    new.note := '-';
  end if;
  
  return new;
end;
$$;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. เปลี่ยนชื่อในตาราง profiles
alter table public.profiles 
rename column fullname to firstname;

-- 2. เปลี่ยนชื่อในตาราง attendance_logs (ตัวที่เราทำ snapshot ไว้)
alter table public.attendance_logs 
rename column fullname_record to firstname_record;

-- แก้ไข Function ตอนสมัครงาน (Register)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, stu_id, firstname, lastname, class_id)
  values (
    new.id,
    new.raw_user_meta_data->>'stu_id',
    new.raw_user_meta_data->>'firstname', -- แก้ตรงนี้
    new.raw_user_meta_data->>'lastname',
    new.raw_user_meta_data->>'class_id'
  );
  return new;
end;
$$;

-- แก้ไข Function ตอนเช็คชื่อ (Attendance)
create or replace function public.copy_student_info_to_log()
returns trigger
language plpgsql
security definer
as $$
begin
  select stu_id, firstname, lastname -- แก้ตรงนี้
  into new.stu_id_record, new.firstname_record, new.lastname_record -- และตรงนี้
  from public.profiles
  where id = new.student_id;
  
  if (new.note is null or new.note = '') then
    new.note := '-';
  end if;
  return new;
end;
$$;



--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.profiles 
add column role text default 'student';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, stu_id, firstname, lastname, class_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'stu_id',
    new.raw_user_meta_data->>'firstname',
    new.raw_user_meta_data->>'lastname',
    new.raw_user_meta_data->>'class_id',
    coalesce(new.raw_user_meta_data->>'role', 'student') -- ถ้าไม่มีส่งมา ให้ใส่ student
  );
  return new;
end;
$$;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

update public.profiles 
set role = 'student' 
where role is null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create table schedule (
  id uuid default gen_random_uuid() primary key,
  subject_name text not null,
  period int2, -- เพิ่ม column คาบเรียน (เช่น คาบที่ 1, 2, 3)
  room text,
  teacher_name text,
  day_of_week int2 check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  grade_level text,
  created_at timestamptz default now()
);

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.profiles 
drop constraint if exists check_role_types;

-- 2. สร้าง Constraint ใหม่ที่รวม 'leader' เข้าไปด้วย
alter table public.profiles 
add constraint check_role_types 
check (role in ('admin', 'teacher', 'student', 'leader'));

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create policy "Public Access" 
on schedule for select 
using (true);

-- 3. Policy: เฉพาะ Admin และ Teacher เท่านั้นที่ แก้ไข/ลบ/เพิ่ม ได้
create policy "Admins and Teachers can manage schedules" 
on schedule for all -- covers insert, update, delete
to authenticated -- ต้องล็อกอินเท่านั้น
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() -- เช็คว่า ID ตรงกับคนล็อกอินไหม
    and profiles.role in ('admin', 'teacher') -- และต้องมี role ที่กำหนด
  )
);

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

update profiles set role = 'admin' where stu_id = '66000';

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create or replace function public.sync_role_to_auth()
returns trigger
language plpgsql
security definer set search_path = auth, public
as $$
begin
  -- อัปเดตข้อมูลในตาราง auth.users ช่อง raw_user_meta_data
  update auth.users
  set raw_user_meta_data = 
    coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  
  return new;
end;
$$;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

drop trigger if exists on_profile_role_update on public.profiles;

create trigger on_profile_role_update
  after insert or update of role on public.profiles
  for each row execute procedure public.sync_role_to_auth();

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. ลบ Policy เดิมที่อาจจะซ้ำซ้อน (ถ้ามี)
drop policy if exists "Admins can view everything" on public.profiles;

-- 2. สร้าง Policy ใหม่สำหรับ Admin
create policy "Admins can view everything"
on public.profiles
for select
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);


--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. เพิ่ม column แบบยอมให้ว่างก่อน (เพื่อไม่ให้พังเพราะข้อมูลเก่า)
alter table public.profiles 
add column created_at timestamptz;

-- 2. ใส่ค่าให้ข้อมูลเก่า (สมมติให้เป็นวันที่ 1 ของปี 2026 แทนเลข 1 เพื่อให้ระบบไม่ Error)
update public.profiles 
set created_at = '2026-01-01 00:00:00+00' 
where created_at is null;

-- 3. ตั้งค่า Default ให้ข้อมูลใหม่ และเปลี่ยนเป็น NOT NULL
alter table public.profiles 
alter column created_at set default now(),
alter column created_at set not null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, stu_id, firstname, lastname, class_id, role, created_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'stu_id', '-'),
    coalesce(new.raw_user_meta_data->>'firstname', 'New'),
    coalesce(new.raw_user_meta_data->>'lastname', 'User'),
    coalesce(new.raw_user_meta_data->>'class_id', 'N/A'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.created_at -- ดึงเวลาสร้างจากตาราง auth.users มาใช้โดยตรง
  );
  return new;
end;
$$;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.attendance_logs 
add column class_id_record text;

create or replace function public.copy_student_info_to_log()
returns trigger
language plpgsql
security definer
as $$
begin
  -- ดึงข้อมูลทุกอย่างที่จำเป็น (firstname, lastname, stu_id, class_id) มาในครั้งเดียว
  select stu_id, firstname, lastname, class_id 
  into new.stu_id_record, new.firstname_record, new.lastname_record, new.class_id_record
  from public.profiles
  where id = new.student_id;
  
  -- จัดการเรื่อง Note ว่าง (Default value)
  if (new.note is null or new.note = '') then
    new.note := '-';
  end if;
  
  return new;
end;
$$;

update public.attendance_logs al
set class_id_record = p.class_id
from public.profiles p
where al.student_id = p.id
and al.class_id_record is null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create policy "Admins, teachers, and leaders can view all attendance logs" on public.attendance_logs
  for select -- เฉพาะการดูข้อมูลเท่านั้น
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and (role = 'admin' or role = 'teacher' or role = 'leader')
    )
  );

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create policy "Admins can update any profile" on public.profiles
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

create table public.attendance_verify (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  stu_id_record text,
  firstname_record text,
  lastname_record text,
  class_id_record text,
  status text,
  note text default '-',
  
  -- ส่วนที่เพิ่มขึ้นมาเพื่อการ Verify
  is_verified boolean default false, -- สถานะว่ายืนยันหรือยัง
  verified_by uuid references public.profiles(id), -- ใครเป็นคนกด (Teacher/Leader)
  verified_at timestamptz, -- ยืนยันเมื่อไหร่
  
  created_at timestamptz default now() not null
);

-- ผูก Trigger ตัวเดิมเข้ากับตารางใหม่
create trigger before_verify_insert
  before insert on public.attendance_verify
  for each row execute procedure public.copy_student_info_to_log();

  -- เพิ่มในตาราง attendance_logs
alter table public.attendance_logs 
add column subject text default 'homeroom' not null;

-- เพิ่มในตาราง attendance_verify
alter table public.attendance_verify 
add column subject text default 'homeroom' not null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. เปิดใช้งาน RLS สำหรับตาราง verify (ถ้ายังไม่ได้เปิด)
alter table public.attendance_verify enable row level security;

-- 2. สร้าง Policy ให้ Admin ดูข้อมูลได้ทั้งหมด
create policy "Admins can view all verification pending logs" on public.attendance_verify
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role = 'admin'
    )
  );

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. ลบ Policy เก่าทิ้งก่อน (ถ้ามี)
drop policy if exists "Admins can view all verification pending logs" on public.attendance_verify;

-- 2. สร้างใหม่: สำหรับครู และ หัวหน้า (ดูได้ทุกคน)
create policy "Admins can view all verification pending logs" on public.attendance_verify
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'teacher', 'leader')
    )
  );

-- 3. สร้างใหม่: สำหรับนักเรียน (ดูได้เฉพาะของตัวเอง)
create policy "Students can view their own verification logs" on public.attendance_verify
  for select
  using (student_id = auth.uid());

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

alter table public.profiles 
add column email text unique;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, stu_id, firstname, lastname, class_id, role, created_at)
  values (
    new.id,
    new.email, -- ดึง email จาก auth.users มาใส่ตรงๆ
    coalesce(new.raw_user_meta_data->>'stu_id', '-'),
    coalesce(new.raw_user_meta_data->>'firstname', 'New'),
    coalesce(new.raw_user_meta_data->>'lastname', 'User'),
    coalesce(new.raw_user_meta_data->>'class_id', 'N/A'),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.created_at
  );
  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

-- สร้าง Trigger ให้ทำงานทุกครั้งที่มีการ Update ใน auth.users
drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
and p.email is null;

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

-- 1. ลบ Policy เดิม (ถ้ามี) เพื่อป้องกันชื่อซ้ำ
drop policy if exists "Staff and leaders can delete logs" on public.attendance_logs;

-- 2. สร้าง Policy ใหม่สำหรับการลบข้อมูล (Delete)
create policy "Staff and leaders can delete logs" on public.attendance_logs
  for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'teacher', 'leader')
    )
  );

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------

drop policy if exists "Staff and Leaders can insert verification logs" on public.attendance_verify;

-- 2. สร้าง Policy ใหม่ให้ Admin, Teacher และ Leader สามารถ Insert ข้อมูลได้
create policy "Staff and Leaders can insert verification logs" on public.attendance_verify
  for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() 
      and role in ('admin', 'teacher', 'leader')
    )
  );

--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------



--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------



--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------



--------------------------------------------------------------------------------------------------------------------
--------------------------------------------------------------------------------------------------------------------
