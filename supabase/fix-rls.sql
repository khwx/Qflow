-- fix-rls.sql
-- Drops all existing RLS policies and recreates permissive policies for anonymous access.
-- Also seeds sample data idempotently.

-- ============================================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================================

-- establishments
drop policy if exists "Establishments are viewable by everyone" on public.establishments;
drop policy if exists "Establishments are insertable by authenticated users" on public.establishments;
drop policy if exists "Establishments are updatable by owner" on public.establishments;

-- queues
drop policy if exists "Queues are viewable by everyone" on public.queues;
drop policy if exists "Queues are insertable by owner" on public.queues;
drop policy if exists "Queues are updatable by owner" on public.queues;

-- tickets
drop policy if exists "Tickets are viewable by everyone" on public.tickets;
drop policy if exists "Tickets are insertable by everyone" on public.tickets;
drop policy if exists "Tickets are updatable by owner" on public.tickets;

-- orders
drop policy if exists "Orders are viewable by owner" on public.orders;
drop policy if exists "Orders are insertable by everyone" on public.orders;

-- games
drop policy if exists "Games are viewable by everyone" on public.games;
drop policy if exists "Games are insertable by owner" on public.games;
drop policy if exists "Games are updatable by owner" on public.games;

-- game_scores
drop policy if exists "Game scores are viewable by everyone" on public.game_scores;
drop policy if exists "Game scores are insertable by everyone" on public.game_scores;

-- customers (may not have policies, but safe to drop)
drop policy if exists "Customers are viewable by owner" on public.customers;
drop policy if exists "Customers are insertable by authenticated users" on public.customers;
drop policy if exists "Customers are updatable by owner" on public.customers;

-- polls
drop policy if exists "Polls are viewable by everyone" on public.polls;
drop policy if exists "Polls are insertable by owner" on public.polls;

-- poll_responses
drop policy if exists "Poll responses are viewable by everyone" on public.poll_responses;
drop policy if exists "Poll responses are insertable by everyone" on public.poll_responses;

-- ============================================================
-- 2. CREATE PERMISSIVE POLICIES FOR ANONYMOUS ACCESS
-- ============================================================

-- establishments
create policy "establishments_select" on public.establishments
  for select using (true);

create policy "establishments_insert" on public.establishments
  for insert with check (true);

create policy "establishments_update" on public.establishments
  for update using (true);

create policy "establishments_delete" on public.establishments
  for delete using (true);

-- queues
create policy "queues_select" on public.queues
  for select using (true);

create policy "queues_insert" on public.queues
  for insert with check (true);

create policy "queues_update" on public.queues
  for update using (true);

create policy "queues_delete" on public.queues
  for delete using (true);

-- tickets
create policy "tickets_select" on public.tickets
  for select using (true);

create policy "tickets_insert" on public.tickets
  for insert with check (true);

create policy "tickets_update" on public.tickets
  for update using (true);

create policy "tickets_delete" on public.tickets
  for delete using (true);

-- orders
create policy "orders_select" on public.orders
  for select using (true);

create policy "orders_insert" on public.orders
  for insert with check (true);

create policy "orders_update" on public.orders
  for update using (true);

create policy "orders_delete" on public.orders
  for delete using (true);

-- games
create policy "games_select" on public.games
  for select using (true);

create policy "games_insert" on public.games
  for insert with check (true);

create policy "games_update" on public.games
  for update using (true);

create policy "games_delete" on public.games
  for delete using (true);

-- game_scores
create policy "game_scores_select" on public.game_scores
  for select using (true);

create policy "game_scores_insert" on public.game_scores
  for insert with check (true);

create policy "game_scores_update" on public.game_scores
  for update using (true);

create policy "game_scores_delete" on public.game_scores
  for delete using (true);

-- customers
create policy "customers_select" on public.customers
  for select using (true);

create policy "customers_insert" on public.customers
  for insert with check (true);

create policy "customers_update" on public.customers
  for update using (true);

-- polls
create policy "polls_select" on public.polls
  for select using (true);

create policy "polls_insert" on public.polls
  for insert with check (true);

create policy "polls_update" on public.polls
  for update using (true);

create policy "polls_delete" on public.polls
  for delete using (true);

-- poll_responses
create policy "poll_responses_select" on public.poll_responses
  for select using (true);

create policy "poll_responses_insert" on public.poll_responses
  for insert with check (true);

create policy "poll_responses_update" on public.poll_responses
  for update using (true);

-- ============================================================
-- 3. SEED DATA (idempotent)
-- ============================================================

insert into public.establishments (id, name, slug, category, is_active)
values (
  'a0000000-0000-0000-0000-000000000001',
  'Mercado do Bairro',
  'mercado01',
  'retail',
  true
)
on conflict (slug) do nothing;

insert into public.queues (id, establishment_id, name, is_active, estimated_wait_minutes)
values (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Caixa Rápido',
  true,
  3
)
on conflict (id) do nothing;

insert into public.queues (id, establishment_id, name, is_active, estimated_wait_minutes)
values (
  'b0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Atendimento Geral',
  true,
  8
)
on conflict (id) do nothing;

insert into public.games (id, establishment_id, name, type, is_active, points_reward)
values (
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Quiz do Bairro',
  'quiz',
  true,
  15
)
on conflict (id) do nothing;

insert into public.games (id, establishment_id, name, type, is_active, points_reward)
values (
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000001',
  'Memória Colorida',
  'memory',
  true,
  20
)
on conflict (id) do nothing;

insert into public.games (id, establishment_id, name, type, is_active, points_reward)
values (
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'Roleta da Sorte',
  'spin',
  true,
  10
)
on conflict (id) do nothing;
