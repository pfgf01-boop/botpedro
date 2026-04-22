"""
Handler de Pagamentos - Gerenciar Pagamentos e Vencimentos
"""

from datetime import datetime, timedelta
from typing import List, Dict
from utils.supabase_api import supabase_api
from config import (
    DIAS_ANTECEDENCIA_VENCIMENTO,
    VALOR_ALERTA_ALTO,
    logger,
)


async def listar_vencimentos() -> str:
    """Listar documentos a vencer nos próximos dias"""
    try:
        # Buscar vencimentos próximos
        documentos = await supabase_api.buscar_vencimentos_proximos(
            dias=DIAS_ANTECEDENCIA_VENCIMENTO
        )
        
        if not documentos:
            return "✅ *Nenhuma conta a vencer nos próximos dias!*"
        
        # Ordenar por data de vencimento
        documentos_ordenados = sorted(
            documentos,
            key=lambda x: x.get('Vencimento', '9999-12-31')
        )
        
        # Agrupar por data
        vencimentos_por_data = {}
        for doc in documentos_ordenados:
            data = doc.get('Vencimento', 'Sem data')
            if data not in vencimentos_por_data:
                vencimentos_por_data[data] = []
            vencimentos_por_data[data].append(doc)
        
        # Montar mensagem
        mensagem = f"📅 *Vencimentos nos próximos {DIAS_ANTECEDENCIA_VENCIMENTO} dias*\n\n"
        
        total_valor = 0.0
        
        for data, docs in vencimentos_por_data.items():
            # Formatar data
            try:
                data_obj = datetime.strptime(data, '%Y-%m-%d')
                data_str = data_obj.strftime('%d/%m/%Y')
                dias_restantes = (data_obj.date() - datetime.now().date()).days
                
                if dias_restantes == 0:
                    data_display = f"🔴 HOJE ({data_str})"
                elif dias_restantes == 1:
                    data_display = f"🟡 AMANHÃ ({data_str})"
                else:
                    data_display = f"🟢 {data_str} (em {dias_restantes} dias)"
            except:
                data_display = data
            
            mensagem += f"*{data_display}*\n"
            
            for doc in docs:
                fornecedor = doc.get('Fornecedor', 'Desconhecido')
                valor = float(doc.get('Valor', 0))
                doc_id = doc.get('ID', 'N/A')
                
                # Formatar valor
                valor_str = f"R$ {valor:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
                
                # Alerta para valores altos
                emoji_valor = '💰' if valor < VALOR_ALERTA_ALTO else '⚠️💰'
                
                mensagem += (
                    f"  • {fornecedor}\n"
                    f"    {emoji_valor} {valor_str}\n"
                    f"    🆔 `{doc_id}`\n"
                )
                
                total_valor += valor
            
            mensagem += "\n"
        
        # Total
        total_str = f"R$ {total_valor:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
        mensagem += f"*💵 TOTAL A PAGAR:* {total_str}"
        
        return mensagem.strip()
        
    except Exception as e:
        logger.error(f"Erro ao listar vencimentos: {e}")
        return f"❌ Erro ao buscar vencimentos: {str(e)}"


async def verificar_alertas_vencimento() -> str:
    """Verificar e montar alertas de vencimento (para tarefa agendada)"""
    try:
        # Buscar vencimentos dos próximos dias (configurável)
        documentos = await supabase_api.buscar_vencimentos_proximos(
            dias=DIAS_ANTECEDENCIA_VENCIMENTO
        )
        
        if not documentos:
            return ""  # Sem alertas
        
        # Filtrar apenas vencimentos críticos (hoje e amanhã)
        hoje = datetime.now().date()
        amanha = hoje + timedelta(days=1)
        
        criticos = []
        for doc in documentos:
            data_str = doc.get('Vencimento', '')
            try:
                data_venc = datetime.strptime(data_str, '%Y-%m-%d').date()
                if data_venc <= amanha:
                    criticos.append(doc)
            except:
                continue
        
        if not criticos:
            return ""
        
        # Montar mensagem de alerta
        mensagem = "🚨 *ALERTA DE VENCIMENTO*\n\n"
        
        for doc in criticos:
            fornecedor = doc.get('Fornecedor', 'Desconhecido')
            valor = float(doc.get('Valor', 0))
            valor_str = f"R$ {valor:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
            data_str = doc.get('Vencimento', '')
            
            try:
                data_venc = datetime.strptime(data_str, '%Y-%m-%d').date()
                if data_venc == hoje:
                    urgencia = "🔴 VENCE HOJE"
                else:
                    urgencia = "🟡 VENCE AMANHÃ"
            except:
                urgencia = "⚠️ VENCIMENTO PRÓXIMO"
            
            mensagem += (
                f"{urgencia}\n"
                f"*Fornecedor:* {fornecedor}\n"
                f"*Valor:* {valor_str}\n\n"
            )
        
        return mensagem.strip()
        
    except Exception as e:
        logger.error(f"Erro ao verificar alertas: {e}")
        return ""


async def registrar_pagamento(documento_id: str, valor: float, forma_pagamento: str) -> str:
    """Registrar pagamento de documento"""
    try:
        import uuid
        
        # Criar registro de pagamento
        pagamento = {
            'ID': str(uuid.uuid4())[:8],
            'DataPagamento': datetime.now().strftime('%Y-%m-%d'),
            'Documento': documento_id,
            'Valor': valor,
            'FormaPagamento': forma_pagamento,
            'Comprovante': '',
        }
        
        # Adicionar ao Supabase
        await supabase_api.adicionar_pagamento(pagamento)
        
        # Atualizar status do documento
        await supabase_api.atualizar_documento(
            documento_id,
            {'Status': 'PAGO'}
        )
        
        logger.info(f"Pagamento registrado para documento {documento_id}")
        return f"✅ Pagamento registrado com sucesso!\n💰 Valor: R$ {valor:.2f}"
        
    except Exception as e:
        logger.error(f"Erro ao registrar pagamento: {e}")
        return f"❌ Erro ao registrar pagamento: {str(e)}"
