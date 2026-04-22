"""
Módulo de Integração com Supabase API
Schema: documentos, parcelas, fornecedores, empresas, pagamentos
"""

import asyncio
from typing import Dict, List, Optional
from supabase import create_client, Client
from config import SUPABASE_URL, SUPABASE_KEY, logger


class SupabaseAPI:
    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            logger.error("⚠️ SUPABASE_URL ou SUPABASE_KEY não configurados!")
            self.client = None
            self._empresa_id = None
            return
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self._empresa_id: Optional[str] = None
        logger.info("✅ Conectado ao Supabase")

    async def _run(self, fn, *args, **kwargs):
        return await asyncio.to_thread(fn, *args, **kwargs)

    # ===== EMPRESA =====

    async def obter_empresa_id(self) -> Optional[str]:
        """Retorna o ID da primeira empresa cadastrada (cached)."""
        if self._empresa_id:
            return self._empresa_id
        try:
            def _q():
                return self.client.table("empresas").select("id").limit(1).execute()
            resp = await self._run(_q)
            if resp.data:
                self._empresa_id = resp.data[0]["id"]
                return self._empresa_id
        except Exception as e:
            logger.error(f"Erro ao obter empresa_id: {e}")
        return None

    # ===== FORNECEDORES =====

    async def buscar_ou_criar_fornecedor(self, nome: str, cnpj: Optional[str]) -> Optional[str]:
        """Retorna o ID do fornecedor, criando se não existir."""
        try:
            def _busca():
                q = self.client.table("fornecedores").select("id")
                if cnpj:
                    return q.eq("cnpj", cnpj).limit(1).execute()
                return q.ilike("nome", nome).limit(1).execute()
            resp = await self._run(_busca)
            if resp.data:
                return resp.data[0]["id"]

            def _insert():
                row = {"nome": nome or "Desconhecido"}
                if cnpj:
                    row["cnpj"] = cnpj
                return self.client.table("fornecedores").insert(row).execute()
            resp = await self._run(_insert)
            if resp.data:
                return resp.data[0]["id"]
        except Exception as e:
            logger.error(f"Erro ao buscar/criar fornecedor: {e}")
        return None

    # ===== DOCUMENTOS =====

    async def adicionar_documento(self, documento: Dict) -> Dict:
        """
        Insere documento + parcelas no Supabase.
        documento esperado (formato interno do bot):
          ID, Data, Tipo, Fornecedor, CNPJ_Fornecedor, Valor, Status,
          Vencimento, Observacoes, parcelas (lista opcional)
        """
        empresa_id = await self.obter_empresa_id()
        if not empresa_id:
            raise RuntimeError("Nenhuma empresa cadastrada no Supabase.")

        fornecedor_id = await self.buscar_ou_criar_fornecedor(
            documento.get("Fornecedor", "Desconhecido"),
            documento.get("CNPJ_Fornecedor") or None,
        )

        tipo_raw = (documento.get("Tipo") or "OUTRO").upper()
        tipo_map = {"NFE": "nota_fiscal", "BOLETO": "boleto", "PEDIDO": "pedido"}
        tipo_db = tipo_map.get(tipo_raw, "nota_fiscal")

        status_raw = (documento.get("Status") or "PENDENTE").lower()
        status_map = {"pendente": "pendente", "pago": "pago", "cancelado": "cancelado", "provisionado": "provisionado"}
        status_db = status_map.get(status_raw, "pendente")

        numero_doc = documento.get("ID") or documento.get("numero_doc") or "SEM-NUMERO"

        doc_db = {
            "empresa_id": empresa_id,
            "tipo": tipo_db,
            "numero_doc": str(numero_doc),
            "status": status_db,
            "valor": documento.get("Valor") or 0,
            "descricao": documento.get("Observacoes"),
            "fornecedor_nome": documento.get("Fornecedor"),
        }
        if fornecedor_id:
            doc_db["fornecedor_id"] = fornecedor_id
        if documento.get("Vencimento"):
            doc_db["vencimento"] = documento["Vencimento"]

        doc_db = {k: v for k, v in doc_db.items() if v is not None}

        def _insert():
            return self.client.table("documentos").insert(doc_db).execute()

        resp = await self._run(_insert)
        if not resp.data:
            raise RuntimeError("Insert de documento não retornou dados.")

        doc_inserido = resp.data[0]
        doc_uuid = doc_inserido["id"]

        # Inserir parcelas se houver
        parcelas = documento.get("parcelas", [])
        if parcelas and len(parcelas) > 1:
            await self._inserir_parcelas(doc_uuid, parcelas)
        elif documento.get("Vencimento"):
            # Parcela única
            await self._inserir_parcelas(doc_uuid, [{
                "vencimento": documento["Vencimento"],
                "valor": documento.get("Valor") or 0,
            }])

        logger.info(f"Documento inserido no Supabase: {doc_uuid} ({numero_doc})")
        return doc_inserido

    async def _inserir_parcelas(self, documento_id: str, parcelas: List[Dict]):
        rows = []
        for i, p in enumerate(parcelas, 1):
            row = {
                "documento_id": documento_id,
                "numero": i,
                "vencimento": p.get("vencimento") or p.get("Vencimento"),
                "valor": float(p.get("valor") or p.get("Valor") or 0),
                "status": "pendente",
            }
            if row["vencimento"]:
                rows.append(row)

        if not rows:
            return

        def _insert():
            return self.client.table("parcelas").insert(rows).execute()
        await self._run(_insert)

    async def buscar_documentos(self, filtro: Optional[Dict] = None) -> List[Dict]:
        try:
            def _query():
                query = self.client.table("documentos").select("*, fornecedores(nome, cnpj)")
                if filtro:
                    for campo, valor in filtro.items():
                        if isinstance(valor, dict):
                            if "$gte" in valor:
                                query = query.gte(campo, valor["$gte"])
                            if "$lte" in valor:
                                query = query.lte(campo, valor["$lte"])
                            if "$ne" in valor:
                                query = query.neq(campo, valor["$ne"])
                        else:
                            query = query.eq(campo, valor)
                return query.order("criado_em", desc=True).execute()
            resp = await self._run(_query)
            return [self._formatar_doc(d) for d in (resp.data or [])]
        except Exception as e:
            logger.error(f"Erro ao buscar documentos: {e}")
            return []

    async def buscar_documentos_por_termo(self, termo: str) -> List[Dict]:
        try:
            termo_safe = termo.replace('%', '').replace(',', ' ').strip()
            if not termo_safe:
                return []

            def _query():
                filtros = (
                    f"numero_doc.ilike.%{termo_safe}%,"
                    f"fornecedor_nome.ilike.%{termo_safe}%,"
                    f"descricao.ilike.%{termo_safe}%,"
                    f"status.ilike.%{termo_safe}%"
                )
                return (
                    self.client.table("documentos")
                    .select("*, fornecedores(nome, cnpj)")
                    .or_(filtros)
                    .execute()
                )
            resp = await self._run(_query)
            return [self._formatar_doc(d) for d in (resp.data or [])]
        except Exception as e:
            logger.error(f"Erro ao buscar por termo: {e}")
            return []

    async def buscar_vencimentos_proximos(self, dias: int = 7) -> List[Dict]:
        from datetime import date, timedelta
        hoje = date.today().strftime("%Y-%m-%d")
        limite = (date.today() + timedelta(days=dias)).strftime("%Y-%m-%d")
        try:
            def _query():
                return (
                    self.client.table("parcelas")
                    .select("*, documentos(numero_doc, fornecedor_nome, valor, status)")
                    .gte("vencimento", hoje)
                    .lte("vencimento", limite)
                    .neq("status", "pago")
                    .execute()
                )
            resp = await self._run(_query)
            result = []
            for p in (resp.data or []):
                doc = p.get("documentos") or {}
                result.append({
                    "ID": p.get("id"),
                    "Fornecedor": doc.get("fornecedor_nome", "Desconhecido"),
                    "Valor": float(p.get("valor") or 0),
                    "Vencimento": p.get("vencimento"),
                    "Status": p.get("status", "pendente").upper(),
                    "NumeroDoc": doc.get("numero_doc"),
                })
            return result
        except Exception as e:
            logger.error(f"Erro ao buscar vencimentos: {e}")
            return []

    async def atualizar_documento(self, documento_id: str, dados: Dict) -> Dict:
        try:
            dados_db = {}
            campo_map = {
                "Status": "status", "Vencimento": "vencimento",
                "Valor": "valor", "Observacoes": "descricao",
            }
            for k, v in dados.items():
                campo_db = campo_map.get(k, k.lower())
                dados_db[campo_db] = v

            def _update():
                return self.client.table("documentos").update(dados_db).eq("id", documento_id).execute()
            resp = await self._run(_update)
            return resp.data[0] if resp.data else {}
        except Exception as e:
            logger.error(f"Erro ao atualizar documento {documento_id}: {e}")
            raise

    async def obter_estatisticas(self) -> Dict:
        try:
            def _total():
                return self.client.table("documentos").select("id", count="exact").execute()

            def _pagos():
                return self.client.table("documentos").select("valor").eq("status", "pago").execute()

            def _pendentes():
                return self.client.table("documentos").select("valor").neq("status", "pago").execute()

            total_resp, pagos_resp, pendentes_resp = await asyncio.gather(
                self._run(_total), self._run(_pagos), self._run(_pendentes)
            )

            return {
                "total_documentos": total_resp.count or 0,
                "total_pago": sum(float(d.get("valor") or 0) for d in (pagos_resp.data or [])),
                "total_pendente": sum(float(d.get("valor") or 0) for d in (pendentes_resp.data or [])),
                "documentos_pendentes": len(pendentes_resp.data or []),
            }
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return {}

    def adicionar_cartao_lancamento(
        self,
        cartao_id: str,
        descricao: str,
        valor: float,
        data_compra: str,
        competencia: str,
        parcela_atual: int = 1,
        parcela_total: int = 1,
        documento_id: Optional[str] = None,
    ) -> Optional[Dict]:
        """
        Registra um lançamento de cartão. Stub reservado para integração futura do bot
        com compras identificadas por foto da tela/fatura. Hoje a criação principal
        ocorre pelo web app (Fase 2).

        Args:
            cartao_id: UUID do cartão em public.cartoes.
            descricao: texto curto do que foi comprado.
            valor: valor da parcela (não o total da compra).
            data_compra: 'YYYY-MM-DD'.
            competencia: 'YYYY-MM-DD' do vencimento da fatura em que esta parcela cai.
            parcela_atual / parcela_total: 1/1 para compras à vista.
            documento_id: opcional — vincula a um documento pai, se existir.

        Returns:
            Dict com o registro inserido, ou None em caso de falha.
        """
        try:
            payload = {
                "cartao_id": cartao_id,
                "documento_id": documento_id,
                "descricao": descricao,
                "valor": valor,
                "data_compra": data_compra,
                "competencia": competencia,
                "parcela_atual": parcela_atual,
                "parcela_total": parcela_total,
            }
            resp = self.client.table("cartao_lancamentos").insert(payload).execute()
            if resp.data:
                logger.info(
                    f"Lancamento de cartao criado: cartao={cartao_id} valor={valor} "
                    f"parcela={parcela_atual}/{parcela_total}"
                )
                return resp.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao adicionar lancamento de cartao: {e}")
            return None

    def _formatar_doc(self, d: Dict) -> Dict:
        forn = d.get("fornecedores") or {}
        return {
            "ID": d.get("id"),
            "NumeroDoc": d.get("numero_doc"),
            "Data": d.get("criado_em", "")[:10] if d.get("criado_em") else "",
            "Tipo": d.get("tipo", "").upper(),
            "Fornecedor": d.get("fornecedor_nome") or forn.get("nome") or "Desconhecido",
            "CNPJ_Fornecedor": forn.get("cnpj"),
            "Valor": float(d.get("valor") or 0),
            "Status": (d.get("status") or "pendente").upper(),
            "Vencimento": d.get("vencimento"),
            "Observacoes": d.get("descricao"),
        }


# Instância global
supabase_api = SupabaseAPI()
