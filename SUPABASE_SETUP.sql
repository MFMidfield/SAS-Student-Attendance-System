-- ========================================================
-- LUNAR PROJECT: SUPABASE DATABASE SETUP SCRIPT
-- Consolidated from SQL History for a fresh setup.
-- ========================================================

-- 1. EXTENSIONS
-- Ensure uuid-ossp is available for gen_random_uuid()
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- 2.1 Profiles Table (Linked to auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  stu_id text unique,
  firstname text,
  lastname text,
  class_id text default 'N/A',
  role text default 'student',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now(),
  
  constraint check_role_types check (role in ('admin', 'teacher', 'student', 'leader', 'New'))
);

-- 2.2 Attendance Logs (Pending verification)
create table public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  stu_id_record text,
  firstname_record text,
  lastname_record text,
  class_id_record text,
  status text,
  note text default '-',
  subject text default 'homeroom' not null,
  created_at timestamptz default now() not null
);

-- 2.3 Attendance Verify (Confirmed records)
create table public.attendance_verify (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  stu_id_record text,
  firstname_record text,
  lastname_record text,
  class_id_record text,
  status text,
  note text default '-',
  subject text default 'homeroom' not null,
  is_verified boolean default false,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz default now() not null
);

-- 2.4 Schedule Table
create table public.schedule (
  id uuid default gen_random_uuid() primary key,
  subject_name text not null,
  period int2,
  room text,
  teacher_name text,
  day_of_week int2 check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  grade_level text,
  created_at timestamptz default now()
);

-- 3. FUNCTIONS & TRIGGERS

-- 3.1 Handle New User Registration
-- Automatically creates a profile when someone signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, stu_id, firstname, lastname, class_id, role, created_at)
  values (
    new.id,
    new.email,
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3.2 Sync Email from Auth to Profile
create or replace function public.sync_user_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute procedure public.sync_user_email();

-- 3.3 Sync Role from Profile to Auth Metadata
-- This allows checking roles via JWT without extra database queries
create or replace function public.sync_role_to_auth()
returns trigger language plpgsql security definer set search_path = auth, public as $$
begin
  update auth.users
  set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$;

create trigger on_profile_role_update
  after insert or update of role on public.profiles
  for each row execute procedure public.sync_role_to_auth();

-- 3.4 Snapshot Student Info on Attendance Log
-- Copies data from profiles to log tables at the moment of check-in
create or replace function public.copy_student_info_to_log()
returns trigger language plpgsql security definer as $$
begin
  select stu_id, firstname, lastname, class_id 
  into new.stu_id_record, new.firstname_record, new.lastname_record, new.class_id_record
  from public.profiles where id = new.student_id;
  
  if (new.note is null or new.note = '') then new.note := '-'; end if;
  return new;
end;
$$;

create trigger before_attendance_insert
  before insert on public.attendance_logs
  for each row execute procedure public.copy_student_info_to_log();

create trigger before_verify_insert
  before insert on public.attendance_verify
  for each row execute procedure public.copy_student_info_to_log();

-- 4. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.attendance_verify enable row level security;
alter table public.schedule enable row level security;

-- 4.1 Profiles Policies
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins view all profiles" on public.profiles for select using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
create policy "Admins update any profile" on public.profiles for update using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 4.2 Attendance Logs Policies
create policy "Students insert own logs" on public.attendance_logs for insert with check (auth.uid() = student_id);
create policy "Students view own logs" on public.attendance_logs for select using (auth.uid() = student_id);
create policy "Staff view all logs" on public.attendance_logs for select using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'teacher', 'leader') );
create policy "Staff delete logs" on public.attendance_logs for delete using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'teacher', 'leader') );

-- 4.3 Attendance Verify Policies
create policy "Students view own verify" on public.attendance_verify for select using (auth.uid() = student_id);
create policy "Staff view all verify" on public.attendance_verify for select using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'teacher', 'leader') );
create policy "Staff insert verify" on public.attendance_verify for insert with check ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'teacher', 'leader') );

-- 4.4 Schedule Policies
create policy "Public view schedule" on public.schedule for select using (true);
create policy "Admins manage schedule" on public.schedule for all using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'teacher') );

-- ========================================================
-- SETUP COMPLETE
-- ========================================================
