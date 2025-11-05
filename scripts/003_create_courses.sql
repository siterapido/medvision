-- Create courses table
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  thumbnail_url text,
  duration_minutes integer,
  instructor text,
  category text,
  level text check (level in ('iniciante', 'intermediario', 'avancado')),
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create lessons table
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  duration_minutes integer,
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (courses are public for viewing)
alter table public.courses enable row level security;
alter table public.lessons enable row level security;

-- RLS Policies - Allow all authenticated users to view published courses
create policy "Anyone can view published courses"
  on public.courses for select
  using (is_published = true);

create policy "Anyone can view lessons of published courses"
  on public.lessons for select
  using (
    exists (
      select 1 from public.courses
      where courses.id = lessons.course_id
      and courses.is_published = true
    )
  );

-- Create indexes
create index if not exists lessons_course_id_idx on public.lessons(course_id);
create index if not exists lessons_order_idx on public.lessons(course_id, order_index);
