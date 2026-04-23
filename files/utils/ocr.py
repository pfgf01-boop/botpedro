"""
Módulo de Extração Inteligente de Documentos
=============================================
Motor Primário: Google Gemini 2.5 Flash (IA com Visão Computacional)
Motor Fallback: Tesseract OCR (Local, sem internet)

Fluxo:
  Imagem/PDF → Gemini AI (estruturado) → Se falhar → Tesseract + Regex → Se falhar → Erro
"""

import asyncio
import json
import re
import logging
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional, List

from pydantic import BaseModel, Field

from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SEG,
    ANTHROPIC_API_KEY,
    CLAUDE_MODEL,
    TESSERACT_CMD,
    TESSERACT_LANG,
    OCR_CONFIDENCE_MIN,
    logger,
)
import base64


# =============================================================================
# SCHEMA ESTRUTURADO (Pydantic)
# =============================================================================

class Parcela(BaseModel):
    """Schema para uma parcela/pagamento."""
    valor: float = Field(description="Valor monetário desta parcela (0.0 se não determinado).")
    data_vencimento: str = Field(description="Data de vencimento no formato YYYY-MM-DD. Vazia se não encontrada.")


class DadosDocumento(BaseModel):
    """Schema para dados extraídos de documentos fiscais brasileiros."""
    tipo: str = Field(
        description="Tipo do documento: NFE, BOLETO, PEDIDO, OS, RECIBO, EXTRATO ou OUTRO"
    )
    fornecedor: str = Field(
        description="Razão social do fornecedor/beneficiário/emitente do documento"
    )
    cnpj: str = Field(
        description="CNPJ do fornecedor, apenas 14 dígitos numéricos. Vazio se não encontrado"
    )
    valor: float = Field(
        description="Valor total do documento em reais (ex: 2500.00). 0.0 se não encontrado"
    )
    data_emissao: str = Field(
        description="Data de emissão no formato YYYY-MM-DD. Vazio se não encontrada"
    )
    parcelas: List[Parcela] = Field(
        description="Lista de parcelas faturadas com seus respectivos valores e vencimentos."
    )
    justificativa_divergencia: str = Field(
        description="Se a soma das parcelas não for exatamente o Valor Total da nota, procure e explique o porquê com base no documento (ex: valor do frete pago separado, desconto por pagamento antecipado, sinal pago, retenção de impostos). Vazio se fechar os valores ou se houver apenas 1 pagamento à vista."
    )
    observacoes: str = Field(
        description="Informações adicionais: número do documento, forma de pagamento, produtos, etc."
    )


# =============================================================================
# PROMPT ESPECIALIZADO PARA DOCUMENTOS BRASILEIROS
# =============================================================================

PROMPT_EXTRACAO = """Você é um especialista em documentos fiscais e comerciais brasileiros.
Analise cuidadosamente esta imagem e extraia TODAS as informações relevantes com máxima precisão.

## Tipos de Documentos e Como Identificar o Fornecedor

- **NFE** (Nota Fiscal Eletrônica / DANFE): Contém "DANFE", "NF-e", "Nota Fiscal".
  → Fornecedor = EMITENTE / REMETENTE (a empresa que vendeu/enviou).
  → A Farm Home (CNPJ 35.955.650/0001-75) é sempre o DESTINATÁRIO (comprador).

- **BOLETO** (Boleto Bancário): Contém logotipo de banco, código de barras, "Linha Digitável".
  → Fornecedor = BENEFICIÁRIO (quem recebe o pagamento).
  → O PAGADOR é a Farm Home ou outro comprador.

- **PEDIDO** (Pedido de Compra/Venda/Orçamento): Contém "Pedido", "Número do Pedido".
  → Fornecedor = empresa VENDEDORA (quem emitiu o pedido de venda).
  → Se a Farm Home aparece como "Cliente", ela é a compradora.

- **OS** (Ordem de Serviço): Contém "Ordem de Serviço", "O.S.".
- **RECIBO**: Contém "Recibo".
- **EXTRATO**: Contém "Extrato".
- **OUTRO**: Qualquer outro tipo de documento.

## Regras de Extração

1. **Fornecedor**: SEMPRE identifique quem VENDE/PRESTA serviço. A Farm Home é SEMPRE compradora.
2. **CNPJ**: Do fornecedor/beneficiário. Apenas os 14 dígitos numéricos, sem pontos/barras/traços.
3. **Valor**: O VALOR TOTAL FINAL do documento. Em boletos é o "Valor do Documento". Em NFes é "Valor Total da Nota". Em pedidos é "Valor Líquido c/ IPI" ou "Total Geral".
4. **Data de Emissão**: Quando o documento foi gerado/emitido.
5. **Data de Vencimento**: Data limite para pagamento (se não for parcelado).
6. **Parcelas listadas**: Procure atentamente por faturamentos parcelados (ex: 30/60/90 dias). Se o pagamento for feito em parcelas, adicione cada pagamento à lista `parcelas` (com `valor` e `data_vencimento`). Se for pagamento único, você pode criar 1 única parcela com o valor total.
7. **Divergências Matemáticas**: Analise se a SOMA matemática dos pagamentos (parcelas) é igual ao Valor Total. Caso seja DIFERENTE, procure no documento uma justificativa para preencher `justificativa_divergencia` (exemplos: "R$ 50 de frete não incluso na base", "R$ 100 pagos à vista como sinal", "Juros embutidos", etc.). Se os valores baterem, deixe vazio.
8. **Observações**: Número do documento/pedido/nota, condição de pagamento, produtos principais.

## Formato de Respostas
- Datas: YYYY-MM-DD (ex: 2026-02-15)
- Valor: número decimal com ponto (ex: 2500.00)
- CNPJ: 14 dígitos sem formatação (ex: 00414334900133)
- Se não encontrar algum campo, retorne "" para texto ou 0.0 para valor.

Analise a imagem com extremo cuidado. A precisão dos dados é CRÍTICA para gestão financeira."""


# =============================================================================
# EXTRATOR GEMINI (Motor Principal - IA com Visão)
# =============================================================================

class GeminiExtractor:
    """Extrator de documentos usando Google Gemini 2.5 Flash com visão computacional."""

    def __init__(self):
        self._client = None
        self._available = False
        self._init_client()

    def _init_client(self):
        """Inicializar cliente Gemini de forma segura."""
        if not GEMINI_API_KEY:
            logger.warning("⚠️ GEMINI_API_KEY não configurada. Motor IA desabilitado.")
            return

        try:
            from google import genai
            self._client = genai.Client(api_key=GEMINI_API_KEY)
            self._available = True
            logger.info(f"✅ Gemini AI ({GEMINI_MODEL}) inicializado com sucesso")
        except ImportError:
            logger.warning("⚠️ Pacote 'google-genai' não instalado. Execute: pip install google-genai")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Gemini: {e}")

    @property
    def disponivel(self) -> bool:
        """Verificar se o Gemini está disponível."""
        return self._available

    def _preparar_imagem(self, arquivo_bytes: bytes, rotacao: int = 0) -> bytes:
        """Aplica EXIF-transpose, rotação opcional e redimensiona p/ máx 2000px.

        Celular grava foto com tag EXIF de orientação em vez de rotacionar os pixels —
        alguns visualizadores respeitam, mas o Gemini às vezes vê a versão crua.
        Normalizar aqui garante que o modelo sempre recebe o texto na horizontal,
        e o redimensionamento reduz payload/latência sem perder legibilidade.
        """
        try:
            from PIL import Image, ImageOps

            img = Image.open(BytesIO(arquivo_bytes))
            img = ImageOps.exif_transpose(img)
            if rotacao:
                img = img.rotate(-rotacao, expand=True)
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # Limita dimensão maior a 2000px (suficiente pra OCR, muito mais leve)
            max_dim = 2000
            if max(img.size) > max_dim:
                img.thumbnail((max_dim, max_dim), Image.LANCZOS)

            buf = BytesIO()
            img.save(buf, format='JPEG', quality=92, optimize=True)
            return buf.getvalue()
        except Exception as e:
            logger.warning(f"⚠️ Pré-processamento falhou ({e}); usando bytes originais")
            return bytes(arquivo_bytes)

    async def _chamar_gemini(self, arquivo_bytes: bytes, mime_type: str) -> Optional[Dict]:
        """Uma chamada ao Gemini, com retry automático em 503/429.

        A API do Gemini devolve 503 UNAVAILABLE sob alta demanda (spikes típicos
        em horário comercial). Retentamos 3× com backoff 2s → 5s → 10s.
        """
        from google.genai import types

        image_part = types.Part.from_bytes(
            data=bytes(arquivo_bytes),
            mime_type=mime_type,
        )

        response = None
        tentativas = [2, 5, 10]  # segundos de espera antes de cada retry
        for idx, espera in enumerate([0] + tentativas):
            if espera:
                logger.info(f"⏳ Gemini sobrecarregado, retry em {espera}s (tentativa {idx+1}/4)")
                await asyncio.sleep(espera)
            try:
                response = await asyncio.wait_for(
                    asyncio.to_thread(
                        self._client.models.generate_content,
                        model=GEMINI_MODEL,
                        contents=[image_part, PROMPT_EXTRACAO],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=DadosDocumento,
                            temperature=0.1,
                        ),
                    ),
                    timeout=GEMINI_TIMEOUT_SEG,
                )
                break
            except asyncio.TimeoutError:
                logger.error(f"⏱️ Gemini excedeu timeout de {GEMINI_TIMEOUT_SEG}s")
                return None
            except Exception as e:
                msg = str(e)
                # 503 (UNAVAILABLE) e 429 (RESOURCE_EXHAUSTED) são transientes — retry
                if '503' in msg or '429' in msg or 'UNAVAILABLE' in msg.upper() or 'RESOURCE_EXHAUSTED' in msg.upper():
                    if idx < len(tentativas):
                        continue
                    logger.error(f"❌ Gemini indisponível após {len(tentativas)+1} tentativas: {msg[:150]}")
                    return None
                logger.error(f"❌ Erro na chamada Gemini: {msg[:200]}")
                return None

        if response is None:
            return None

        raw_text = getattr(response, 'text', None) or ''
        if not raw_text.strip():
            logger.error(f"❌ Gemini devolveu resposta vazia (response={response!r:.200})")
            return None

        try:
            dados_json = json.loads(raw_text)
            dados = DadosDocumento(**dados_json)
        except json.JSONDecodeError as e:
            logger.error(f"❌ Gemini retornou JSON inválido: {e} | raw={raw_text[:300]!r}")
            return None
        except Exception as e:
            logger.error(f"❌ Gemini: validação Pydantic falhou ({e}) | raw={raw_text[:300]!r}")
            return None

        cnpj_limpo = re.sub(r'[^\d]', '', dados.cnpj)
        if len(cnpj_limpo) != 14:
            cnpj_limpo = ''

        parcelas_extraidas = [
            {"valor": p.valor, "vencimento": p.data_vencimento}
            for p in dados.parcelas
        ]

        return {
            'tipo': dados.tipo.upper().strip(),
            'cnpj': cnpj_limpo,
            'fornecedor': dados.fornecedor.strip(),
            'valor': dados.valor,
            'data': dados.data_emissao,
            'parcelas': parcelas_extraidas,
            'justificativa_divergencia': dados.justificativa_divergencia,
            'texto_completo': dados.observacoes,
            'processamento_ok': True,
            'motor': 'gemini-ai',
        }

    @staticmethod
    def _resultado_util(resultado: Optional[Dict]) -> bool:
        """True se tem fornecedor identificado OU valor > 0."""
        if not resultado:
            return False
        tem_fornecedor = (
            resultado.get('fornecedor')
            and resultado['fornecedor'] != 'Não identificado'
        )
        tem_valor = resultado.get('valor') and resultado['valor'] > 0
        return bool(tem_fornecedor or tem_valor)

    async def extrair(self, arquivo_bytes: bytes, tipo_arquivo: str) -> Optional[Dict]:
        """Extrai dados do documento usando Gemini.

        Estratégia: tenta a imagem original, e se voltar vazia, retenta com
        rotações de 90°/180°/270° — resolve fotos de celular deitadas de lado.
        PDF pula o pré-processamento (não é imagem raster simples).
        """
        if not self._available:
            return None

        try:
            tipo = tipo_arquivo.lower()
            mime_map = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'pdf': 'application/pdf'}
            mime_type = mime_map.get(tipo, 'image/jpeg')

            # PDF: chamada direta, sem pré-processamento de imagem
            if tipo == 'pdf':
                resultado = await self._chamar_gemini(bytes(arquivo_bytes), mime_type)
                if resultado:
                    logger.info(
                        f"✅ Gemini extraiu: {resultado['tipo']} | "
                        f"{resultado['fornecedor'][:40]} | "
                        f"R$ {resultado['valor']:,.2f} | "
                        f"Parcelas: {len(resultado['parcelas'])}"
                    )
                return resultado

            # Imagens: EXIF-transpose na 1ª tentativa; rotações extras se vier vazio
            for rotacao in (0, 90, 180, 270):
                bytes_preparados = self._preparar_imagem(arquivo_bytes, rotacao)
                if rotacao:
                    logger.info(f"🔄 Tentando novamente com rotação de {rotacao}°")
                resultado = await self._chamar_gemini(bytes_preparados, 'image/jpeg')
                if self._resultado_util(resultado):
                    logger.info(
                        f"✅ Gemini extraiu: {resultado['tipo']} | "
                        f"{resultado['fornecedor'][:40]} | "
                        f"R$ {resultado['valor']:,.2f} | "
                        f"Parcelas: {len(resultado['parcelas'])}"
                        + (f" | rotação={rotacao}°" if rotacao else "")
                    )
                    return resultado

            logger.warning("⚠️ Gemini não conseguiu extrair dados em nenhuma orientação")
            return resultado  # devolve o último (pode ter tipo identificado, ainda útil)

        except Exception as e:
            logger.error(f"❌ Erro na extração Gemini: {e}")
            return None


# =============================================================================
# EXTRATOR CLAUDE (Fallback quando Gemini falha/indisponível)
# =============================================================================

class ClaudeExtractor:
    """Extrator via Claude API (Anthropic). Usado quando Gemini indisponível."""

    def __init__(self):
        self._client = None
        self._available = False
        self._init_client()

    def _init_client(self):
        if not ANTHROPIC_API_KEY:
            logger.info("ℹ️ ANTHROPIC_API_KEY não configurada. Fallback Claude desabilitado.")
            return
        try:
            from anthropic import AsyncAnthropic
            self._client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            self._available = True
            logger.info(f"✅ Claude ({CLAUDE_MODEL}) disponível como fallback")
        except ImportError:
            logger.warning("⚠️ Pacote 'anthropic' não instalado. Execute: pip install anthropic")
        except Exception as e:
            logger.error(f"❌ Erro ao inicializar Claude: {e}")

    @property
    def disponivel(self) -> bool:
        return self._available

    async def extrair(self, arquivo_bytes: bytes, tipo_arquivo: str) -> Optional[Dict]:
        """Extrai dados com Claude usando tool_use pra forçar JSON estruturado."""
        if not self._available:
            return None

        mime_map = {
            'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'png': 'image/png', 'pdf': 'application/pdf',
        }
        mime_type = mime_map.get(tipo_arquivo.lower(), 'image/jpeg')
        data_b64 = base64.b64encode(bytes(arquivo_bytes)).decode('ascii')

        # Tool schema correspondente ao DadosDocumento do Pydantic
        extract_tool = {
            "name": "extrair_dados_documento",
            "description": "Registra os dados extraídos de um documento fiscal brasileiro.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "tipo": {"type": "string", "description": "NFE, BOLETO, PEDIDO, OS, RECIBO, EXTRATO ou OUTRO"},
                    "fornecedor": {"type": "string", "description": "Razão social do fornecedor/beneficiário."},
                    "cnpj": {"type": "string", "description": "CNPJ do fornecedor, 14 dígitos sem formatação."},
                    "valor": {"type": "number", "description": "Valor total do documento em reais."},
                    "data_emissao": {"type": "string", "description": "YYYY-MM-DD ou vazio."},
                    "parcelas": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "valor": {"type": "number"},
                                "data_vencimento": {"type": "string", "description": "YYYY-MM-DD"},
                            },
                            "required": ["valor", "data_vencimento"],
                        },
                    },
                    "justificativa_divergencia": {"type": "string"},
                    "observacoes": {"type": "string"},
                },
                "required": ["tipo", "fornecedor", "valor", "parcelas"],
            },
        }

        # Bloco de imagem ou documento (PDF)
        if mime_type == 'application/pdf':
            content_block = {
                "type": "document",
                "source": {"type": "base64", "media_type": mime_type, "data": data_b64},
            }
        else:
            content_block = {
                "type": "image",
                "source": {"type": "base64", "media_type": mime_type, "data": data_b64},
            }

        try:
            response = await asyncio.wait_for(
                self._client.messages.create(
                    model=CLAUDE_MODEL,
                    max_tokens=1024,
                    tools=[extract_tool],
                    tool_choice={"type": "tool", "name": "extrair_dados_documento"},
                    messages=[{
                        "role": "user",
                        "content": [content_block, {"type": "text", "text": PROMPT_EXTRACAO}],
                    }],
                ),
                timeout=GEMINI_TIMEOUT_SEG,
            )
        except asyncio.TimeoutError:
            logger.error(f"⏱️ Claude excedeu timeout de {GEMINI_TIMEOUT_SEG}s")
            return None
        except Exception as e:
            logger.error(f"❌ Erro na chamada Claude: {str(e)[:200]}")
            return None

        # Extrai o tool_use block
        tool_use = next(
            (b for b in response.content if getattr(b, 'type', None) == 'tool_use'),
            None,
        )
        if not tool_use:
            logger.error("❌ Claude não retornou tool_use block")
            return None

        try:
            dados = DadosDocumento(**tool_use.input)
        except Exception as e:
            logger.error(f"❌ Claude: validação Pydantic falhou ({e})")
            return None

        cnpj_limpo = re.sub(r'[^\d]', '', dados.cnpj)
        if len(cnpj_limpo) != 14:
            cnpj_limpo = ''

        parcelas_extraidas = [
            {"valor": p.valor, "vencimento": p.data_vencimento}
            for p in dados.parcelas
        ]

        logger.info(
            f"✅ Claude extraiu: {dados.tipo} | "
            f"{dados.fornecedor[:40]} | "
            f"R$ {dados.valor:,.2f} | "
            f"Parcelas: {len(dados.parcelas)}"
        )

        return {
            'tipo': dados.tipo.upper().strip(),
            'cnpj': cnpj_limpo,
            'fornecedor': dados.fornecedor.strip(),
            'valor': dados.valor,
            'data': dados.data_emissao,
            'parcelas': parcelas_extraidas,
            'justificativa_divergencia': dados.justificativa_divergencia,
            'texto_completo': dados.observacoes,
            'processamento_ok': True,
            'motor': 'claude-ai',
        }


# =============================================================================
# EXTRATOR TESSERACT (Motor Fallback - Local, sem internet)
# =============================================================================

class TesseractExtractor:
    """Extrator de documentos usando Tesseract OCR (fallback local)."""

    def __init__(self):
        self._available = False
        self._init_tesseract()

    def _init_tesseract(self):
        """Verificar se o Tesseract está instalado e funcional."""
        try:
            import pytesseract
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
            # Teste rápido para verificar se o Tesseract responde
            pytesseract.get_tesseract_version()
            self._available = True
            logger.info("✅ Tesseract OCR disponível como fallback")
        except ImportError:
            logger.info("ℹ️ pytesseract não instalado. Fallback OCR desabilitado.")
        except Exception as e:
            logger.info(f"ℹ️ Tesseract não disponível: {e}")

    @property
    def disponivel(self) -> bool:
        """Verificar se o Tesseract está disponível."""
        return self._available

    async def extrair(self, arquivo_bytes: bytes, tipo_arquivo: str) -> Optional[Dict]:
        """
        Extrair dados usando Tesseract OCR + regex para parsing.

        Args:
            arquivo_bytes: Bytes do arquivo
            tipo_arquivo: Extensão do arquivo

        Returns:
            Dict com dados extraídos ou None se falhou
        """
        if not self._available:
            return None

        try:
            # Extrair texto bruto
            if tipo_arquivo in ('jpg', 'jpeg', 'png'):
                texto = await self._extrair_texto_imagem(arquivo_bytes)
            elif tipo_arquivo == 'pdf':
                texto = await self._extrair_texto_pdf(arquivo_bytes)
            else:
                return None

            if not texto or len(texto.strip()) < 10:
                logger.warning("⚠️ Tesseract: texto extraído muito curto ou vazio")
                return None

            # Limpar texto
            texto_limpo = re.sub(r'\s+', ' ', texto).strip()

            # Extrair campos com regex
            tipo_doc = self._identificar_tipo(texto)
            cnpj = self._extrair_cnpj(texto)
            valor = self._extrair_valor(texto)
            data = self._extrair_data(texto)
            fornecedor = self._extrair_fornecedor(texto)

            logger.info(
                f"📝 Tesseract extraiu: {tipo_doc} | "
                f"{(fornecedor or 'N/I')[:40]} | "
                f"R$ {valor or 0.0:,.2f}"
            )

            return {
                'tipo': tipo_doc,
                'cnpj': cnpj or '',
                'fornecedor': fornecedor or 'Não identificado',
                'valor': valor or 0.0,
                'data': data or '',
                'data_vencimento': data or '',
                'texto_completo': texto_limpo[:500],
                'processamento_ok': True,
                'motor': 'tesseract-ocr',
            }

        except Exception as e:
            logger.error(f"❌ Erro na extração Tesseract: {e}")
            return None

    # ─── Métodos de extração de texto ─────────────────────────────────────

    async def _extrair_texto_imagem(self, imagem_bytes: bytes) -> str:
        """Extrair texto de imagem usando Tesseract."""
        try:
            import pytesseract
            from PIL import Image

            imagem = Image.open(BytesIO(imagem_bytes))
            imagem = imagem.convert('L')  # Escala de cinza

            texto = await asyncio.to_thread(
                pytesseract.image_to_string,
                imagem,
                lang=TESSERACT_LANG,
                config='--psm 6',
            )
            return texto.strip()
        except Exception as e:
            logger.error(f"Erro Tesseract (imagem): {e}")
            return ""

    async def _extrair_texto_pdf(self, pdf_bytes: bytes) -> str:
        """Extrair texto de PDF."""
        try:
            from PyPDF2 import PdfReader

            reader = PdfReader(BytesIO(pdf_bytes))
            textos = []
            for pagina in reader.pages:
                texto = pagina.extract_text()
                if texto:
                    textos.append(texto)
            return '\n'.join(textos).strip()
        except Exception as e:
            logger.error(f"Erro Tesseract (PDF): {e}")
            return ""

    # ─── Métodos de parsing com regex ─────────────────────────────────────

    def _identificar_tipo(self, texto: str) -> str:
        """Identificar tipo de documento pelo conteúdo."""
        t = texto.upper()
        if any(kw in t for kw in ('NF-E', 'NOTA FISCAL', 'DANFE')):
            return 'NFE'
        elif any(kw in t for kw in ('BOLETO', 'CÓDIGO DE BARRAS', 'LINHA DIGITÁVEL', 'FICHA DE COMPENSAÇÃO')):
            return 'BOLETO'
        elif any(kw in t for kw in ('PEDIDO', 'NÚMERO DO PEDIDO', 'NR. PEDIDO')):
            return 'PEDIDO'
        elif any(kw in t for kw in ('ORDEM DE SERVIÇO', 'O.S.')):
            return 'OS'
        elif 'RECIBO' in t:
            return 'RECIBO'
        elif 'EXTRATO' in t:
            return 'EXTRATO'
        return 'OUTRO'

    def _extrair_cnpj(self, texto: str) -> Optional[str]:
        """Extrair CNPJ do texto."""
        padroes = [
            r'\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}',
            r'\d{14}',
        ]
        for padrao in padroes:
            match = re.search(padrao, texto)
            if match:
                cnpj = re.sub(r'[^\d]', '', match.group())
                if len(cnpj) == 14:
                    return cnpj
        return None

    def _extrair_valor(self, texto: str) -> Optional[float]:
        """Extrair valor monetário do texto."""
        padroes = [
            r'R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))',
            r'VALOR[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))',
            r'TOTAL[:\s]+R?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2}))',
            r'(\d{1,3}(?:\.\d{3})*,\d{2})',
        ]
        for padrao in padroes:
            match = re.search(padrao, texto, re.IGNORECASE)
            if match:
                valor_str = match.group(1).replace('.', '').replace(',', '.')
                try:
                    valor = float(valor_str)
                    if valor > 0:
                        return valor
                except ValueError:
                    continue
        return None

    def _extrair_data(self, texto: str) -> Optional[str]:
        """Extrair data do texto (retorna YYYY-MM-DD)."""
        padroes = [
            r'(\d{2})[/-](\d{2})[/-](\d{4})',
            r'(\d{2})[/-](\d{2})[/-](\d{2})',
        ]
        for padrao in padroes:
            match = re.search(padrao, texto)
            if match:
                dia, mes, ano = match.groups()
                if len(ano) == 2:
                    ano = '20' + ano if int(ano) < 50 else '19' + ano
                try:
                    data = datetime(int(ano), int(mes), int(dia))
                    return data.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        return None

    def _extrair_fornecedor(self, texto: str) -> Optional[str]:
        """Extrair nome do fornecedor com regex."""
        padroes = [
            r'RAZ[AÃ]O\s*SOCIAL[:\s]+(.*?)(?:\n|CNPJ)',
            r'BENEFICI[ÁA]RIO[:\s]+(.*?)(?:\n|CNPJ)',
            r'EMIT[^\n]*\n\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s\.]+)',
            r'REMETENTE[:\s]+(.*?)(?:\n|CNPJ)',
        ]
        for padrao in padroes:
            match = re.search(padrao, texto, re.IGNORECASE | re.MULTILINE)
            if match:
                fornecedor = re.sub(r'\s+', ' ', match.group(1)).strip()
                if len(fornecedor) > 3:
                    return fornecedor[:100]
        return None


# =============================================================================
# ORQUESTRADOR (Classe Principal)
# =============================================================================

class DocumentoOCR:
    """
    Orquestrador de extração de documentos.

    Cascata de motores:
      1. Gemini AI (rápido, cota gratuita, mas sobrecarrega às vezes)
      2. Claude AI (pago, estável — ativa quando Gemini falha/vazio)
      3. Tesseract OCR (local, último recurso)
    """

    def __init__(self):
        self._gemini = GeminiExtractor()
        self._claude = ClaudeExtractor()
        self._tesseract = TesseractExtractor()

        motores = []
        if self._gemini.disponivel:
            motores.append(f"Gemini AI ({GEMINI_MODEL})")
        if self._claude.disponivel:
            motores.append(f"Claude AI ({CLAUDE_MODEL})")
        if self._tesseract.disponivel:
            motores.append("Tesseract OCR")

        if motores:
            logger.info(f"🔧 Motores de extração ativos: {', '.join(motores)}")
        else:
            logger.error("❌ NENHUM motor de extração disponível! Configure GEMINI_API_KEY, ANTHROPIC_API_KEY ou instale Tesseract.")

    @staticmethod
    def _resultado_util(resultado: Optional[Dict]) -> bool:
        """True se o resultado tem fornecedor identificado OU valor > 0."""
        if not resultado or not resultado.get('processamento_ok'):
            return False
        tem_fornecedor = (
            resultado.get('fornecedor')
            and resultado['fornecedor'] != 'Não identificado'
        )
        tem_valor = resultado.get('valor') and resultado['valor'] > 0
        return bool(tem_fornecedor or tem_valor)

    async def processar_documento(self, arquivo_bytes: bytes, tipo_arquivo: str) -> Dict:
        """Processar documento com cascata Gemini → Claude → Tesseract."""
        tipo_arquivo = tipo_arquivo.lower().strip()

        # ── Motor 1: Gemini AI (principal) ──────────────────────────────
        if self._gemini.disponivel:
            logger.info("🤖 Tentando extração com Gemini AI...")
            resultado = await self._gemini.extrair(arquivo_bytes, tipo_arquivo)
            if self._resultado_util(resultado):
                logger.info("✅ Extração concluída via Gemini AI")
                return resultado
            logger.warning("⚠️ Gemini falhou ou retornou vazio, tentando Claude...")

        # ── Motor 2: Claude AI (fallback principal) ─────────────────────
        if self._claude.disponivel:
            logger.info("🧠 Tentando extração com Claude AI...")
            resultado = await self._claude.extrair(arquivo_bytes, tipo_arquivo)
            if self._resultado_util(resultado):
                logger.info("✅ Extração concluída via Claude AI")
                return resultado
            logger.warning("⚠️ Claude também falhou, tentando Tesseract...")

        # ── Motor 3: Tesseract OCR (último recurso) ─────────────────────
        if self._tesseract.disponivel:
            logger.info("📝 Tentando extração com Tesseract OCR (fallback)...")
            resultado = await self._tesseract.extrair(arquivo_bytes, tipo_arquivo)

            if resultado and resultado.get('processamento_ok'):
                logger.info("✅ Extração concluída via Tesseract OCR")
                return resultado

        # ── Ambos falharam ──────────────────────────────────────────────
        logger.error("❌ Todos os motores de extração falharam")
        return {
            'tipo': 'DESCONHECIDO',
            'processamento_ok': False,
            'motor': 'nenhum',
            'erro': (
                'Não foi possível extrair dados do documento. '
                'Verifique se a imagem está nítida e bem iluminada.'
            ),
        }


# =============================================================================
# INSTÂNCIA GLOBAL
# =============================================================================

ocr = DocumentoOCR()
