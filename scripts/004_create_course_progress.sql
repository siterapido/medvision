-- Create course progress table
create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  completed boolean default false,
  progress_percentage integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  last_watched_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, course_id, lesson_id)
);

-- Enable RLS
alter table public.course_progress enable row level security;

-- RLS Policies
create policy "Users can view their own progress"
  on public.course_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.course_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.course_progress for update
  using (auth.uid() = user_id);

-- Create indexes
create index if not exists course_progress_user_id_idx on public.course_progress(user_id);
create index if not exists course_progress_course_id_idx on public.course_progress(course_id);
