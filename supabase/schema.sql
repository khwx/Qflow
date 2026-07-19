-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Estabelecimentos
create table if not exists public.establishments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  description text,
  category text not null default 'general',
  address text,
  phone text,
  logo_url text,
  primary_color text default '#4f46e5',
  secondary_color text default '#7c3aed',
  is_active boolean default true,
  owner_id uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Filas
create table if not exists public.queues (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  name text not null,
  description text,
  is_active boolean default true,
  max_capacity integer,
  current_number integer default 0,
  estimated_wait_minutes integer default 5,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Senhas
create table if not exists public.tickets (
  id uuid default uuid_generate_v4() primary key,
  queue_id uuid references public.queues(id) on delete cascade not null,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  ticket_number text not null,
  status text default 'waiting' check (status in ('waiting', 'called', 'serving', 'completed', 'cancelled')),
  priority text default 'normal' check (priority in ('normal', 'urgent', 'elderly', 'pregnant')),
  customer_name text,
  customer_phone text,
  customer_email text,
  notes text,
  called_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pedidos
create table if not exists public.orders (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references public.tickets(id),
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  customer_id uuid references auth.users(id),
  items jsonb not null,
  total numeric(10,2) not null,
  status text default 'pending' check (status in ('pending', 'preparing', 'ready', 'delivered', 'cancelled')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jogos
create table if not exists public.games (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  name text not null,
  description text,
  type text not null check (type in ('quiz', 'memory', 'scratch', 'spin', 'word')),
  config jsonb default '{}',
  is_active boolean default true,
  points_reward integer default 10,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pontuações
create table if not exists public.game_scores (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  ticket_id uuid references public.tickets(id),
  player_name text,
  score integer not null,
  max_score integer not null,
  played_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Clientes
create table if not exists public.customers (
  id uuid references auth.users(id) primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  name text,
  phone text,
  email text,
  total_visits integer default 0,
  total_points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enquetes
create table if not exists public.polls (
  id uuid default uuid_generate_v4() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade not null,
  question text not null,
  options text[] not null,
  is_active boolean default true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Respostas de enquetes
create table if not exists public.poll_responses (
  id uuid default uuid_generate_v4() primary key,
  poll_id uuid references public.polls(id) on delete cascade not null,
  ticket_id uuid references public.tickets(id),
  option_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.establishments enable row level security;
alter table public.queues enable row level security;
alter table public.tickets enable row level security;
alter table public.orders enable row level security;
alter table public.games enable row level security;
alter table public.game_scores enable row level security;
alter table public.customers enable row level security;
alter table public.polls enable row level security;
alter table public.poll_responses enable row level security;

-- Policies para establishments
create policy "Establishments are viewable by everyone" on public.establishments
  for select using (true);

create policy "Establishments are insertable by authenticated users" on public.establishments
  for insert with check (auth.uid() = owner_id);

create policy "Establishments are updatable by owner" on public.establishments
  for update using (auth.uid() = owner_id);

-- Policies para queues
create policy "Queues are viewable by everyone" on public.queues
  for select using (true);

create policy "Queues are insertable by owner" on public.queues
  for insert with check (
    exists (
      select 1 from public.establishments
      where establishments.id = queues.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

create policy "Queues are updatable by owner" on public.queues
  for update using (
    exists (
      select 1 from public.establishments
      where establishments.id = queues.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

-- Policies para tickets
create policy "Tickets are viewable by everyone" on public.tickets
  for select using (true);

create policy "Tickets are insertable by everyone" on public.tickets
  for insert with check (true);

create policy "Tickets are updatable by owner" on public.tickets
  for update using (
    exists (
      select 1 from public.establishments
      where establishments.id = tickets.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

-- Policies para games
create policy "Games are viewable by everyone" on public.games
  for select using (true);

create policy "Games are insertable by owner" on public.games
  for insert with check (
    exists (
      select 1 from public.establishments
      where establishments.id = games.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

create policy "Games are updatable by owner" on public.games
  for update using (
    exists (
      select 1 from public.establishments
      where establishments.id = games.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

-- Policies para game_scores
create policy "Game scores are viewable by everyone" on public.game_scores
  for select using (true);

create policy "Game scores are insertable by everyone" on public.game_scores
  for insert with check (true);

-- Policies para polls
create policy "Polls are viewable by everyone" on public.polls
  for select using (true);

create policy "Polls are insertable by owner" on public.polls
  for insert with check (
    exists (
      select 1 from public.establishments
      where establishments.id = polls.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

-- Policies para poll_responses
create policy "Poll responses are viewable by everyone" on public.poll_responses
  for select using (true);

create policy "Poll responses are insertable by everyone" on public.poll_responses
  for insert with check (true);

-- Policies para orders
create policy "Orders are viewable by owner" on public.orders
  for select using (
    exists (
      select 1 from public.establishments
      where establishments.id = orders.establishment_id
      and establishments.owner_id = auth.uid()
    )
  );

create policy "Orders are insertable by everyone" on public.orders
  for insert with check (true);

-- Índices para performance
create index if not exists idx_tickets_queue_id on public.tickets(queue_id);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_establishment_id on public.tickets(establishment_id);
create index if not exists idx_queues_establishment_id on public.queues(establishment_id);
create index if not exists idx_games_establishment_id on public.games(establishment_id);
create index if not exists idx_polls_establishment_id on public.polls(establishment_id);

-- Realtime
alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.queues;
