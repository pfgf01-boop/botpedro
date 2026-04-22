"""
Configurações do Bot Telegram - Gestão Financeira
Versão: 2.2 - Extração Inteligente com Gemini AI + Supabase
"""

import os
from dotenv import load_dotenv
from typing import Final

# Carregar variáveis de ambiente
load_dotenv()

# ===== TELEGRAM =====
TELEGRAM_BOT_TOKEN: Final = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID: Final = os.getenv('TELEGRAM_CHAT_ID')

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("⚠️ TELEGRAM_BOT_TOKEN não configurado no .env!")
if not TELEGRAM_CHAT_ID:
    raise ValueError("⚠️ TELEGRAM_CHAT_ID não configurado no .env!")

# Lista de usuários autorizados (IDs separados por vírgula). TELEGRAM_CHAT_ID sempre incluso.
_extra_users = os.getenv('TELEGRAM_AUTHORIZED_USERS', '')
AUTHORIZED_USER_IDS: Final = {
    uid.strip() for uid in (TELEGRAM_CHAT_ID + ',' + _extra_users).split(',') if uid.strip()
}

# ===== SUPABASE =====
SUPABASE_URL: Final = os.getenv('SUPABASE_URL')
SUPABASE_KEY: Final = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL:
    raise ValueError("⚠️ SUPABASE_URL não configurado no .env!")
if not SUPABASE_KEY:
    raise ValueError("⚠️ SUPABASE_KEY não configurado no .env!")

# ===== CONFIGURAÇÕES GERAIS =====
AMBIENTE: Final = os.getenv('AMBIENTE', 'desenvolvimento')
DEBUG: Final = os.getenv('DEBUG', 'false').lower() == 'true'
TIMEZONE: Final = os.getenv('TIMEZONE', 'America/Sao_Paulo')

# ===== GEMINI AI (Motor Principal de Extração) =====
GEMINI_API_KEY: Final = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL: Final = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

if not GEMINI_API_KEY:
    import sys
    print("⚠️ GEMINI_API_KEY não configurado no .env. A extração usará apenas Tesseract OCR (menos preciso).")
    print("   Obtenha uma chave gratuita em: https://aistudio.google.com/")

# ===== TESSERACT OCR (Fallback Local) =====
# Detectar caminho do Tesseract automaticamente por SO
import platform
if platform.system() == 'Windows':
    _default_tesseract = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
else:
    _default_tesseract = '/usr/bin/tesseract'

TESSERACT_CMD: Final = os.getenv('TESSERACT_CMD', _default_tesseract)
TESSERACT_LANG: Final = 'por'  # Português
OCR_CONFIDENCE_MIN: Final = 0.6  # Confiança mínima para aceitar texto

# ===== CONFIGURAÇÕES DE ALERTA =====
DIAS_ANTECEDENCIA_VENCIMENTO: Final = 3  # Alertar X dias antes do vencimento
HORA_RELATORIO_DIARIO: Final = '18:00'  # Horário para relatório automático

# ===== LIMITES E VALIDAÇÕES =====
VALOR_ALERTA_ALTO: Final = 5000.00  # Destacar valores acima deste
TAMANHO_MAX_ARQUIVO_MB: Final = 20  # Tamanho máximo de arquivo (MB)
EXTENSOES_PERMITIDAS: Final = {'jpg', 'jpeg', 'png', 'pdf'}

# ===== TIMEOUT & RATE LIMITING =====
GEMINI_TIMEOUT_SEG: Final = int(os.getenv('GEMINI_TIMEOUT_SEG', '60'))
RATE_LIMIT_DOCS_POR_MINUTO: Final = int(os.getenv('RATE_LIMIT_DOCS_POR_MINUTO', '10'))

# ===== VERSÃO =====
VERSAO_BOT: Final = '2.2 (Supabase + Gemini AI)'

# ===== MENSAGENS PADRÃO =====
MENSAGENS = {
    'boas_vindas': """
🤖 *Bem-vindo ao Assistente Financeiro Farm Home!*

Sou seu assistente automatizado para gestão de documentos fiscais.

📋 *O que posso fazer:*
• Processar notas fiscais e boletos
• Extrair dados automaticamente
• Organizar no Supabase
• Gerar relatórios
• Alertar sobre vencimentos

Digite /ajuda para ver todos os comandos.
    """,
    
    'ajuda': """
🆘 *Comandos Disponíveis:*

*Gestão de Documentos:*
📤 Envie foto/PDF de boleto ou nota fiscal
🔍 /buscar <termo> - Buscar documento

*Consultas:*
📊 /status - Resumo geral
📅 /vencimentos - Contas a vencer
📈 /relatorio - Relatório mensal

*Configurações:*
⚙️ /config - Ver configurações
ℹ️ /info - Informações do sistema
❓ /ajuda - Mostrar esta mensagem

*Envie qualquer documento fiscal que eu processarei automaticamente!*
    """,
    
    'processando': '⚙️ Processando documento... Aguarde.',
    'erro_generico': '❌ Ocorreu um erro. Tente novamente ou entre em contato com suporte.',
    'formato_invalido': '⚠️ Formato de arquivo não suportado. Envie PDF ou imagem (JPG/PNG).',
    'arquivo_grande': f'⚠️ Arquivo muito grande. Máximo: {TAMANHO_MAX_ARQUIVO_MB}MB.',
}

# ===== DADOS DA EMPRESA =====
EMPRESA = {
    'nome': 'Farm Home Comércio de Móveis e Eletrônicos LTDA',
    'cnpj': '35.955.650/0001-75',
    'endereco': 'Av das Hortensias, 4961 - Carniel',
    'cidade': 'Gramado',
    'estado': 'RS',
    'cep': '95670-000',
}

# ===== CATEGORIAS DE DOCUMENTOS =====
TIPOS_DOCUMENTO = {
    'NFE': 'Nota Fiscal Eletrônica',
    'BOLETO': 'Boleto Bancário',
    'PEDIDO': 'Pedido de Compra/Venda',
    'OS': 'Ordem de Serviço',
    'RECIBO': 'Recibo de Pagamento',
    'EXTRATO': 'Extrato Bancário',
    'OUTRO': 'Outro Documento',
}

# ===== CATEGORIAS DE FORNECEDORES =====
CATEGORIAS_FORNECEDOR = {
    'MATERIA_PRIMA': 'Matéria-Prima',
    'SERVICOS': 'Serviços',
    'EQUIPAMENTOS': 'Equipamentos',
    'UTILIDADES': 'Utilidades',
    'OUTROS': 'Outros',
}

# ===== LOGS =====
import logging

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.DEBUG if DEBUG else logging.INFO
)

logger = logging.getLogger(__name__)

# Silenciar logs verbosos de bibliotecas HTTP internas
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

if AMBIENTE == 'producao':
    logger.info("🚀 Bot iniciado em modo PRODUÇÃO")
else:
    logger.info("🔧 Bot iniciado em modo DESENVOLVIMENTO")
