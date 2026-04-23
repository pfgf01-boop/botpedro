"""
Handler de Documentos - Processar e Gerenciar Documentos Fiscais
"""

from telegram import Message
from datetime import datetime
import uuid
from typing import Dict, Optional
from utils.ocr import ocr
from utils.supabase_api import supabase_api
from utils.local_storage import local_storage
from config import (
    TAMANHO_MAX_ARQUIVO_MB,
    EXTENSOES_PERMITIDAS,
    MENSAGENS,
    logger,
)


async def processar_documento(message: Message) -> str:
    """Processar documento enviado pelo usuário"""
    try:
        # Obter arquivo
        if message.document:
            arquivo = message.document
            nome = arquivo.file_name or ''
            if '.' not in nome:
                return MENSAGENS['formato_invalido']
            tipo_arquivo = nome.rsplit('.', 1)[-1].lower()
            if tipo_arquivo not in EXTENSOES_PERMITIDAS:
                return MENSAGENS['formato_invalido']
        elif message.photo:
            arquivo = message.photo[-1]  # Melhor qualidade
            tipo_arquivo = 'jpg'
        else:
            return MENSAGENS['formato_invalido']

        # Verificar tamanho
        tamanho_mb = arquivo.file_size / (1024 * 1024)
        if tamanho_mb > TAMANHO_MAX_ARQUIVO_MB:
            return MENSAGENS['arquivo_grande']
        
        # Baixar arquivo
        arquivo_telegram = await arquivo.get_file()
        arquivo_bytes = await arquivo_telegram.download_as_bytearray()
        
        # Processar com OCR
        dados_extraidos = await ocr.processar_documento(bytes(arquivo_bytes), tipo_arquivo)
        
        if not dados_extraidos.get('processamento_ok'):
            erro = dados_extraidos.get('erro', 'Erro desconhecido')
            return f"❌ Erro ao processar documento: {erro}"
        
        # Obter ID base
        documento_id_base = str(uuid.uuid4())[:8]
        
        # Obter informacoes principais
        data_emissao = dados_extraidos.get('data') or datetime.now().strftime('%Y-%m-%d')
        # Prioridade: vencimento explícito > 1ª parcela > emissão (último fallback)
        parcelas_extraidas = dados_extraidos.get('parcelas') or []
        primeira_parcela_venc = (
            parcelas_extraidas[0].get('vencimento') if parcelas_extraidas else None
        )
        data_vencimento = (
            dados_extraidos.get('data_vencimento')
            or primeira_parcela_venc
            or data_emissao
        )
        motor = dados_extraidos.get('motor', 'desconhecido')
        obs_extras = dados_extraidos.get('texto_completo', '')
        valor_total = float(dados_extraidos.get('valor', 0.0))

        obs = f"Motor: {motor} | {obs_extras[:200]}" if obs_extras else f"Motor: {motor}"

        documento_para_salvar = {
            'ID': documento_id_base,
            'Data': data_emissao,
            'Tipo': dados_extraidos.get('tipo', 'OUTRO'),
            'Fornecedor': dados_extraidos.get('fornecedor', 'Não identificado'),
            'CNPJ_Fornecedor': dados_extraidos.get('cnpj', '') or None,
            'Valor': valor_total,
            'Status': 'PENDENTE',
            'Vencimento': data_vencimento,
            'Observacoes': obs,
            'parcelas': parcelas_extraidas,
        }
            
        # Montar mensagem com base nos dados e divergencia
        mensagem_confirmacao = formatar_dados_extraidos(dados_extraidos)

        # Salvar no Supabase
        try:
            doc_inserido = await supabase_api.adicionar_documento(documento_para_salvar)
            doc_uuid = doc_inserido.get("id", documento_id_base)

            mensagem_final = (
                f"{mensagem_confirmacao}\n\n"
                f"✅ *Leitura confirmada e salva.*"
            )
            logger.info(f"Documento {doc_uuid} salvo com sucesso no Supabase")
            return mensagem_final

        except Exception as e:
            logger.error(f"Erro ao salvar documento no Supabase: {e}")

            try:
                local_storage.add_pending(documento_id_base, 'DOCUMENTO', documento_para_salvar)
                return (
                    f"{mensagem_confirmacao}\n\n"
                    f"⚠️ *Nota:* Sem conexão ao Supabase. Documento criado localmente.\n"
                    f"🔄 Será sincronizado automaticamente assim que a conexão retornar.\n"
                    f"📋 Base ID local: `{documento_id_base}`"
                )
            except Exception as local_error:
                logger.error(f"Erro crítico ao salvar localmente: {local_error}")
                return (
                    f"{mensagem_confirmacao}\n\n"
                    f"❌ Erro ao salvar no Supabase e falha no backup local.\n"
                    f"Por favor, tente novamente mais tarde."
                )
    
    except Exception as e:
        logger.error(f"Erro ao processar documento: {e}")
        return f"❌ Erro ao processar documento: {str(e)}"


def _formatar_data(data_str: str) -> str:
    """Converter YYYY-MM-DD para DD/MM/YYYY."""
    if data_str and len(data_str) == 10:
        try:
            data_obj = datetime.strptime(data_str, '%Y-%m-%d')
            return data_obj.strftime('%d/%m/%Y')
        except Exception:
            return data_str
    return data_str or 'Não identificada'


def formatar_dados_extraidos(dados: Dict) -> str:
    """Formatar dados extraídos para exibição no Telegram.

    Mostra apenas: Tipo, Fornecedor, Valor e Vencimento.
    Se houver múltiplas parcelas, mostra o 1º vencimento e indica o total de parcelas.
    """
    tipo = dados.get('tipo', 'DESCONHECIDO')
    fornecedor = dados.get('fornecedor', 'Não identificado')
    valor = dados.get('valor')
    data_emissao = dados.get('data', '')
    parcelas = dados.get('parcelas') or []

    # Vencimento: explícito > 1ª parcela > emissão
    primeira_parcela_venc = parcelas[0].get('vencimento') if parcelas else None
    data_vencimento = (
        dados.get('data_vencimento')
        or primeira_parcela_venc
        or data_emissao
    )

    if valor and valor > 0:
        valor_str = f"R$ {valor:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
    else:
        valor_str = 'Não identificado'

    vencimento_str = _formatar_data(data_vencimento)
    if len(parcelas) > 1:
        vencimento_str = f"{vencimento_str} (1ª de {len(parcelas)}x)"

    emojis = {
        'NFE': '📄', 'BOLETO': '💳', 'PEDIDO': '📦', 'OS': '🔧',
        'RECIBO': '🧾', 'EXTRATO': '📊', 'OUTRO': '📋', 'DESCONHECIDO': '❓',
    }
    emoji = emojis.get(tipo, '📋')

    linhas = [
        f"{emoji} *Documento lido*",
        "",
        f"*Tipo:* {tipo}",
        f"*Fornecedor:* {fornecedor}",
        f"*Valor:* {valor_str}",
        f"*Vencimento:* {vencimento_str}",
    ]
    return '\n'.join(linhas)


async def buscar_documento(termo: str) -> str:
    """Buscar documentos por termo"""
    try:
        # Buscar no Supabase
        documentos = await supabase_api.buscar_documentos_por_termo(termo)
        
        if not documentos:
            return f"🔍 Nenhum documento encontrado para: *{termo}*"
        
        # Formatar resultados
        mensagem = f"🔍 *Resultados para:* {termo}\n\n"
        
        for i, doc in enumerate(documentos[:10], 1):  # Máximo 10 resultados
            fornecedor = doc.get('Fornecedor', 'Desconhecido')
            valor = doc.get('Valor', 0)
            data = doc.get('Data', 'Sem data')
            status = doc.get('Status', 'PENDENTE')
            doc_id = doc.get('ID', 'N/A')
            
            # Formatar valor
            valor_str = f"R$ {float(valor):,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
            
            # Emoji por status
            status_emoji = '✅' if status == 'PAGO' else '⏳'
            
            mensagem += (
                f"{i}. {status_emoji} *{fornecedor}*\n"
                f"   💰 {valor_str} | 📅 {data}\n"
                f"   🆔 `{doc_id}`\n\n"
            )
        
        if len(documentos) > 10:
            mensagem += f"_... e mais {len(documentos) - 10} resultado(s)_"
        
        return mensagem.strip()
        
    except Exception as e:
        logger.error(f"Erro ao buscar documento: {e}")
        return f"❌ Erro ao buscar documentos: {str(e)}"
