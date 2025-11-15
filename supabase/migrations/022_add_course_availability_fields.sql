-- Adiciona suporte a cursos "Em Breve"
alter table public.courses
  add column if not exists coming_soon boolean not null default false;

alter table public.courses
  add column if not exists available_at timestamptz;

comment on column public.courses.coming_soon is 'Indica se o curso está marcado como Em Breve.';
comment on column public.courses.available_at is 'Data em que o curso ficará disponível para os alunos.';

create index if not exists courses_available_at_idx on public.courses(available_at);
