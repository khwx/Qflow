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

## Pendente / próximas ideias
- Adicionar testes (vitest) para os schemas de validação.
- Rate limiting / autenticação nos endpoints de admin que usam service role.
