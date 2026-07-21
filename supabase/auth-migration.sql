-- Auth Migration: Add triggers and improvements for QFlow

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Apply trigger to all tables
create trigger handle_establishments_updated_at
  before update on public.establishments
  for each row execute function public.handle_updated_at();

create trigger handle_queues_updated_at
  before update on public.queues
  for each row execute function public.handle_updated_at();

create trigger handle_tickets_updated_at
  before update on public.tickets
  for each row execute function public.handle_updated_at();

create trigger handle_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

create trigger handle_games_updated_at
  before update on public.games
  for each row execute function public.handle_updated_at();

create trigger handle_polls_updated_at
  before update on public.polls
  for each row execute function public.handle_updated_at();

create trigger handle_customers_updated_at
  before update on public.customers
  for each row execute function public.handle_updated_at();

-- Function to generate ticket numbers
create or replace function public.generate_ticket_number(queue_uuid uuid)
returns text as $$
declare
  next_number integer;
  ticket_num text;
begin
  select current_number + 1 into next_number
  from public.queues
  where id = queue_uuid
  for update;

  update public.queues
  set current_number = next_number
  where id = queue_uuid;

  ticket_num := lpad(next_number::text, 3, '0');
  return ticket_num;
end;
$$ language plpgsql security definer;

-- Add owner_id to tickets and orders for easier queries
alter table public.tickets add column if not exists owner_id uuid references auth.users(id);
alter table public.orders add column if not exists owner_id uuid references auth.users(id);

-- Add missing indexes
create index if not exists idx_orders_establishment_id on public.orders(establishment_id);
create index if not exists idx_orders_ticket_id on public.orders(ticket_id);
create index if not exists idx_game_scores_ticket_id on public.game_scores(ticket_id);
create index if not exists idx_customers_establishment_id on public.customers(establishment_id);
create index if not exists idx_poll_responses_poll_id on public.poll_responses(poll_id);

-- Enable realtime for additional tables
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.polls;
