export interface Establishment {
  id: string
  name: string
  slug: string
  description: string | null
  category: string
  address: string | null
  phone: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  is_active: boolean
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Queue {
  id: string
  establishment_id: string
  name: string
  description: string | null
  is_active: boolean
  max_capacity: number | null
  current_number: number
  estimated_wait_minutes: number | null
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  queue_id: string
  establishment_id: string
  ticket_number: string
  status: 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled'
  priority: 'normal' | 'urgent' | 'elderly' | 'pregnant'
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  notes: string | null
  called_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  ticket_id: string | null
  establishment_id: string
  customer_id: string | null
  items: OrderItem[]
  total: number
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  notes?: string
}

export interface Game {
  id: string
  establishment_id: string
  name: string
  description: string | null
  type: 'quiz' | 'memory' | 'scratch' | 'spin' | 'word'
  config: Record<string, unknown>
  is_active: boolean
  points_reward: number
  created_at: string
  updated_at: string
}

export interface GameScore {
  id: string
  game_id: string
  ticket_id: string | null
  player_name: string | null
  score: number
  max_score: number
  played_at: string
}

export interface Customer {
  id: string
  establishment_id: string
  name: string | null
  phone: string | null
  email: string | null
  total_visits: number
  total_points: number
  created_at: string
  updated_at: string
}

export interface Poll {
  id: string
  establishment_id: string
  question: string
  options: string[]
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

export interface PollResponse {
  id: string
  poll_id: string
  ticket_id: string | null
  option_index: number
  created_at: string
}
