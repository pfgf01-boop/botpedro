# MANUAL DO USUÁRIO
## Bot Telegram — Gestão Financeira Farm Home

**Versão:** 2.2  
**Atualizado em:** Abril/2026

---

## O QUE É ESTE BOT?

O Bot de Gestão Financeira é o assistente automatizado da Farm Home para gerenciar documentos fiscais. Ele:

- Recebe fotos de boletos, pedidos e notas fiscais
- Lê automaticamente as informações usando IA (Google Gemini)
- Salva tudo organizado no Supabase
- Alerta sobre vencimentos próximos
- Gera relatórios quando solicitado

---

## COMEÇANDO

### Encontrar o Bot

1. Abra o Telegram
2. Busque pelo nome configurado pelo administrador
3. Envie `/start`

### Mensagem de Boas-vindas

```
Bem-vindo ao Assistente Financeiro Farm Home!

Sou seu assistente para gestão de documentos fiscais.

O que posso fazer:
• Processar notas fiscais e boletos
• Extrair dados automaticamente com IA
• Organizar no Supabase
• Gerar relatórios
• Alertar sobre vencimentos

Digite /ajuda para ver todos os comandos.
```

---

## COMANDOS DISPONÍVEIS

### Comandos Básicos

| Comando | O que faz |
|---------|-----------|
| `/start` | Iniciar o bot |
| `/ajuda` | Ver lista de comandos |
| `/info` | Versão e informações do sistema |

### Comandos de Consulta

| Comando | O que faz | Exemplo |
|---------|-----------|---------|
| `/status` | Resumo geral de documentos e valores | `/status` |
| `/vencimentos` | Parcelas a vencer nos próximos 7 dias | `/vencimentos` |
| `/buscar <termo>` | Buscar documento | `/buscar POLIPLAX` |
| `/relatorio` | Gerar relatório mensal | `/relatorio` |

---

## COMO ENVIAR DOCUMENTOS

### Opção 1: Foto (recomendado para boletos e pedidos)

1. Tire uma **foto clara** com boa iluminação
2. Enquadre o documento inteiro
3. Evite sombras e reflexos
4. Envie a foto diretamente para o bot

### Opção 2: PDF (recomendado para NFe)

1. Abra o PDF no celular ou computador
2. Compartilhe via Telegram
3. Selecione o bot e envie

### O que acontece depois?

```
Você envia a foto/PDF
       ↓
Bot confirma recebimento ("Processando...")
       ↓
IA extrai os dados (Gemini 2.5 Flash)
       ↓
Bot exibe dados extraídos
       ↓
Salvo no Supabase (ou fila local se offline)
       ↓
Confirmação com ID do documento
```

### Exemplo de resposta do bot

```
📄 Documento Processado

Tipo: NFE
Fornecedor: POLIPLAX PLASTICO LTDA
CNPJ: 15.643.065/0001-22
Valor Total: R$ 1.810,80
Emissão: 04/07/2025

🤖 Extraído via Gemini AI

✅ Salvo com sucesso!
📋 ID: 3f9a1b2c-...
```

### Documento parcelado

Quando o bot detecta parcelas, exibe cada uma separadamente:

```
📦 Documento Processado

Tipo: PEDIDO
Fornecedor: FIRENZE COMERCIO DE MAQUINAS
Valor Total: R$ 15.000,00
Emissão: 10/04/2025

💳 Pagamento Parcelado (3x):
  1ª - 10/05/2025: R$ 5.000,00
  2ª - 10/06/2025: R$ 5.000,00
  3ª - 10/07/2025: R$ 5.000,00

🤖 Extraído via Gemini AI

✅ Salvo com sucesso!
📋 ID: 7b2c4d1e-...
```

---

## BUSCANDO DOCUMENTOS

```
/buscar POLIPLAX
/buscar 1810.80
/buscar pedido
```

**Resultado:**

```
🔍 Resultados para: POLIPLAX

1. ⏳ POLIPLAX PLASTICO LTDA
   💰 R$ 1.810,80 | 📅 2025-04-10
   🆔 3f9a1b2c-...

2. ✅ POLIPLAX PLASTICO LTDA
   💰 R$ 950,00 | 📅 2025-03-15
   🆔 8e5d2a1f-...
```

- ⏳ = Pendente
- ✅ = Pago

---

## CONSULTANDO STATUS

```
/status
```

**Resposta:**

```
📊 STATUS GERAL DO SISTEMA

Documentos:
📋 Total cadastrados: 45
⏳ Pendentes: 12
✅ Pagos: 33

Valores:
✅ Pago: R$ 125.430,50
⏳ Pendente: R$ 34.210,80
💰 Total: R$ 159.641,30

📈 78,6% dos valores pagos

Atualizado em 18/04/2026 às 14:35
```

---

## VENCIMENTOS

```
/vencimentos
```

**Resposta:**

```
📅 Vencimentos nos próximos 7 dias

🔴 HOJE (18/04/2026)
  • RENNER SAYERLACK S.A.
    💰 R$ 517,03

🟡 AMANHÃ (19/04/2026)
  • FIRENZE COMERCIO DE MAQUINAS
    ⚠️💰 R$ 5.636,52

🟢 20/04/2026 (em 2 dias)
  • JGA COMERCIO DE TINTAS
    💰 R$ 584,80

💵 TOTAL A PAGAR: R$ 6.738,35
```

**Símbolos:**

- 🔴 = Vence hoje
- 🟡 = Vence amanhã
- 🟢 = Vence nos próximos dias
- ⚠️💰 = Valor alto (acima de R$ 5.000)

---

## ALERTAS AUTOMÁTICOS

O bot envia automaticamente, sem você precisar pedir:

### Alertas de Vencimento

**Quando:** A cada 6 horas  
**O que:** Parcelas que vencem hoje ou amanhã

```
🚨 ALERTA DE VENCIMENTO

🔴 VENCE HOJE
RENNER SAYERLACK S.A. — R$ 517,03

🟡 VENCE AMANHÃ
FIRENZE COMERCIO — R$ 5.636,52
```

### Resumo Diário

**Quando:** Todo dia às 18h  
**O que:** Resumo + vencimentos do dia seguinte

```
📊 Resumo do Dia

📅 18/04/2026
📥 3 documento(s) processado(s) hoje

⏰ 2 vencimento(s) amanhã:
  • RENNER SAYERLACK: R$ 517,03
  • FIRENZE: R$ 5.636,52

💰 Total: R$ 6.153,55
```

### Sincronização Offline

Quando o bot salva localmente por falta de conexão e depois sincroniza:

```
🔄 Sincronização Offline Concluída

✅ 2 registros sincronizados
```

---

## DICAS

### Para melhores fotos

✅ Faça:
- Boa iluminação (natural ou artificial direta)
- Câmera estável
- Documento completamente enquadrado
- Código de barras legível (boletos)

❌ Evite:
- Fotos desfocadas
- Sombras sobre o documento
- Ângulos muito inclinados
- Documentos amassados

### Recomendações por tipo

- **NFe:** Sempre que possível, envie o PDF original
- **Boletos:** Foto direta funciona bem, sem reflexo
- **Pedidos:** PDF é mais preciso que foto

---

## PERGUNTAS FREQUENTES

### "O bot não está respondendo"

1. Verifique sua conexão com internet
2. Tente `/start`
3. Aguarde alguns segundos
4. Se persistir, contate o administrador

### "Apareceu mensagem de fila local"

```
⚠️ Nota: Sem conexão ao Supabase. Documento criado localmente.
🔄 Será sincronizado automaticamente assim que a conexão retornar.
```

Isso é normal — seus dados foram salvos e serão enviados ao Supabase automaticamente. Você receberá uma confirmação quando a sincronização concluir.

### "Bot não conseguiu ler meu documento"

Causas comuns:
- Foto escura ou desfocada
- Documento amassado ou com baixa qualidade de impressão

Solução: tire nova foto com melhor iluminação ou envie o PDF.

### "Os dados extraídos estão incorretos"

O Gemini tem alta precisão, mas pode errar em documentos de baixa qualidade. Nesse caso:
1. Anote os dados corretos
2. Edite diretamente no painel do Supabase
3. Ou reenvie o documento com melhor qualidade

### "Quero deletar um documento"

Não é possível pelo bot atualmente. Para deletar:
1. Acesse o painel do Supabase
2. Vá em Table Editor → documentos
3. Ou contate o administrador

---

## SUPORTE

Em caso de problemas:

1. Tente `/start` novamente
2. Verifique se o bot está online (envie `/info`)
3. Contate o administrador informando:
   - Screenshot do erro
   - Horário aproximado
   - O que tentou fazer

---

## HISTÓRICO DE VERSÕES

### v2.2 — Abril/2026 (atual)
- IA Google Gemini 2.5 Flash para extração de dados
- Detecção e armazenamento de parcelas individuais
- Schema Supabase relacional (parcelas em tabela própria)
- Sincronização offline automática

### v2.0 — Abril/2026
- Migração para Supabase
- Resiliência offline com fila SQLite
- Alertas automáticos de vencimento
- Resumo diário às 18h

### Próximas versões
- Relatórios em PDF
- Botões interativos para confirmar/editar dados
- Registro de pagamento via chat (`/pagar`)
