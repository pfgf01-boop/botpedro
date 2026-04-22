# Bot Telegram - Gestão Financeira Farm Home

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![Telegram](https://img.shields.io/badge/Telegram-Bot_API-blue.svg)](https://core.telegram.org/bots/api)
[![Supabase](https://img.shields.io/badge/Supabase-Integrated-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-Proprietário-red.svg)]()

Assistente automatizado para gestão de documentos fiscais via Telegram, com armazenamento no Supabase e extração inteligente por Google Gemini AI.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Solução de Problemas](#solução-de-problemas)
- [Segurança](#segurança)

## Sobre o Projeto

Bot automatiza captura, processamento e gestão de documentos fiscais (notas fiscais, boletos, pedidos, recibos) para a Farm Home Comércio de Móveis e Eletrônicos.

**Versão atual:** 2.2  
**Status:** Produção  
**Última atualização:** Abril/2026

## Funcionalidades

- **Visão Computacional** — Extração inteligente de dados com Google Gemini 2.5 Flash
- **Fallback OCR** — Tesseract local quando Gemini não está disponível
- **Armazenamento Supabase** — Schema relacional: empresas → documentos → parcelas + fornecedores
- **Resiliência Offline** — Fila local SQLite com sincronização automática a cada 5 minutos
- **Parcelas** — Detecta e armazena pagamentos parcelados corretamente
- **Relatórios** — Gera relatório mensal e resumo diário automático às 18h
- **Alertas** — Notifica sobre vencimentos próximos a cada 6 horas
- **Busca** — Pesquisa por fornecedor, valor, número do documento ou descrição

### Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `/start` | Iniciar o bot |
| `/ajuda` | Ver lista de comandos |
| `/status` | Resumo geral (totais, pendentes, pagos) |
| `/vencimentos` | Parcelas a vencer nos próximos 7 dias |
| `/relatorio` | Relatório mensal |
| `/buscar <termo>` | Buscar documento por fornecedor, valor ou ID |
| `/info` | Informações do sistema e versão |

## Tecnologias

| Tecnologia | Uso |
|-----------|-----|
| Python 3.10+ | Linguagem principal |
| python-telegram-bot 20.x | Framework Telegram (async) |
| google-genai 1.x | Visão computacional via Gemini 2.5 Flash |
| supabase-py | Cliente Supabase (service_role key) |
| pydantic 2.x | Estruturação de respostas JSON da IA |
| pytesseract | OCR fallback sem internet |
| Pillow | Processamento de imagens |
| PyPDF2 | Leitura de PDFs |
| python-dotenv | Variáveis de ambiente |
| SQLite (local_storage) | Fila offline de sincronização |

## Pré-requisitos

### Software

- Python 3.10+
- Tesseract OCR com idioma português

**Windows:**
```
Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
Instalar com o pacote de idioma "por" marcado
```

**Ubuntu/Debian:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-por
```

### Contas e Credenciais

- Bot Telegram criado via @BotFather (token)
- Chave API Google Gemini (aistudio.google.com — gratuito)
- Projeto Supabase com schema configurado (ver [Configuração do Supabase](#configuração-do-supabase))

## Instalação

```bash
# 1. Criar ambiente virtual
python -m venv venv

# 2. Ativar (Windows)
venv\Scripts\activate

# 2. Ativar (Linux/Mac)
source venv/bin/activate

# 3. Instalar dependências
pip install -r requirements.txt
```

## Configuração

### Arquivo .env

Crie `.env` na raiz do projeto:

```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_do_botfather
TELEGRAM_CHAT_ID=seu_chat_id

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJ...  # service_role key (JWT)

# Ambiente
AMBIENTE=producao
DEBUG=false
TIMEZONE=America/Sao_Paulo

# OCR (Windows)
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Gemini AI
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.5-flash
```

> **Importante:** Use a `service_role` key do Supabase (não a `anon` key). Ela é segura para uso server-side e ignora RLS automaticamente.

### Configuração do Supabase

O bot usa o seguinte schema no Supabase. Execute no SQL Editor do painel:

```sql
-- Empresas (deve ter ao menos 1 registro)
CREATE TABLE empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  criado_em timestamptz DEFAULT now()
);

-- Fornecedores
CREATE TABLE fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text UNIQUE,
  criado_em timestamptz DEFAULT now()
);

-- Documentos
CREATE TABLE documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id),
  fornecedor_id uuid REFERENCES fornecedores(id),
  fornecedor_nome text,
  tipo text,          -- nota_fiscal | boleto | pedido
  numero_doc text,
  status text DEFAULT 'pendente',  -- pendente | pago | cancelado | provisionado
  valor numeric,
  vencimento date,
  descricao text,
  criado_em timestamptz DEFAULT now()
);

-- Parcelas
CREATE TABLE parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  documento_id uuid REFERENCES documentos(id),
  numero integer,
  vencimento date,
  valor numeric,
  status text DEFAULT 'pendente',
  criado_em timestamptz DEFAULT now()
);
```

Após criar o schema, insira sua empresa na tabela `empresas` via Table Editor do Supabase.

## Uso

### Executar em terminal (desenvolvimento)

```bash
python bot_telegram.py
```

### Executar em background (Windows — produção)

```powershell
Start-Process -FilePath "venv\Scripts\python.exe" `
  -ArgumentList "bot_telegram.py" `
  -WindowStyle Hidden `
  -RedirectStandardOutput "bot.log" `
  -RedirectStandardError "bot_err.log"
```

### Verificar logs

```powershell
Get-Content bot.log -Tail 30
Get-Content bot_err.log -Tail 30
```

### Parar o bot

```powershell
Get-Process python | Stop-Process
```

## Estrutura do Projeto

```
bot-telegram-financeiro/
├── bot_telegram.py          # Arquivo principal — handlers, jobs, inicialização
├── config.py                # Configurações e constantes (lê .env)
├── requirements.txt         # Dependências Python
├── .env                     # Credenciais (NÃO versionar)
├── .env.example             # Template de variáveis
├── .gitignore
├── bot.log                  # Log stdout (gerado em runtime)
├── bot_err.log              # Log stderr (gerado em runtime)
├── bot_data.pickle          # Persistência do Telegram (gerado em runtime)
├── pending_sync.db          # Fila SQLite offline (gerado em runtime)
├── handlers/
│   ├── documentos.py        # Processamento e busca de documentos
│   ├── pagamentos.py        # Vencimentos e registro de pagamentos
│   └── relatorios.py        # Relatório mensal e resumo diário
└── utils/
    ├── ocr.py               # Motor OCR (Gemini primary + Tesseract fallback)
    ├── supabase_api.py      # Cliente Supabase — CRUD documentos/parcelas/fornecedores
    └── local_storage.py     # Fila SQLite para resiliência offline
```

## Solução de Problemas

### Bot não responde

1. Verifique se está em execução: `Get-Process python`
2. Confira o `TELEGRAM_BOT_TOKEN` no `.env`
3. Leia `bot_err.log` para erros

### Erro ao salvar no Supabase

1. Confirme que `SUPABASE_URL` e `SUPABASE_KEY` estão corretos no `.env`
2. A key deve ser a `service_role` JWT (começa com `eyJ`)
3. Verifique que existe pelo menos 1 registro na tabela `empresas`
4. Consulte `bot.log` para mensagens de erro detalhadas

### OCR não funciona

1. Confirme instalação: `tesseract --version`
2. Verifique que o pacote de idioma português está instalado
3. Ajuste `TESSERACT_CMD` no `.env` se necessário (Windows)

### Documento salvo localmente (sem conexão)

O bot usa fila SQLite automaticamente quando o Supabase está inacessível. Os dados são sincronizados automaticamente a cada 5 minutos quando a conexão volta.

## Segurança

- **NUNCA** versione o arquivo `.env`
- Use `service_role` key apenas em ambiente server-side (nunca exposta ao cliente)
- Acesso restrito por `AUTHORIZED_USER_IDS` no `.env`
- Todos os acessos são logados

## Licença

Projeto proprietário da **PFGF**.  
Todos os direitos reservados © 2026
