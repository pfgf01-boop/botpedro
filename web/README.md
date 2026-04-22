# BOTI Web — Fase 2

Painel web (Next.js 15 App Router) para gestão financeira da Farm Home, consumindo o mesmo Supabase usado pelo bot.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript estrito
- Tailwind CSS (design system "Organic Precision")
- Supabase (auth por magic link + RLS por `auth_empresa_id()`)
- Recharts (gráficos)
- jsPDF + autoTable (relatórios)

## Setup

```bash
cd web
cp .env.local.example .env.local
# edite .env.local com a NEXT_PUBLIC_SUPABASE_ANON_KEY real do projeto Foto_lancamento
npm install
npm run dev
```

Abra http://localhost:3000 — você será redirecionado para `/login`. Após receber o magic link, o callback em `/auth/callback` cria a sessão e te manda para o dashboard.

## Scripts

- `npm run dev` — dev server
- `npm run build` — build de produção (Vercel)
- `npm run typecheck` — checagem estrita de tipos
- `npm run lint` — next lint

## Estrutura

```
src/
├── app/
│   ├── (app)/              # rotas autenticadas (layout com sidebar)
│   │   ├── page.tsx        # Dashboard
│   │   ├── extras/
│   │   ├── cartoes/
│   │   ├── contas-pagas/
│   │   ├── listas/
│   │   ├── relatorios/
│   │   ├── historico/
│   │   └── configuracoes/
│   ├── login/              # login público
│   ├── auth/callback/      # callback OAuth/magic link
│   ├── auth/logout/        # logout
│   ├── layout.tsx          # raiz (fonts, html)
│   └── globals.css
├── components/
│   ├── ui/                 # primitivos (Button, Input, Card, DataTable...)
│   ├── documentos/         # tabela e filtros de documentos
│   └── layout/             # Sidebar, Header
├── hooks/                  # data hooks com real-time
├── lib/
│   ├── supabase/           # browser, server e middleware clients
│   ├── env.ts              # validação de envs com zod
│   ├── format.ts           # BRL, datas (pt-BR)
│   ├── weeks.ts            # semana de pagamento (sábado→sexta)
│   ├── pdf.ts              # geração de relatórios PDF
│   └── cn.ts               # helper clsx+tailwind-merge
├── types/
│   ├── database.types.ts   # tipos espelhando o schema Supabase
│   └── domain.ts           # tipos de domínio + helpers
└── middleware.ts           # refresh de sessão + guarda de rotas
```

## Deploy (Vercel)

1. Import repo.
2. Set root directory = `web`.
3. Envs obrigatórios:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (URL pública de produção)
4. Em Supabase → Auth → URL Configuration, adicione a URL da Vercel em "Redirect URLs".

## Notas de segurança

- Todas as queries passam por RLS (`empresa_id = auth_empresa_id()`).
- Views `v_dashboard_documentos` e `v_contas_pagas` usam `security_invoker = on`, herdando a RLS do chamador.
- Middleware redireciona rotas protegidas → `/login` quando sem sessão.
- Headers de segurança em `next.config.mjs`.
- Nenhuma chave `service_role` é exposta ao cliente.
