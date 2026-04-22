// Tipos do banco — espelha o schema público após as migrations da Fase 2.
// Mantenha em sincronia caso novas migrations sejam aplicadas.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoDocumento =
  | "nota_fiscal"
  | "boleto"
  | "pedido"
  | "extra"
  | "fatura_cartao";

export type SubtipoExtra =
  | "dia_a_dia"
  | "urgente"
  | "sem_documento"
  | "compra_imediata"
  | "carteira";

export type OrigemPagamento = "bot" | "web" | "extrato" | "manual";

export type StatusParcela = "pendente" | "pago" | "atrasado";

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          cnpj?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
        Relationships: [];
      };
      usuarios: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string | null;
          email: string | null;
          role: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          empresa_id: string;
          nome?: string | null;
          email?: string | null;
          role?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Insert"]>;
        Relationships: [];
      };
      fornecedores: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          cnpj: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          cnpj?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fornecedores"]["Insert"]>;
        Relationships: [];
      };
      documentos: {
        Row: {
          id: string;
          empresa_id: string;
          fornecedor_id: string | null;
          tipo: TipoDocumento;
          subtipo: SubtipoExtra | null;
          numero: string | null;
          valor_total: number | null;
          data_emissao: string | null;
          competencia: string | null;
          cartao_id: string | null;
          observacao: string | null;
          origem: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          fornecedor_id?: string | null;
          tipo: TipoDocumento;
          subtipo?: SubtipoExtra | null;
          numero?: string | null;
          valor_total?: number | null;
          data_emissao?: string | null;
          competencia?: string | null;
          cartao_id?: string | null;
          observacao?: string | null;
          origem?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos"]["Insert"]>;
        Relationships: [];
      };
      parcelas: {
        Row: {
          id: string;
          documento_id: string;
          numero: number;
          valor: number;
          vencimento: string;
          status: StatusParcela;
          data_pagamento: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          documento_id: string;
          numero: number;
          valor: number;
          vencimento: string;
          status?: StatusParcela;
          data_pagamento?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parcelas"]["Insert"]>;
        Relationships: [];
      };
      cartoes: {
        Row: {
          id: string;
          empresa_id: string;
          apelido: string;
          bandeira: string | null;
          final_4: string;
          dia_fechamento: number;
          dia_vencimento: number;
          limite: number | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          apelido: string;
          bandeira?: string | null;
          final_4: string;
          dia_fechamento: number;
          dia_vencimento: number;
          limite?: number | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cartoes"]["Insert"]>;
        Relationships: [];
      };
      cartao_lancamentos: {
        Row: {
          id: string;
          cartao_id: string;
          documento_id: string | null;
          descricao: string;
          valor: number;
          data_compra: string;
          competencia: string;
          parcela_atual: number;
          parcela_total: number;
          fatura_documento_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cartao_id: string;
          documento_id?: string | null;
          descricao: string;
          valor: number;
          data_compra: string;
          competencia: string;
          parcela_atual?: number;
          parcela_total?: number;
          fatura_documento_id?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["cartao_lancamentos"]["Insert"]
        >;
        Relationships: [];
      };
      pagamentos: {
        Row: {
          id: string;
          empresa_id: string;
          parcela_id: string | null;
          documento_id: string | null;
          fornecedor_id: string | null;
          fornecedor_nome: string | null;
          valor: number;
          data_pagamento: string;
          forma_pagamento: string | null;
          categoria: string | null;
          observacao: string | null;
          origem: OrigemPagamento;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          parcela_id?: string | null;
          documento_id?: string | null;
          fornecedor_id?: string | null;
          fornecedor_nome?: string | null;
          valor: number;
          data_pagamento: string;
          forma_pagamento?: string | null;
          categoria?: string | null;
          observacao?: string | null;
          origem?: OrigemPagamento;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Insert"]>;
        Relationships: [];
      };
      pagamento_listas: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          semana_inicio: string;
          semana_fim: string;
          status: string;
          total: number | null;
          criado_por: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          semana_inicio: string;
          semana_fim: string;
          status?: string;
          total?: number | null;
          criado_por?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["pagamento_listas"]["Insert"]
        >;
        Relationships: [];
      };
      pagamento_lista_itens: {
        Row: {
          id: string;
          lista_id: string;
          parcela_id: string | null;
          descricao: string | null;
          valor: number;
          marcado: boolean;
          ordem: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lista_id: string;
          parcela_id?: string | null;
          descricao?: string | null;
          valor: number;
          marcado?: boolean;
          ordem?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["pagamento_lista_itens"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: {
      v_dashboard_documentos: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: TipoDocumento;
          subtipo: SubtipoExtra | null;
          numero: string | null;
          valor_total: number | null;
          data_emissao: string | null;
          competencia: string | null;
          cartao_id: string | null;
          observacao: string | null;
          origem: string | null;
          created_at: string;
          fornecedor_id: string | null;
          fornecedor_nome: string | null;
          total_parcelas: number;
          parcelas_pagas: number;
          valor_pago: number;
          valor_pendente: number;
          proximo_vencimento: string | null;
          is_overdue: boolean;
          is_extra: boolean;
          is_fatura_cartao: boolean;
        };
        Relationships: [];
      };
      v_contas_pagas: {
        Row: {
          id: string;
          empresa_id: string;
          data_pagamento: string;
          valor: number;
          forma_pagamento: string | null;
          categoria: string | null;
          observacao: string | null;
          origem: OrigemPagamento;
          documento_id: string | null;
          parcela_id: string | null;
          fornecedor_id: string | null;
          fornecedor_nome: string | null;
          documento_tipo: TipoDocumento | null;
          documento_numero: string | null;
          is_avulso: boolean;
          mes_competencia: string | null;
          created_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      auth_empresa_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
