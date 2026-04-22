# Próximos passos manuais

O scaffold está pronto. Antes do primeiro deploy:

## 1. Instalar dependências

```bash
cd web
npm install
```

Isso resolve ~400 pacotes, incluindo:
- `next@15.0.3`, `react@19`
- `@supabase/ssr`, `@supabase/supabase-js`
- `recharts`, `jspdf`, `jspdf-autotable`
- `date-fns`, `zod`, `tailwind-merge`, `clsx`, `lucide-react`

## 2. Configurar envs

```bash
cp .env.local.example .env.local
```

Edite `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_ANON_KEY` com a chave real do projeto **Foto_lancamento** (`ajeanogfoqiribhbuohg`).

A chave `anon` pode ser obtida em: Supabase Studio → Project Settings → API → `anon public`.

## 3. Configurar Supabase Auth

No Supabase Studio:
- **Auth → URL Configuration**
  - Site URL: `http://localhost:3000` (dev) ou a URL pública de prod
  - Redirect URLs: adicione `http://localhost:3000/auth/callback` e a equivalente de prod

- **Auth → Email Templates**: (opcional) personalize o template do magic link.

## 4. Provisionar usuário

Como a RLS exige que o `auth.uid()` do usuário esteja mapeado em `public.usuarios` com `empresa_id`, é preciso:

1. No Supabase → Auth → Users, crie/invite o usuário (pfgf01@gmail.com).
2. No SQL Editor, execute:

```sql
-- Substitua <UUID_DO_USUARIO> e <UUID_DA_EMPRESA>
insert into public.usuarios (id, empresa_id, email, nome, role)
values ('<UUID_DO_USUARIO>', '<UUID_DA_EMPRESA>', 'pfgf01@gmail.com', 'Pedro', 'admin')
on conflict (id) do update set empresa_id = excluded.empresa_id;
```

Se ainda não houver empresa:

```sql
insert into public.empresas (nome) values ('Farm Home') returning id;
```

## 5. Rodar dev

```bash
npm run dev
```

Abra http://localhost:3000 — redireciona para `/login`. Informe o email, clique no link recebido, e o callback cria a sessão.

## 6. Checks antes de deploy

```bash
npm run typecheck
npm run build
```

Ambos devem passar sem erros. Se `typecheck` acusar `next-env.d.ts` ausente, rode `npm run dev` uma vez para gerá-lo.

## 7. Deploy Vercel

- Import do repo, root = `web/`.
- Envs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Adicione a URL de produção em Supabase → Auth → Redirect URLs.

## Estado do banco

Migrations já aplicadas no projeto Foto_lancamento (sa-east-1):

1. `fase2_ciclo1_extras_cartoes_pagamentos` — documentos.tipo estendido, novas tabelas (cartoes, cartao_lancamentos, pagamento_listas, pagamento_lista_itens) e extensão de `pagamentos`.
2. `fase2_ciclo1_views_agregadoras` — views `v_dashboard_documentos` e `v_contas_pagas` com `security_invoker = on`.
3. `fase2_ciclo1_policy_cleanup` — consolida policies duplicadas em `pagamentos`, otimiza RLS de `usuarios`.

Advisors: sem erros. Warn restante: `auth_leaked_password_protection` (feature paga, pode ser habilitada depois).
