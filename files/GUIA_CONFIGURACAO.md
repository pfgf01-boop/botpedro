# GUIA DE CONFIGURAÇÃO — Bot Telegram Farm Home

## Visão Geral

Este guia cobre a instalação e configuração completa do bot do zero em um ambiente Windows, incluindo Supabase, Gemini AI e Tesseract OCR.

---

## PARTE 1: TELEGRAM

### 1.1 Criar o Bot

1. Abra o Telegram e busque **@BotFather**
2. Envie `/newbot`
3. Escolha um nome (ex: "Assistente Financeiro FH")
4. Escolha um username terminando em `bot` (ex: `farmhome_fin_bot`)
5. Salve o **token** gerado — é a senha do bot

### 1.2 Obter seu User ID

1. Busque **@userinfobot** no Telegram
2. Envie `/start`
3. Copie o número do campo "Id" — é o seu `TELEGRAM_CHAT_ID` e também vai para `AUTHORIZED_USER_IDS`

---

## PARTE 2: SUPABASE

### 2.1 Criar Projeto

1. Acesse https://supabase.com e crie conta
2. Clique em **New Project**
3. Escolha nome e região (recomendado: South America — São Paulo)
4. Aguarde o projeto inicializar

### 2.2 Criar Schema

No painel do Supabase, vá em **SQL Editor** e execute:

```sql
CREATE TABLE empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cnpj text UNIQUE,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid REFERENCES empresas(id),
  fornecedor_id uuid REFERENCES fornecedores(id),
  fornecedor_nome text,
  tipo text,
  numero_doc text,
  status text DEFAULT 'pendente',
  valor numeric,
  vencimento date,
  descricao text,
  criado_em timestamptz DEFAULT now()
);

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

### 2.3 Inserir sua Empresa

No painel, vá em **Table Editor → empresas → Insert row** e cadastre:
- `nome`: Farm Home Comércio de Móveis e Eletrônicos LTDA
- `cnpj`: 35955650000175

### 2.4 Obter Credenciais

Vá em **Settings → API**:
- Copie a **Project URL** → `SUPABASE_URL`
- Em "Project API keys", copie a chave **service_role** → `SUPABASE_KEY`

> Use a `service_role` key, não a `anon` key. A service_role bypassa o RLS e é segura para uso server-side (nunca exposta ao navegador).

---

## PARTE 3: GOOGLE GEMINI AI

1. Acesse https://aistudio.google.com
2. Clique em **Get API Key**
3. Crie uma chave (plano gratuito é suficiente)
4. Copie a chave → `GEMINI_API_KEY`

---

## PARTE 4: TESSERACT OCR (Windows)

1. Baixe o instalador: https://github.com/UB-Mannheim/tesseract/wiki
2. Durante a instalação, marque **"Portuguese"** em Additional Language Data
3. Instale no caminho padrão: `C:\Program Files\Tesseract-OCR\`
4. Verifique: `tesseract --version` no terminal

---

## PARTE 5: CONFIGURAÇÃO DO PROJETO

### 5.1 Criar Ambiente Virtual

```powershell
cd C:\caminho\do\projeto
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 5.2 Configurar .env

Crie o arquivo `.env` na raiz do projeto:

```env
# Telegram
TELEGRAM_BOT_TOKEN=seu_token_do_botfather
TELEGRAM_CHAT_ID=seu_chat_id

# IDs autorizados (separar por vírgula se múltiplos)
AUTHORIZED_USER_IDS=seu_user_id

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=eyJ...  # service_role JWT

# Ambiente
AMBIENTE=producao
DEBUG=false
TIMEZONE=America/Sao_Paulo

# OCR (Windows)
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe

# Gemini AI
GEMINI_API_KEY=sua_chave_gemini
GEMINI_MODEL=gemini-2.5-flash

# Relatório diário (HH:MM)
HORA_RELATORIO_DIARIO=18:00
```

---

## PARTE 6: EXECUTAR O BOT

### Desenvolvimento (terminal visível)

```powershell
venv\Scripts\activate
python bot_telegram.py
```

### Produção (background, Windows)

```powershell
Start-Process -FilePath "venv\Scripts\python.exe" `
  -ArgumentList "bot_telegram.py" `
  -WorkingDirectory (Get-Location) `
  -WindowStyle Hidden `
  -RedirectStandardOutput "bot.log" `
  -RedirectStandardError "bot_err.log"
```

### Verificar se está rodando

```powershell
Get-Process python
```

### Ver logs em tempo real

```powershell
Get-Content bot.log -Wait -Tail 20
```

### Parar o bot

```powershell
Get-Process python | Stop-Process
```

---

## PARTE 7: INICIALIZAÇÃO AUTOMÁTICA (Windows)

Para o bot iniciar automaticamente quando o Windows ligar:

1. Abra o **Agendador de Tarefas** (`taskschd.msc`)
2. Clique em "Criar Tarefa Básica"
3. Nome: "Bot Telegram Farm Home"
4. Gatilho: Ao iniciar sessão
5. Ação: Iniciar um programa
6. Programa: `powershell.exe`
7. Argumentos:
   ```
   -WindowStyle Hidden -Command "cd 'C:\caminho\do\projeto'; Start-Process venv\Scripts\python.exe -ArgumentList bot_telegram.py -WindowStyle Hidden -RedirectStandardOutput bot.log -RedirectStandardError bot_err.log"
   ```

---

## PARTE 8: TESTAR

### Testes básicos

1. Envie `/start` — deve responder com boas-vindas
2. Envie `/info` — deve mostrar versão e ambiente
3. Envie `/status` — deve mostrar totais do Supabase
4. Envie `/vencimentos` — deve listar parcelas pendentes

### Teste de documento

1. Tire foto clara de um boleto ou nota fiscal
2. Envie para o bot
3. Aguarde (~3-10 segundos)
4. O bot deve mostrar os dados extraídos e confirmar salvamento com ID UUID

### Verificar no Supabase

Após enviar um documento, verifique no **Table Editor**:
- `documentos` → novo registro com `status = pendente`
- `parcelas` → uma ou mais linhas vinculadas ao documento
- `fornecedores` → fornecedor criado automaticamente

---

## SOLUÇÃO DE PROBLEMAS

### "Nenhuma empresa cadastrada"

Verifique se inseriu um registro na tabela `empresas` no Supabase.

### "Invalid API key" ou erro 401 no Supabase

- Confirme que está usando a `service_role` key (não a `anon`)
- A key deve começar com `eyJ` (formato JWT)
- URL e key devem ser do mesmo projeto

### "Bot sem conexão com Supabase"

O documento será salvo localmente e sincronizado depois. Verifique:
1. `SUPABASE_URL` e `SUPABASE_KEY` estão corretos
2. Acesse `https://seu-projeto.supabase.co` para confirmar que o projeto está ativo

### "OCR não funciona" / Tesseract error

1. Confirme instalação: `tesseract --version` no terminal
2. Verifique o caminho em `TESSERACT_CMD` no `.env`
3. Confirme que o idioma português foi instalado

### Documento processado mas dados incorretos

Possíveis causas: foto de baixa qualidade ou iluminação ruim. O bot usa o Gemini como motor primário — para melhores resultados, envie o PDF original quando disponível.

---

## CHECKLIST DE CONFIGURAÇÃO

- [ ] Bot criado no @BotFather — token salvo
- [ ] Chat ID obtido via @userinfobot
- [ ] Projeto Supabase criado
- [ ] Schema SQL executado (4 tabelas)
- [ ] Empresa inserida na tabela `empresas`
- [ ] `service_role` key copiada
- [ ] Chave Gemini AI obtida
- [ ] Tesseract OCR instalado com idioma português
- [ ] Arquivo `.env` configurado
- [ ] `pip install -r requirements.txt` executado
- [ ] Bot iniciado sem erros
- [ ] Teste `/start` OK
- [ ] Teste de documento OK (salvo no Supabase com ID UUID)
