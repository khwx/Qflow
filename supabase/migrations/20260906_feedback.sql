-- Feedback pós-atendimento 1-5 ★ + tags
create table if not exists public.feedback (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.tickets(id) on delete cascade not null,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  tags text[] default '{}',
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index if not exists idx_feedback_establishment on public.feedback(establishment_id);
create index if not exists idx_feedback_ticket on public.feedback(ticket_id);
create index if not exists idx_feedback_rating on public.feedback(rating);
alter table public.feedback enable row level security;
drop policy if exists "Feedback viewable by everyone" on public.feedback;
create policy "Feedback viewable by everyone" on public.feedback for select using (true);
drop policy if exists "Feedback insertable by everyone" on public.feedback;
create policy "Feedback insertable by everyone" on public.feedback for insert with check (true);
drop policy if exists "Feedback updatable by owner" on public.feedback;
create policy "Feedback updatable by owner" on public.feedback for update using (
  exists (select 1 from public.establishments where establishments.id = feedback.establishment_id and establishments.owner_id = auth.uid())
);
alter publication supabase_realtime add table public.feedback;
-- Append to schema.sql for completeness (idempotent)
