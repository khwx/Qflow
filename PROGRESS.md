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

## Pendente / próximas ideias
- Autenticação (auth) nos endpoints de admin que usam service role.
- Migrar o state do rate limiter para um store partilhado em produção.

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
