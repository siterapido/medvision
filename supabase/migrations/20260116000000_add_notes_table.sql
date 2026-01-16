-- Create notes table for saving generic chat responses
create table if not exists notes (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    content text not null,
    origin_message_id uuid, -- Optional link to original chat message
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table notes enable row level security;

create policy "Users can view their own notes"
    on notes for select
    using (auth.uid() = user_id);

create policy "Users can insert their own notes"
    on notes for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own notes"
    on notes for update
    using (auth.uid() = user_id);

create policy "Users can delete their own notes"
    on notes for delete
    using (auth.uid() = user_id);

-- Add updated_at trigger
create trigger set_notes_updated_at
    before update on notes
    for each row
    execute function public.handle_updated_at();
