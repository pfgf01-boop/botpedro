"""
Handler de Relatórios - Gerar Relatórios e Estatísticas
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from utils.supabase_api import supabase_api
from config import logger
import os


async def mostrar_status() -> str:
    """Mostrar status geral do sistema"""
    try:
        # Obter estatísticas
        stats = await supabase_api.obter_estatisticas()
        
        if not stats:
            return "❌ Erro ao obter estatísticas."
        
        total_docs = stats.get('total_documentos', 0)
        total_pago = stats.get('total_pago', 0)
        total_pendente = stats.get('total_pendente', 0)
        docs_pendentes = stats.get('documentos_pendentes', 0)
        
        # Formatar valores
        pago_str = f"R$ {total_pago:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
        pendente_str = f"R$ {total_pendente:,.2f}".replace(',', '_').replace('.', ',').replace('_', '.')
        
        # Percentual pago
        total_geral = total_pago + total_pendente
        perc_pago = (total_pago / total_geral * 100) if total_geral > 0 else 0
        
        mensagem = f"""
📊 *STATUS GERAL DO SISTEMA*

*Documentos:*
📋 Total cadastrados: {total_docs}
⏳ Pendentes: {docs_pendentes}
✅ Pagos: {total_docs - docs_pendentes}

*Valores:*
✅ Pago: {pago_str}
⏳ Pendente: {pendente_str}
💰 Total: R$ {total_geral:,.2f}

*Desempenho:*
📈 {perc_pago:.1f}% dos valores pagos

_Atualizado em {datetime.now().strftime('%d/%m/%Y às %H:%M')}_
        """
        
        return mensagem.strip()
        
    except Exception as e:
        logger.error(f"Erro ao mostrar status: {e}")
        return f"❌ Erro ao obter status: {str(e)}"


async def gerar_relatorio_mensal() -> Optional[str]:
    """Gerar relatório mensal em PDF"""
    try:
        # Buscar documentos do mês atual
        hoje = datetime.now()
        primeiro_dia = hoje.replace(day=1)
        
        # Buscar documentos
        documentos = await supabase_api.buscar_documentos()
        
        # Filtrar por mês
        docs_mes = []
        for doc in documentos:
            data_str = doc.get('Data', '')
            try:
                data = datetime.strptime(data_str, '%Y-%m-%d')
                if data.month == hoje.month and data.year == hoje.year:
                    docs_mes.append(doc)
            except:
                continue
        
        if not docs_mes:
            logger.info("Nenhum documento no mês atual para relatório")
            return None
        
        # Criar relatório simples em texto
        # Em produção, use ReportLab ou similar para PDF
        conteudo = gerar_conteudo_relatorio(docs_mes, hoje)
        
        # Salvar em arquivo
        nome_arquivo = f"relatorio_{hoje.strftime('%Y_%m')}.txt"
        caminho = f"/tmp/{nome_arquivo}"
        
        with open(caminho, 'w', encoding='utf-8') as f:
            f.write(conteudo)
        
        logger.info(f"Relatório gerado: {nome_arquivo}")
        return caminho
        
    except Exception as e:
        logger.error(f"Erro ao gerar relatório: {e}")
        return None


def gerar_conteudo_relatorio(documentos: List[Dict], data_ref: datetime) -> str:
    """Gerar conteúdo do relatório"""
    
    mes_ano = data_ref.strftime('%B/%Y')
    
    # Cabeçalho
    conteudo = f"""
{'='*60}
RELATÓRIO MENSAL - {mes_ano.upper()}
Farm Home Comércio de Móveis e Eletrônicos LTDA
Gerado em: {datetime.now().strftime('%d/%m/%Y às %H:%M')}
{'='*60}

"""
    
    # Estatísticas
    total_docs = len(documentos)
    total_valor = sum(float(d.get('Valor', 0)) for d in documentos)
    docs_pagos = len([d for d in documentos if d.get('Status') == 'PAGO'])
    valor_pago = sum(float(d.get('Valor', 0)) for d in documentos if d.get('Status') == 'PAGO')
    valor_pendente = total_valor - valor_pago
    
    conteudo += f"""
RESUMO GERAL
{'-'*60}
Total de Documentos: {total_docs}
Documentos Pagos: {docs_pagos}
Documentos Pendentes: {total_docs - docs_pagos}

Valor Total: R$ {total_valor:,.2f}
Valor Pago: R$ {valor_pago:,.2f}
Valor Pendente: R$ {valor_pendente:,.2f}

"""
    
    # Por tipo de documento
    tipos = {}
    for doc in documentos:
        tipo = doc.get('Tipo', 'OUTRO')
        if tipo not in tipos:
            tipos[tipo] = {'qtd': 0, 'valor': 0}
        tipos[tipo]['qtd'] += 1
        tipos[tipo]['valor'] += float(doc.get('Valor', 0))
    
    conteudo += f"""
POR TIPO DE DOCUMENTO
{'-'*60}
"""
    for tipo, dados in tipos.items():
        conteudo += f"{tipo:15} {dados['qtd']:3} docs    R$ {dados['valor']:,.2f}\n"
    
    # Lista de documentos
    conteudo += f"""

LISTA DE DOCUMENTOS
{'-'*60}
ID          Data        Fornecedor                      Valor         Status
{'-'*60}
"""
    
    for doc in sorted(documentos, key=lambda x: x.get('Data', '')):
        doc_id = doc.get('ID', 'N/A')[:8]
        data = doc.get('Data', 'N/A')
        fornecedor = (doc.get('Fornecedor', 'Desconhecido')[:28] + '...') if len(doc.get('Fornecedor', '')) > 28 else doc.get('Fornecedor', 'Desconhecido')
        valor = float(doc.get('Valor', 0))
        status = doc.get('Status', 'PENDENTE')
        
        conteudo += f"{doc_id:10}  {data:10}  {fornecedor:30}  R$ {valor:10,.2f}  {status}\n"
    
    conteudo += f"\n{'='*60}\nFIM DO RELATÓRIO\n{'='*60}\n"
    
    return conteudo


async def gerar_resumo_diario() -> str:
    """Gerar resumo diário (para envio automático)"""
    try:
        hoje = datetime.now().date()
        
        # Buscar documentos de hoje
        documentos = await supabase_api.buscar_documentos()
        docs_hoje = []
        
        for doc in documentos:
            data_str = doc.get('Data', '')
            try:
                data = datetime.strptime(data_str, '%Y-%m-%d').date()
                if data == hoje:
                    docs_hoje.append(doc)
            except:
                continue
        
        # Buscar vencimentos de amanhã
        amanha = hoje + timedelta(days=1)
        vencimentos_amanha = []
        
        for doc in documentos:
            if doc.get('Status') == 'PAGO':
                continue
            venc_str = doc.get('Vencimento', '')
            try:
                venc = datetime.strptime(venc_str, '%Y-%m-%d').date()
                if venc == amanha:
                    vencimentos_amanha.append(doc)
            except:
                continue
        
        # Montar resumo
        resumo = f"📅 {hoje.strftime('%d/%m/%Y')}\n\n"
        
        if docs_hoje:
            resumo += f"📥 *{len(docs_hoje)} documento(s) processado(s) hoje*\n\n"
        else:
            resumo += "📥 Nenhum documento processado hoje\n\n"
        
        if vencimentos_amanha:
            resumo += f"⏰ *{len(vencimentos_amanha)} vencimento(s) amanhã:*\n"
            total = 0
            for doc in vencimentos_amanha:
                fornecedor = doc.get('Fornecedor', 'Desconhecido')
                valor = float(doc.get('Valor', 0))
                total += valor
                resumo += f"  • {fornecedor}: R$ {valor:,.2f}\n"
            resumo += f"\n💰 Total: R$ {total:,.2f}"
        else:
            resumo += "✅ Nenhum vencimento para amanhã"
        
        return resumo
        
    except Exception as e:
        logger.error(f"Erro ao gerar resumo diário: {e}")
        return "❌ Erro ao gerar resumo diário"
