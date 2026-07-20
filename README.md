# QFlow

Sistema de fila virtual com QR Code, gamificação e painéis inteligentes.

## 🎯 Funcionalidades

- **Entrada via QR Code**: Clientes escaneiam e entram na fila sem cadastro
- **Sala de Espera Inteligente**: Jogos, enquetes e pedidos enquanto espera
- **Painel TV**: Exibição em tempo real das senhas
- **Painel Admin**: Gestão completa de filas e senhas
- **Gamificação**: Sistema de pontos e recompensas
- **Multi-estabelecimento**: Suporte a múltiplas filas por local

## 🛠 Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Deploy**: Vercel (CI/CD via GitHub Actions)
- **Estado**: Zustand
- **UI**: Lucide React + Tailwind

## 🚀 Deploy Rápido

### 1. Clone o repositório

```bash
git clone <seu-repo>
cd tirasenha
```

### 2. Configure o Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute o SQL do arquivo `supabase/schema.sql` no SQL Editor
3. Copie as credenciais do projeto

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Rode localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📦 Estrutura do Projeto

```
src/
├── app/
│   ├── (public)/          # Páginas públicas
│   │   ├── enter/         # Entrada na fila
│   │   ├── queue/[code]/  # Seleção de fila
│   │   └── waiting/[id]/  # Sala de espera
│   ├── admin/             # Painel administrativo
│   │   ├── dashboard/     # Estatísticas
│   │   ├── queues/        # Gestão de filas
│   │   ├── tickets/       # Gestão de senhas
│   │   └── games/         # Gestão de jogos
│   ├── tv-display/        # Painel para TV
│   └── api/               # API Routes
├── components/
│   ├── client/            # Componentes do cliente
│   ├── admin/             # Componentes do admin
│   └── ui/                # Componentes reutilizáveis
├── lib/                   # Utilitários e configurações
├── types/                 # Tipos TypeScript
└── stores/                # Estado global (Zustand)
```

## 🗄 Banco de Dados

O schema completo está em `supabase/schema.sql`. Principais tabelas:

- `establishments` - Estabelecimentos
- `queues` - Filas
- `tickets` - Senhas
- `games` - Jogos
- `game_scores` - Pontuações
- `polls` - Enquetes
- `poll_responses` - Respostas
- `orders` - Pedidos
- `customers` - Clientes

## 🎮 Jogos Disponíveis

- **Quiz**: Perguntas de múltipla escolha
- **Memória**: Jogo da memória com emojis
- **Roleta**: Girada com prêmios aleatórios

## 📊 Analytics

- Tempo médio de espera
- Atendimentos por hora
- Engajamento (jogos jogados)
- Taxa de cancelamento

## 🔒 Segurança

- Row Level Security (RLS) no Supabase
- Validação de entrada em todas as APIs
- Sanitização de dados
- HTTPS obrigatório

## 📝 Licença

MIT
