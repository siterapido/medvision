-- Create chat conversations table
create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create chat messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

-- RLS Policies for conversations
create policy "Users can view their own conversations"
  on public.chat_conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.chat_conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.chat_conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.chat_conversations for delete
  using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages in their conversations"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
      and chat_conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their conversations"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.chat_conversations
      where chat_conversations.id = chat_messages.conversation_id
      and chat_conversations.user_id = auth.uid()
    )
  );

-- Create indexes
create index if not exists chat_conversations_user_id_idx on public.chat_conversations(user_id);
create index if not exists chat_messages_conversation_id_idx on public.chat_messages(conversation_id);
create index if not exists chat_messages_created_at_idx on public.chat_messages(created_at);
