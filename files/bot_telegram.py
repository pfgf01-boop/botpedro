"""
Bot Telegram - Gestão Financeira Farm Home
Versão: 2.2 - Supabase + Gemini AI
Autor: Equipe Farm Home
Data: Abril 2026
"""

import time
from collections import defaultdict, deque
from functools import wraps
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
    ContextTypes,
    PicklePersistence,
)
from config import (
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    AUTHORIZED_USER_IDS,
    RATE_LIMIT_DOCS_POR_MINUTO,
    MENSAGENS,
    logger,
)
from handlers.documentos import (
    processar_documento,
    buscar_documento,
)
from handlers.pagamentos import (
    listar_vencimentos,
    registrar_pagamento,
)
from handlers.relatorios import (
    gerar_relatorio_mensal,
    mostrar_status,
)


# ===== AUTORIZAÇÃO E RATE LIMITING =====

def autorizado_apenas(func):
    """Decorator: bloqueia comandos de usuários não autorizados."""
    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_id = str(update.effective_user.id) if update.effective_user else ''
        if user_id not in AUTHORIZED_USER_IDS:
            logger.warning(f"🚫 Acesso negado para usuário {user_id}")
            if update.effective_message:
                await update.effective_message.reply_text(
                    '⚠️ Você não está autorizado a usar este bot.'
                )
            return
        return await func(update, context)
    return wrapper


_rate_buckets: dict[str, deque] = defaultdict(deque)

def _dentro_do_limite(user_id: str) -> bool:
    """Rate limit simples em janela deslizante de 60s."""
    agora = time.monotonic()
    janela = 60.0
    bucket = _rate_buckets[user_id]
    while bucket and agora - bucket[0] > janela:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT_DOCS_POR_MINUTO:
        return False
    bucket.append(agora)
    return True


# ===== COMANDOS BÁSICOS =====

@autorizado_apenas
async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /start - Inicialização do bot"""
    try:
        await update.message.reply_text(
            MENSAGENS['boas_vindas'],
            parse_mode='Markdown'
        )
        logger.info(f"Usuário {update.effective_user.id} iniciou o bot")
    except Exception as e:
        logger.error(f"Erro no comando /start: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def ajuda_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /ajuda - Mostrar comandos disponíveis"""
    try:
        await update.message.reply_text(
            MENSAGENS['ajuda'],
            parse_mode='Markdown'
        )
        logger.info(f"Usuário {update.effective_user.id} solicitou ajuda")
    except Exception as e:
        logger.error(f"Erro no comando /ajuda: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /status - Mostrar resumo geral"""
    try:
        await update.message.reply_text('⚙️ Buscando informações...')
        status_text = await mostrar_status()
        await update.message.reply_text(status_text, parse_mode='Markdown')
        logger.info(f"Usuário {update.effective_user.id} consultou status")
    except Exception as e:
        logger.error(f"Erro no comando /status: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def vencimentos_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /vencimentos - Listar contas a vencer"""
    try:
        await update.message.reply_text('⚙️ Consultando vencimentos...')
        vencimentos_text = await listar_vencimentos()
        await update.message.reply_text(vencimentos_text, parse_mode='Markdown')
        logger.info(f"Usuário {update.effective_user.id} consultou vencimentos")
    except Exception as e:
        logger.error(f"Erro no comando /vencimentos: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def relatorio_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /relatorio - Gerar relatório mensal"""
    try:
        await update.message.reply_text('📊 Gerando relatório... Pode levar alguns segundos.')
        relatorio_pdf = await gerar_relatorio_mensal()

        if relatorio_pdf:
            with open(relatorio_pdf, 'rb') as f:
                await update.message.reply_document(
                    document=f,
                    caption='📈 Relatório mensal gerado com sucesso!'
                )
            logger.info(f"Usuário {update.effective_user.id} gerou relatório")
        else:
            await update.message.reply_text('❌ Erro ao gerar relatório.')
    except Exception as e:
        logger.error(f"Erro no comando /relatorio: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def buscar_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /buscar - Buscar documento por termo"""
    try:
        if not context.args:
            await update.message.reply_text(
                '⚠️ Uso: /buscar <termo>\n'
                'Exemplo: /buscar POLIPLAX\n'
                'Exemplo: /buscar 1810.80'
            )
            return

        termo = ' '.join(context.args)
        await update.message.reply_text(f'🔍 Buscando por: *{termo}*...', parse_mode='Markdown')

        resultados = await buscar_documento(termo)
        await update.message.reply_text(resultados, parse_mode='Markdown')
        logger.info(f"Usuário {update.effective_user.id} buscou: {termo}")
    except Exception as e:
        logger.error(f"Erro no comando /buscar: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def info_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando /info - Informações do sistema"""
    try:
        from config import AMBIENTE, EMPRESA, VERSAO_BOT
        info_text = f"""
ℹ️ *Informações do Sistema*

*Empresa:* {EMPRESA['nome']}
*CNPJ:* {EMPRESA['cnpj']}
*Localização:* {EMPRESA['cidade']}/{EMPRESA['estado']}

*Ambiente:* {AMBIENTE.upper()}
*Versão:* {VERSAO_BOT}
*Status:* ✅ Operacional

*Última atualização:* Abril/2026
        """
        await update.message.reply_text(info_text, parse_mode='Markdown')
        logger.info(f"Usuário {update.effective_user.id} consultou info")
    except Exception as e:
        logger.error(f"Erro no comando /info: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


# ===== MANIPULADORES DE DOCUMENTOS =====

@autorizado_apenas
async def handle_documento(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processar documentos enviados (fotos/PDFs)"""
    try:
        user_id = str(update.effective_user.id)

        if not _dentro_do_limite(user_id):
            await update.message.reply_text(
                f'⏱️ Limite de {RATE_LIMIT_DOCS_POR_MINUTO} documentos/minuto atingido. '
                f'Aguarde um pouco antes de enviar mais.'
            )
            logger.warning(f"Rate limit atingido por {user_id}")
            return

        await update.message.reply_text(MENSAGENS['processando'])
        resultado = await processar_documento(update.message)

        await update.message.reply_text(resultado, parse_mode='Markdown')
        logger.info(f"Documento processado com sucesso por {user_id}")

    except Exception as e:
        logger.error(f"Erro ao processar documento: {e}")
        await update.message.reply_text(MENSAGENS['erro_generico'])


@autorizado_apenas
async def handle_texto(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Processar mensagens de texto"""
    try:
        texto = update.message.text.lower()

        if any(palavra in texto for palavra in ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite']):
            await update.message.reply_text(
                '👋 Olá! Como posso ajudar?\n\n'
                'Envie um documento fiscal ou use /ajuda para ver os comandos.'
            )
        elif any(palavra in texto for palavra in ['obrigado', 'obrigada', 'valeu']):
            await update.message.reply_text('😊 Por nada! Estou aqui para ajudar.')
        else:
            await update.message.reply_text(
                'Não entendi. Use /ajuda para ver os comandos disponíveis ou '
                'envie um documento fiscal para processar.'
            )
    except Exception as e:
        logger.error(f"Erro ao processar texto: {e}")


# ===== TRATAMENTO DE ERROS =====

async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Tratamento global de erros"""
    logger.error(f"Erro durante atualização: {context.error}")

    if update and update.effective_message:
        await update.effective_message.reply_text(
            '❌ Ocorreu um erro inesperado. '
            'Por favor, tente novamente ou entre em contato com o suporte.'
        )


# ===== TAREFAS AGENDADAS =====

async def sync_offline_data(context: ContextTypes.DEFAULT_TYPE):
    """Sincronizar dados salvos localmente quando o Supabase estava fora"""
    from utils.local_storage import local_storage
    from utils.supabase_api import supabase_api

    pendentes = local_storage.get_all_pending()
    if not pendentes:
        return

    logger.info(f"🔄 Tentando sincronizar {len(pendentes)} registros pendentes...")

    sucessos = 0
    duplicados = 0
    for item in pendentes:
        try:
            registro_id = item['id']
            tipo = item['tipo']
            dados = item['dados']

            if tipo == 'DOCUMENTO':
                await supabase_api.adicionar_documento(dados)
            elif tipo == 'PAGAMENTO':
                await supabase_api.adicionar_pagamento(dados)

            local_storage.remove_pending(registro_id)
            sucessos += 1

        except Exception as e:
            logger.error(f"❌ Falha ao sincronizar registro {item['id']}: {e}")
            continue

    if sucessos > 0 or duplicados > 0:
        logger.info(f"✅ Sincronização: {sucessos} novos, {duplicados} duplicados descartados")
        partes = [f"✅ `{sucessos}` registros sincronizados"]
        if duplicados:
            partes.append(f"♻️ `{duplicados}` duplicados descartados")
        await context.bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=(
                f"🔄 *Sincronização Offline Concluída*\n\n"
                + "\n".join(partes)
            ),
            parse_mode='Markdown'
        )


async def verificar_vencimentos_periodico(context: ContextTypes.DEFAULT_TYPE):
    """Verificar e alertar sobre vencimentos próximos"""
    try:
        from handlers.pagamentos import verificar_alertas_vencimento
        alertas = await verificar_alertas_vencimento()

        if alertas:
            await context.bot.send_message(
                chat_id=TELEGRAM_CHAT_ID,
                text=alertas,
                parse_mode='Markdown'
            )
            logger.info("Alertas de vencimento enviados")
    except Exception as e:
        logger.error(f"Erro ao verificar vencimentos: {e}")


async def relatorio_automatico(context: ContextTypes.DEFAULT_TYPE):
    """Gerar relatório automático diário"""
    try:
        from handlers.relatorios import gerar_resumo_diario

        resumo = await gerar_resumo_diario()

        await context.bot.send_message(
            chat_id=TELEGRAM_CHAT_ID,
            text=f"📊 *Resumo do Dia*\n\n{resumo}",
            parse_mode='Markdown'
        )
        logger.info("Relatório diário enviado")
    except Exception as e:
        logger.error(f"Erro ao gerar relatório automático: {e}")


# ===== INICIALIZAÇÃO =====

def main():
    """Função principal - Inicializar e executar o bot"""
    logger.info("🤖 Iniciando Bot Telegram...")

    persistence = PicklePersistence(filepath="bot_data.pickle")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).persistence(persistence).build()

    application.add_handler(CommandHandler('start', start_command))
    application.add_handler(CommandHandler('ajuda', ajuda_command))
    application.add_handler(CommandHandler('status', status_command))
    application.add_handler(CommandHandler('vencimentos', vencimentos_command))
    application.add_handler(CommandHandler('relatorio', relatorio_command))
    application.add_handler(CommandHandler('buscar', buscar_command))
    application.add_handler(CommandHandler('info', info_command))

    application.add_handler(MessageHandler(
        filters.Document.ALL | filters.PHOTO,
        handle_documento
    ))
    application.add_handler(MessageHandler(
        filters.TEXT & ~filters.COMMAND,
        handle_texto
    ))

    application.add_error_handler(error_handler)

    job_queue = application.job_queue

    job_queue.run_repeating(
        sync_offline_data,
        interval=300,
        first=10
    )

    job_queue.run_repeating(
        verificar_vencimentos_periodico,
        interval=21600,
        first=60
    )

    from datetime import time as dtime
    from config import HORA_RELATORIO_DIARIO
    hora, minuto = map(int, HORA_RELATORIO_DIARIO.split(':'))
    job_queue.run_daily(
        relatorio_automatico,
        time=dtime(hour=hora, minute=minuto)
    )

    logger.info(f"✅ Bot iniciado com sucesso! Usuários autorizados: {len(AUTHORIZED_USER_IDS)}")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
