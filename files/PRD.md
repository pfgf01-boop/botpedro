# PRD — Bot Telegram de Gestão Financeira
## Product Requirements Document

**Versão:** 2.2  
**Data:** Abril/2026  
**Status:** Produção  
**Plataforma:** Windows 11 + Supabase + Google Gemini AI

---

## 1. VISÃO GERAL

### 1.1 Objetivo

Automatizar captura, processamento e gestão de documentos fiscais (notas fiscais, boletos, pedidos, recibos) através de um bot Telegram, com armazenamento no Supabase e extração inteligente de dados por IA.

### 1.2 Problema

- Processo manual de digitação de dados fiscais
- Risco de erros humanos
- Dificuldade em rastrear vencimentos e parcelas
- Falta de centralização das informações financeiras

### 1.3 Solução

Bot que:
- Recebe documentos via Telegram (foto ou PDF)
- Extrai dados estruturados via Google Gemini 2.5 Flash (visão computacional)
- Usa Tesseract OCR como fallback offline
- Salva no Supabase com schema relacional (empresas → documentos → parcelas)
- Alerta sobre vencimentos e gera relatórios automáticos

---

## 2. REQUISITOS FUNCIONAIS

### RF-01: Recepção de Documentos
- Formatos aceitos: PDF, JPG, JPEG, PNG
- Tamanho máximo: 20MB
- Status: Implementado

### RF-02: Extração de Dados via IA
- Motor primário: Google Gemini 2.5 Flash (visão multimodal)
- Motor fallback: Tesseract OCR (offline/local)
- Dados extraídos: tipo, CNPJ, fornecedor, valor total, data emissão, data vencimento, parcelas
- Detecção de pagamentos parcelados com listagem por vencimento e valor
- Detecção de divergência entre soma de parcelas e valor total
- Status: Implementado

### RF-03: Armazenamento no Supabase
- Schema: `empresas` → `documentos` → `parcelas` + `fornecedores`
- Documento único por envio (não duplica por parcela)
- Parcelas inseridas na tabela `parcelas` vinculadas ao documento
- Fornecedor buscado por CNPJ ou nome; criado automaticamente se não existir
- Autenticação via `service_role` key (ignora RLS, seguro server-side)
- Status: Implementado

### RF-04: Resiliência Offline
- Quando Supabase indisponível, salva em fila SQLite local (`pending_sync.db`)
- Job automático a cada 5 minutos tenta sincronizar pendentes
- Notificação no Telegram ao concluir sincronização
- Status: Implementado

### RF-05: Busca de Documentos
- Comando: `/buscar <termo>`
- Campos pesquisados: `numero_doc`, `fornecedor_nome`, `descricao`, `status`
- Retorna até 10 resultados
- Status: Implementado

### RF-06: Lista de Vencimentos
- Comando: `/vencimentos`
- Fonte: tabela `parcelas` (não documentos)
- Período: próximos 7 dias (configurável)
- Exclui parcelas com status `pago`
- Status: Implementado

### RF-07: Status Geral
- Comando: `/status`
- Informações: total de documentos, pendentes, valor pago, valor pendente, percentual
- Status: Implementado

### RF-08: Relatório Mensal
- Comando: `/relatorio`
- Formato: arquivo de texto enviado ao usuário
- Status: Implementado

### RF-09: Resumo Diário Automático
- Horário: configurável via `HORA_RELATORIO_DIARIO` no `.env` (padrão 18:00)
- Conteúdo: documentos do dia + vencimentos próximos
- Status: Implementado

### RF-10: Alertas de Vencimento
- Frequência: a cada 6 horas
- Antecedência: 3 dias (configurável)
- Símbolos: 🔴 hoje, 🟡 amanhã, 🟢 próximos dias, ⚠️ valor alto (> R$ 5.000)
- Status: Implementado

---

## 3. REQUISITOS NÃO-FUNCIONAIS

### RNF-01: Segurança
- Acesso restrito por `AUTHORIZED_USER_IDS` (whitelist de user IDs Telegram)
- Credenciais em `.env` (não versionado)
- `service_role` key nunca exposta ao cliente
- Rate limiting: máx. N documentos/minuto por usuário (configurável)

### RNF-02: Desempenho
- Processamento de documento em até 10 segundos (Gemini)
- Supabase `_empresa_id` cacheado em memória (evita query a cada documento)

### RNF-03: Disponibilidade
- PicklePersistence mantém estado do bot entre reinicializações
- Fila SQLite garante zero perda de dados em falhas de rede
- Bot rodando como processo em background no Windows via PowerShell

### RNF-04: Logs
- Níveis: DEBUG, INFO, WARNING, ERROR
- Saída: stdout (`bot.log`) e stderr (`bot_err.log`)
- Formato: `timestamp | nível | mensagem`

---

## 4. ARQUITETURA

### 4.1 Stack

```
Telegram (usuário)
      │
      ▼
bot_telegram.py          ← handlers, job queue, rate limit
      │
      ├── handlers/
      │   ├── documentos.py    ← processamento + formatar resposta
      │   ├── pagamentos.py    ← vencimentos + alertas
      │   └── relatorios.py   ← relatório mensal + resumo diário
      │
      └── utils/
          ├── ocr.py           ← Gemini (primary) + Tesseract (fallback)
          ├── supabase_api.py  ← CRUD Supabase
          └── local_storage.py ← SQLite offline queue
```

### 4.2 Schema Supabase

```
empresas
  id (uuid PK)
  nome, cnpj

fornecedores
  id (uuid PK)
  nome, cnpj (unique)

documentos
  id (uuid PK, auto)
  empresa_id → empresas.id
  fornecedor_id → fornecedores.id
  fornecedor_nome (text, desnormalizado)
  tipo: nota_fiscal | boleto | pedido
  numero_doc, status, valor, vencimento, descricao
  criado_em

parcelas
  id (uuid PK, auto)
  documento_id → documentos.id
  numero, vencimento, valor, status
```

### 4.3 Fluxo de Processamento

```
1. Usuário envia foto/PDF
2. Bot verifica rate limit e autorização
3. Download do arquivo via Telegram API
4. ocr.py: tenta Gemini Vision → se falhar, usa Tesseract
5. Retorna dict com: tipo, fornecedor, cnpj, valor, data, vencimento, parcelas[]
6. documentos.py: monta documento_para_salvar (dict único com parcelas anexadas)
7. supabase_api.adicionar_documento():
   a. obtém empresa_id (cacheado)
   b. busca ou cria fornecedor
   c. insere em documentos
   d. insere parcelas em parcelas
8. Resposta formatada ao usuário com ID UUID e dados extraídos
```

---

## 5. CONFIGURAÇÃO E DEPLOY

### 5.1 Variáveis de Ambiente

```env
TELEGRAM_BOT_TOKEN=      # Token do @BotFather
TELEGRAM_CHAT_ID=        # Chat ID para mensagens automáticas
AUTHORIZED_USER_IDS=     # IDs autorizados (separados por vírgula)
SUPABASE_URL=            # https://projeto.supabase.co
SUPABASE_KEY=            # service_role JWT (eyJ...)
GEMINI_API_KEY=          # Chave Google AI Studio
GEMINI_MODEL=            # gemini-2.5-flash
TESSERACT_CMD=           # Caminho do executável (Windows)
AMBIENTE=                # desenvolvimento | producao
DEBUG=                   # true | false
TIMEZONE=                # America/Sao_Paulo
HORA_RELATORIO_DIARIO=   # HH:MM (ex: 18:00)
```

### 5.2 Execução no Windows (Produção)

```powershell
# Iniciar em background
Start-Process -FilePath "venv\Scripts\python.exe" `
  -ArgumentList "bot_telegram.py" `
  -WindowStyle Hidden `
  -RedirectStandardOutput "bot.log" `
  -RedirectStandardError "bot_err.log"

# Verificar logs
Get-Content bot.log -Tail 30

# Parar
Get-Process python | Stop-Process
```

---

## 6. ROADMAP

### v2.2 (Atual — Abril/2026)
- ✅ Gemini 2.5 Flash com extração estruturada via Pydantic
- ✅ Schema Supabase relacional (empresas/documentos/parcelas/fornecedores)
- ✅ Parcelas detectadas e armazenadas individualmente
- ✅ Resiliência offline (SQLite + sync automático)
- ✅ service_role key para bypass de RLS

### v2.3 (Próximo)
- ⏳ Relatórios em PDF (ReportLab)
- ⏳ Botões inline para confirmar/editar dados extraídos
- ⏳ Comando `/pagar <id>` para registrar quitação via chat
- ⏳ Múltiplos usuários com permissões

### v3.0 (Futuro)
- 📋 Dashboard web integrado ao Supabase
- 📋 Integração com ERP
- 📋 API própria

---

## 7. RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| Gemini falha na leitura | Alto | Baixa | Fallback automático para Tesseract OCR |
| Supabase indisponível | Alto | Baixa | Fila local SQLite + sync automático |
| Credenciais expostas | Crítico | Baixa | .env no .gitignore, service_role apenas server-side |
| Bot offline (Windows reinicia) | Médio | Média | Script de inicialização automática (Task Scheduler) |
| Divergência de parcelas | Médio | Baixa | Detecção automática com aviso visual ao usuário |

---

## 8. GLOSSÁRIO

- **Gemini:** Modelo de IA multimodal do Google com capacidade de visão (leitura de imagens)
- **OCR:** Optical Character Recognition — extração de texto de imagens sem contexto semântico
- **service_role key:** Chave Supabase com permissão total, bypass de RLS — uso exclusivo server-side
- **RLS:** Row Level Security — controle de acesso por linha no Supabase
- **Parcela:** Cada vencimento individual de um documento parcelado, armazenado em tabela própria
- **NFe:** Nota Fiscal Eletrônica
- **CNPJ:** Cadastro Nacional de Pessoa Jurídica

---

**Última Atualização:** Abril/2026  
**Próxima Revisão:** Junho/2026
