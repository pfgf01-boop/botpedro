import type {
  Database,
  SubtipoExtra,
  TipoDocumento,
} from "./database.types";

export type DashboardDocumento =
  Database["public"]["Views"]["v_dashboard_documentos"]["Row"];
export type ContaPaga =
  Database["public"]["Views"]["v_contas_pagas"]["Row"];
export type Cartao = Database["public"]["Tables"]["cartoes"]["Row"];
export type CartaoLancamento =
  Database["public"]["Tables"]["cartao_lancamentos"]["Row"];
export type Parcela = Database["public"]["Tables"]["parcelas"]["Row"];
export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
export type PagamentoLista =
  Database["public"]["Tables"]["pagamento_listas"]["Row"];
export type PagamentoListaItem =
  Database["public"]["Tables"]["pagamento_lista_itens"]["Row"];

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  nota_fiscal: "Nota Fiscal",
  boleto: "Boleto",
  pedido: "Pedido",
  extra: "Extra",
  fatura_cartao: "Fatura Cartão",
};

export const SUBTIPO_EXTRA_LABEL: Record<SubtipoExtra, string> = {
  dia_a_dia: "Dia a Dia",
  urgente: "Urgente",
  sem_documento: "Sem Documento",
  compra_imediata: "Compra Imediata",
  carteira: "Carteira",
};

export type StatusDocumento =
  | "pendente"
  | "parcial"
  | "pago"
  | "vencido";

export function computeStatus(doc: DashboardDocumento): StatusDocumento {
  if (doc.is_overdue) return "vencido";
  if (doc.total_parcelas === 0) return "pendente";
  if (doc.parcelas_pagas >= doc.total_parcelas) return "pago";
  if (doc.parcelas_pagas > 0) return "parcial";
  return "pendente";
}

export const STATUS_COLOR: Record<StatusDocumento, string> = {
  pendente: "bg-slateaz-600 text-ink",
  parcial: "bg-warning-500 text-ink-inverse",
  pago: "bg-secondary-500 text-ink-inverse",
  vencido: "bg-danger-500 text-white",
};

export const STATUS_LABEL: Record<StatusDocumento, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  vencido: "Vencido",
};
