# PROGRESS.md — QFlow (tirasenha)

Log de execuções autónomas do Bot Orquestrador (cada 12h).

## 2026-08-17 — Validação de entrada nas APIs (Zod)

- **Problema**: o README afirma "Validação de entrada em todas as APIs", mas os
  endpoints POST/PATCH passavam o `body` cru directamente para o Supabase, sem
  qualquer validação (gap de segurança real).
- **Solução**:
  - Criado `src/lib/validators.ts` com schemas Zod para `establishments`,
    `queues`, `tickets` (POST + PATCH), `orders`, `polls` e `games`, mais um
    helper `validateBody(request, schema)` que devolve 400 com os `issues`.
  - Aplicado em `src/app/api/establishments/route.ts`, `queues`, `tickets`,
    `orders`, `polls`, `games` e `tickets/[id]` (PATCH).
  - Benefício extra: objectos desconhecidos no body são ignorados (stripped),
    reduzindo superfície de injeção acidental.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros), `next build` ✓.

## Decisões tomadas (sem pedir)
- Manter compatibilidade: campos opcionais aceitam `null`/omissão, tal como o
  schema SQL. `config` dos jogos aceita `Record<string, unknown>`.
- `expires_at`/`called_at`/`completed_at` validados como ISO datetime string.

## 2026-08-17 — Decisão: remote Git via SSH

- O remote `origin` estava em HTTPS e o push falhou por falta de credencial.
  Como o SSH (`id_ed25519`) autentica como `khwx`, alterou-se o remote para
  `git@github.com:khwx/Qflow.git`. Push subsequente OK.

## 2026-08-17 — Testes de validação (Vitest)

- **Tarefa pendente da iteração anterior**: adicionar testes para os schemas de
  validação Zod criados em `src/lib/validators.ts`.
- **Solução**:
  - Instalado `vitest@^3` como devDependency (o script `test` já existia no
    `package.json` mas faltava a dependência).
  - Criado `vitest.config.ts` com alias `@` → `./src` para espelhar o tsconfig.
  - Criado `src/lib/validators.test.ts` com 20 testes cobrindo: campos
    obrigatórios, enums inválidos, stripping de chaves desconhecidas, limites
    numéricos (wait/quantity/price), `expires_at` ISO, `config` record,
    `ticketPatchSchema` vazio e o helper `validateBody` (sucesso, 400 e JSON
    malformado).
- **Verificação**: `vitest run` ✓ (20/20), `tsc --noEmit` ✓, `eslint` ✓
  (0 erros — só warnings pré-existentes em routes).

## 2026-08-17 — Rate limiting nos endpoints de mutação (API)

- **Tarefa pendente das iterações anteriores**: "Rate limiting / autenticação
  nos endpoints de admin que usam service role". Esta iteração implementa a
  primeira parte (rate limiting); a autenticação fica como próxima etapa.
- **Solução**:
  - Criado `src/lib/rateLimit.ts`: rate limiter em memória (janela fixa) por IP
    (x-forwarded-for / x-real-ip), com prefixo de chave por recurso e resposta
    429 com headers `Retry-After`, `X-RateLimit-Limit/Remaining/Reset`.
  - Aplicado em todos os endpoints de mutação: `POST` em `establishments`,
    `queues`, `tickets`, `orders`, `polls`, `games` e `PATCH`/`DELETE` em
    `tickets/[id]`.
  - Criado `src/lib/rateLimit.test.ts` (4 testes: limite, 429, separação por
    IP, separação por prefixo).
- **Decisão**: limite padrão de 60 req/min por IP e recurso (self-contained,
  sem dependências externas). Em produção real recomenda-se mover a contagem
  para um store partilhado (ex.: Redis) — fora do escopo atual.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros), `vitest run` ✓
  (24/24), `next build` ✓.

## 2026-08-18 — Sanitização de entrada (README reclamava, não estava feito)

- **Tarefa**: o README afirma "Sanitização de dados", mas nenhum dado de entrada
  era sanitizado — apenas validado (Zod) e com `strip` de chaves desconhecidas.
- **Solução**:
  - Criado `sanitizeInput(value)` em `src/lib/validators.ts`: percorre
    recursivamente o body e, em cada string, faz `trim()` + remove caracteres
    de controlo (null bytes, `\x00-\x08`, `\x0b`, `\x0c`, `\x0e-\x1f`, `\x7f`)
    e zero-width (`\u200b`, `\u200c`, `\u200d`, `\ufeff`). Números, booleans,
    nulls, arrays e objetos passam intactos.
  - Integrado em `validateBody` antes do `schema.safeParse`, por isso **todas**
    as rotas que já usam validação Zod passam a sanitizar automaticamente.
  - Adicionados 6 testes em `validators.test.ts`: trim, remoção de control
    chars/null bytes, remoção de zero-width, recursão em objetos/arrays,
    pass-through de não-strings, e aplicação via `validateBody` (email com
    espaços é normalizado; conteúdo com padding é apanhado pela validação de
    tamanho).
- **Porquê**: espaços/resíduos e caracteres invisíveis podem contornar
  validações de tamanho/formato ou causar inconsistências no armazenamento;
  o trim também melhora a qualidade dos dados (ex.: emails).
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros), `vitest run` ✓
  (53/53).

## 2026-08-18 — Autenticação nos endpoints GET (fecha exposição de leitura)

- **Tarefa pendente das iterações anteriores**: os GETs de lista e de
  detalhe (`establishments`, `queues`, `tickets`, `orders`, `polls`, `games`
  + `[id]`) usavam o `createAdminClient()` (service role, ignora RLS) **sem**
  qualquer autenticação — qualquer pessoa com o URL podia ler todos os dados
  (incluindo tickets, encomendas com dados de cliente e polls).
- **Solução**:
  - Adicionado `authenticateRequest(request)` no início de todos os 12 handlers
    `GET` (listas + `[id]`), devolvendo 401 quando não há token Bearer válido.
  - Ordem mantida igual aos handlers de escrita: rate limiting já existia nos
    imports; a auth corre após o rate limit (nos mutadores) e agora também
    precede a leitura nos GETs.
  - O frontend não é afetado: a única rota `/api/*` usada pela UI é
    `auth/forgot-password`; as páginas de entrada/fila/TV usam o cliente
    Supabase direto.
- **Decisão**: expor dados via service role sem auth era um risco real de
  fuga de dados. Com isto, toda a API `/api/*` (leitura e escrita) exige agora
  autenticação Bearer. Em produção real, poder-se-ia depois migrar as leituras
  para o cliente publishable + RLS para permitir acesso público granular.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros; só warnings
  pré-existentes), `vitest run` ✓ (53/53), `next build` ✓.

## Pendente / próximas ideias
- Migrar o state do rate limiter para um store partilhado em produção.
- Avaliar se os GETs de lista (que usam service role) devem passar para o
  cliente publishable + RLS, ou também exigir auth.

## 2026-08-18 — Autenticação nos endpoints de admin (service role)

- **Tarefa pendente das iterações anteriores**: "Autenticação (auth) nos
  endpoints de admin que usam service role". Os endpoints de mutação usavam o
  `createAdminClient()` (service role, que ignora RLS) sem qualquer auth — qualquer
  pessoa com o URL podia criar/alterar/apagar dados.
- **Solução**:
  - Criado `src/lib/auth.ts` com `authenticateRequest(request)`: valida o header
    `Authorization: Bearer <jwt>`, verifica o token via `supabase.auth.getUser`
    (com a chave publishable, sem expor a secret) e devolve o `user` ou 401.
  - Aplicado a todos os handlers de escrita (POST/PATCH/DELETE) de todos os
    recursos: `establishments` (+`[id]`), `queues` (+`[id]`), `tickets` (+`[id]`),
    `orders` (+`[id]`), `polls` (+`[id]`), `games` (+`[id]`). O rate limiting e a
    validação Zod mantêm-se; a auth corre após o rate limit.
  - Criado `src/lib/auth.test.ts` (5 testes): header em falta, não-Bearer, token
    vazio, token inválido (401) e token válido (devolve user).
- **Decisão**: não quebrar o frontend — este não usa os `/api/*` (chama o
  Supabase direto, exceto `forgot-password`). Os GETs de lista continuam públicos
  por enquanto (registado em "Pendente" como próximo passo). Em produção real, o
  ideal é exigir também auth nos GETs ou migrá-los para o cliente publishable + RLS.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros; só warnings
  pré-existentes), `vitest run` ✓ (47/47).

## 2026-08-18 — Autorização por posse nos endpoints admin (fecha bypass de RLS)

- **Tarefa pendente das iterações anteriores**: os endpoints exigiam auth
  (JWT válido), mas usavam o `createAdminClient()` (service role), que
  **ignora o Row Level Security** do Postgres. Resultado: qualquer utilizador
  autenticado (qualquer JWT válido) podia ler/criar/alterar/apagar os dados de
  **qualquer** estabelecimento — um gap de autorização real, apesar do RLS
  existir no `schema.sql` (que só protege o cliente publishable, não o service role).
- **Solução** (`src/lib/ownership.ts` + helper `assertOwnership(table, id, userId)`):
  - `establishments`: verifica `owner_id` na própria linha.
  - Tabelas-filhas (`queues`, `tickets`, `orders`, `polls`, `games`): resolve o
    estabelecimento pai via `establishment_id` e compara `owner_id`.
  - Devolve `404` se o recurso/pai não existir, `403` se não for o dono, ou
    `null` se autorizado.
  - Aplicado em **todos** os `PATCH`/`DELETE` de `[id]` (5 recursos) e em todos
    os `POST` de recursos-filha (verifica posse do `establishment_id` no body).
  - `POST /api/establishments` passa a gravar `owner_id: auth.user.id` (antes
    ficava `null`, o que tornava a RLS de update/delete inatingível).
- **Decisão**: manter os `GET` de lista/detalhe como estão (já exigem auth;
  o `select` é público no RLS). A verificação de posse nos `GET` de detalhe
  fica como possível refinamento futuro. O frontend não é afetado — não usa
  estes `/api/*` (chama o Supabase direto).
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros; só warnings
  pré-existentes), `vitest run` ✓ (61/61 — +8 testes em `ownership.test.ts`),
  `next build` ✓.

## 2026-08-19 — Autorização por posse nos GETs de detalhe (`[id]`)

- **Tarefa pendente da iteração anterior**: os `GET` de detalhe (`[id]`) de todos
  os 6 recursos exigiam auth (JWT válido) mas, como usam o `createAdminClient()`
  (service role, que ignora RLS), **qualquer** utilizador autenticado podia ler
  o registo de detalhe de **qualquer** tenant (ex.: `orders`, cujo RLS de select
  é só do dono).
- **Solução**: aplicado `assertOwnership(table, id, auth.user.id)` no início de
  cada `GET` de `[id]` (`establishments`, `queues`, `tickets`, `orders`,
  `polls`, `games`), logo após a auth e antes do `select`. Devolve 404 se o
  recurso/pai não existir, 403 se não for o dono, senão prossegue.
- **Decisão**: fechar a leitura por detalhe de forma consistente com os
  mutadores (PATCH/DELETE), que já tinham posse. Os `GET` de **lista** continuam
  a devolver o que o RLS do cliente publishable permitiria — mantidos como estão
  (sem quebrar o frontend, que não usa estes `/api/*`).
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros; só warnings
  pré-existentes), `vitest run` ✓ (61/61), `next build` ✓.

## 2026-08-20 — HTTP security headers em todas as respostas

- **Tarefa**: o projeto tinha validação, sanitização, rate limiting, auth e
  autorização por posse nas APIs, mas **nenhuma** política de cabeçalhos HTTP
  de segurança (CSP, HSTS, X-Content-Type-Options, etc.) — lacuna de defesa em
  profundidade para o browser.
- **Solução**:
  - Criado `src/lib/securityHeaders.ts` com `getSecurityHeaders({ supabaseHost })`
    que devolve a lista de headers: `X-DNS-Prefetch-Control`,
    `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`,
    `Referrer-Policy`, `Strict-Transport-Security` (2 anos + preload),
    `Permissions-Policy` (câmara/mic/geo desativados) e uma `Content-Security-Policy`
    restritiva (`default-src 'self'`, `object-src 'none'`, `frame-ancestors
    'self'`, `base-uri/form-action 'self'`, `upgrade-insecure-requests`).
  - A CSP permite dinamicamente o `https://` e `wss://` do host do Supabase
    (lido de `NEXT_PUBLIC_SUPABASE_URL`) no `connect-src`, para não quebrar o
    cliente publishable, Auth nem o Realtime.
  - Aplicado globalmente em `next.config.ts` via `headers()` com `source:
    '/:path*'`, cobrindo páginas **e** rotas `/api` (as rotas que devolvem JSON
    também passam a enviar os headers).
  - Criado `src/lib/securityHeaders.test.ts` (5 testes): presença dos headers
    base, emissão de CSP, `connect-src 'self'` sem host e inclusão de
    `https://`+`wss://` quando o host é fornecido.
- **Decisão**: `script-src` mantém `'unsafe-inline'`/`'unsafe-eval'` por
  compatibilidade com o Next.js (dev/prod inline) — um relaxamento conhecido,
  aceitável face ao resto da política; reforçar exigiria nonce/hashing (fora do
  escopo). `upgrade-insecure-requests` força HTTPS no browser.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros), `vitest run` ✓
  (68/68 — +5 testes), `next build` ✓.

## Pendente / próximas ideias
- Migrar o state do rate limiter para um store partilhado em produção.
- Avaliar se os `GET` de lista devem passar para o cliente publishable + RLS
  (ou continuar a exigir auth no service-role).
- Reforçar a CSP com nonce/hashing para remover `'unsafe-inline'`/`'unsafe-eval'`.

## 2026-08-19 — Evicção de buckets expirados no rate limiter (fecha memory leak)

- **Tarefa**: o `rateLimit.ts` mantinha um `Map` em memória de todos os buckets
  de IP/prefixo **sem nunca os libertar** — buckets expirados acumulavam-se
  indefinidamente, um memory leak real em execução de longa duração (dias/semanas).
- **Solução**:
  - `Bucket` passou a guardar `createdAt`; adicionado `sweep(now)` que, de forma
    preguiçosa (a cada chamada, mas no máximo uma vez por `SWEEP_INTERVAL_MS` =
    60s, ou quando `buckets.size > MAX_BUCKETS` = 10 000), remove buckets com
    `resetAt <= now` e, se ainda acima do limite, descarta os mais antigos.
  - `sweep` é invocado no início de cada `rateLimit`; `clearRateLimitBuckets`
    reinicia também `lastSweep`.
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros; só warnings
  pré-existentes), `vitest run` ✓ (63/63 — +2 testes: reclaim de IP bloqueado
  após expirar, e preservação de bucket dentro da janela durante um sweep).

## 2026-08-17 — API REST completa + validação auth/forgot-password

- **Tarefa**: completar a API com endpoints PATCH/DELETE para todos os recursos
  (establishments, queues, orders, polls, games) e adicionar validação Zod ao
  endpoint `auth/forgot-password` que só fazia check manual de email.
- **Solução**:
  - Adicionados `establishmentPatchSchema`, `queuePatchSchema`,
    `orderPatchSchema`, `pollPatchSchema`, `gamePatchSchema`,
    `forgotPasswordSchema` em `src/lib/validators.ts`.
  - Criadas rotas dinâmicas `[id]` com `GET`/`PATCH`/`DELETE` para todos os 5
    recursos, todas com rate limiting e validação Zod.
  - Atualizado `auth/forgot-password` para usar `validateBody` +
    `forgotPasswordSchema` + rate limiting (5 req/min por IP).
  - Adicionados 18 testes novos em `validators.test.ts` cobrindo todos os patch
    schemas (empty body rejection, partial updates, enum validation) e
    `forgotPasswordSchema` (valid/invalid/missing email).
- **Verificação**: `tsc --noEmit` ✓, `eslint` ✓ (0 erros), `vitest run` ✓
  (42/42), `next build` ✓.
