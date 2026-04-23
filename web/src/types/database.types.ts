export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ─── Aliases semânticos (não vêm do gen; espelham CHECK constraints do banco) ──
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

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          acao: string
          criado_em: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          documento_id: string | null
          id: string
          telegram_msg_id: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          criado_em?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          documento_id?: string | null
          id?: string
          telegram_msg_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          criado_em?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          documento_id?: string | null
          id?: string
          telegram_msg_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      blacklist_boletos: {
        Row: {
          criado_em: string | null
          criado_por: string | null
          id: string
          motivo: string | null
          nome_sacador: string
        }
        Insert: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          motivo?: string | null
          nome_sacador: string
        }
        Update: {
          criado_em?: string | null
          criado_por?: string | null
          id?: string
          motivo?: string | null
          nome_sacador?: string
        }
        Relationships: [
          {
            foreignKeyName: "blacklist_boletos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cartao_lancamentos: {
        Row: {
          cartao_id: string
          competencia: string
          comprovante_url: string | null
          criado_em: string
          data_compra: string
          descricao: string | null
          documento_fatura_id: string | null
          id: string
          parcela_atual: number
          parcela_total: number
          telegram_file_id: string | null
          valor: number
        }
        Insert: {
          cartao_id: string
          competencia: string
          comprovante_url?: string | null
          criado_em?: string
          data_compra: string
          descricao?: string | null
          documento_fatura_id?: string | null
          id?: string
          parcela_atual?: number
          parcela_total?: number
          telegram_file_id?: string | null
          valor: number
        }
        Update: {
          cartao_id?: string
          competencia?: string
          comprovante_url?: string | null
          criado_em?: string
          data_compra?: string
          descricao?: string | null
          documento_fatura_id?: string | null
          id?: string
          parcela_atual?: number
          parcela_total?: number
          telegram_file_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "cartao_lancamentos_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartao_lancamentos_documento_fatura_id_fkey"
            columns: ["documento_fatura_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartao_lancamentos_documento_fatura_id_fkey"
            columns: ["documento_fatura_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      cartoes: {
        Row: {
          apelido: string
          ativo: boolean
          bandeira: string | null
          criado_em: string
          dia_fechamento: number | null
          dia_vencimento: number | null
          empresa_id: string
          final_4: string
          id: string
        }
        Insert: {
          apelido: string
          ativo?: boolean
          bandeira?: string | null
          criado_em?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          empresa_id: string
          final_4: string
          id?: string
        }
        Update: {
          apelido?: string
          ativo?: boolean
          bandeira?: string | null
          criado_em?: string
          dia_fechamento?: number | null
          dia_vencimento?: number | null
          empresa_id?: string
          final_4?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cartoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      dda_itens: {
        Row: {
          codigo_barras: string
          empresa_id: string
          id: string
          importado_em: string | null
          parcela_id: string | null
          sacador: string | null
          situacao: string
          valor: number
          vencimento: string
        }
        Insert: {
          codigo_barras: string
          empresa_id: string
          id?: string
          importado_em?: string | null
          parcela_id?: string | null
          sacador?: string | null
          situacao?: string
          valor: number
          vencimento: string
        }
        Update: {
          codigo_barras?: string
          empresa_id?: string
          id?: string
          importado_em?: string | null
          parcela_id?: string | null
          sacador?: string | null
          situacao?: string
          valor?: number
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "dda_itens_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dda_itens_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dda_itens_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_vencimentos_proximos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_url: string | null
          atualizado_em: string | null
          cartao_id: string | null
          chave_nfe: string | null
          codigo_barras: string | null
          competencia: string | null
          criado_em: string | null
          criado_por: string | null
          descricao: string | null
          empresa_id: string
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          instrucoes: string | null
          itens: Json | null
          juros_dia: number | null
          multa: number | null
          numero_doc: string
          pedido_vinculado: string | null
          prazo_cartorio: string | null
          status: string
          subtipo: string | null
          telegram_file_id: string | null
          tipo: string
          tipo_mime: string | null
          valor: number | null
          vencimento: string | null
        }
        Insert: {
          arquivo_url?: string | null
          atualizado_em?: string | null
          cartao_id?: string | null
          chave_nfe?: string | null
          codigo_barras?: string | null
          competencia?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          empresa_id: string
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          instrucoes?: string | null
          itens?: Json | null
          juros_dia?: number | null
          multa?: number | null
          numero_doc: string
          pedido_vinculado?: string | null
          prazo_cartorio?: string | null
          status?: string
          subtipo?: string | null
          telegram_file_id?: string | null
          tipo: string
          tipo_mime?: string | null
          valor?: number | null
          vencimento?: string | null
        }
        Update: {
          arquivo_url?: string | null
          atualizado_em?: string | null
          cartao_id?: string | null
          chave_nfe?: string | null
          codigo_barras?: string | null
          competencia?: string | null
          criado_em?: string | null
          criado_por?: string | null
          descricao?: string | null
          empresa_id?: string
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          instrucoes?: string | null
          itens?: Json | null
          juros_dia?: number | null
          multa?: number | null
          numero_doc?: string
          pedido_vinculado?: string | null
          prazo_cartorio?: string | null
          status?: string
          subtipo?: string | null
          telegram_file_id?: string | null
          tipo?: string
          tipo_mime?: string | null
          valor?: number | null
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_pedido_vinculado_fkey"
            columns: ["pedido_vinculado"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_pedido_vinculado_fkey"
            columns: ["pedido_vinculado"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          apelido: string
          cnpj: string
          id: string
          nome: string
        }
        Insert: {
          apelido: string
          cnpj: string
          id?: string
          nome: string
        }
        Update: {
          apelido?: string
          cnpj?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      extrato_linhas: {
        Row: {
          conciliado: boolean
          data: string
          descricao: string
          empresa_id: string
          id: string
          importado_em: string | null
          parcela_id: string | null
          tipo_pix: string | null
          valor: number
        }
        Insert: {
          conciliado?: boolean
          data: string
          descricao: string
          empresa_id: string
          id?: string
          importado_em?: string | null
          parcela_id?: string | null
          tipo_pix?: string | null
          valor: number
        }
        Update: {
          conciliado?: boolean
          data?: string
          descricao?: string
          empresa_id?: string
          id?: string
          importado_em?: string | null
          parcela_id?: string | null
          tipo_pix?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "extrato_linhas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_linhas_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extrato_linhas_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_vencimentos_proximos"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          blacklist: boolean
          cnpj: string | null
          criado_em: string | null
          id: string
          nome: string
        }
        Insert: {
          blacklist?: boolean
          cnpj?: string | null
          criado_em?: string | null
          id?: string
          nome: string
        }
        Update: {
          blacklist?: boolean
          cnpj?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      pagamento_lista_itens: {
        Row: {
          lista_id: string
          ordem: number
          pago: boolean
          parcela_id: string
        }
        Insert: {
          lista_id: string
          ordem?: number
          pago?: boolean
          parcela_id: string
        }
        Update: {
          lista_id?: string
          ordem?: number
          pago?: boolean
          parcela_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamento_lista_itens_lista_id_fkey"
            columns: ["lista_id"]
            isOneToOne: false
            referencedRelation: "pagamento_listas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_lista_itens_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_lista_itens_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_vencimentos_proximos"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamento_listas: {
        Row: {
          criado_em: string
          criado_por: string | null
          empresa_id: string
          id: string
          nome: string
        }
        Insert: {
          criado_em?: string
          criado_por?: string | null
          empresa_id: string
          id?: string
          nome: string
        }
        Update: {
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamento_listas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamento_listas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          documento_id: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string
          observacao: string | null
          origem: string | null
          parcela_id: string | null
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          parcela_id?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_pagamento?: string | null
          documento_id?: string | null
          empresa_id?: string | null
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          fornecedor_nome?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          parcela_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_vencimentos_proximos"
            referencedColumns: ["id"]
          },
        ]
      }
      parcelas: {
        Row: {
          baixado_em: string | null
          baixado_por: string | null
          data_pagamento: string | null
          documento_id: string
          id: string
          juros_pago: number | null
          multa_paga: number | null
          numero: number
          status: string
          valor: number
          valor_pago: number | null
          vencimento: string
        }
        Insert: {
          baixado_em?: string | null
          baixado_por?: string | null
          data_pagamento?: string | null
          documento_id: string
          id?: string
          juros_pago?: number | null
          multa_paga?: number | null
          numero?: number
          status?: string
          valor: number
          valor_pago?: number | null
          vencimento: string
        }
        Update: {
          baixado_em?: string | null
          baixado_por?: string | null
          data_pagamento?: string | null
          documento_id?: string
          id?: string
          juros_pago?: number | null
          multa_paga?: number | null
          numero?: number
          status?: string
          valor?: number
          valor_pago?: number | null
          vencimento?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcelas_baixado_por_fkey"
            columns: ["baixado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parcelas_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          ativo: boolean
          auth_user_id: string | null
          criado_em: string | null
          empresa_id: string | null
          id: string
          nome: string
          perfil: string
          telegram_id: string
        }
        Insert: {
          ativo?: boolean
          auth_user_id?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          nome: string
          perfil: string
          telegram_id: string
        }
        Update: {
          ativo?: boolean
          auth_user_id?: string | null
          criado_em?: string | null
          empresa_id?: string | null
          id?: string
          nome?: string
          perfil?: string
          telegram_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_contas_pagas: {
        Row: {
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          data_pagamento: string | null
          documento_id: string | null
          documento_numero: string | null
          documento_tipo: string | null
          empresa_id: string | null
          forma_pagamento: string | null
          fornecedor_cnpj: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string | null
          is_avulso: boolean | null
          mes_competencia: string | null
          observacao: string | null
          origem: string | null
          parcela_id: string | null
          valor: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "v_dashboard_documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "parcelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_parcela_id_fkey"
            columns: ["parcela_id"]
            isOneToOne: false
            referencedRelation: "vw_vencimentos_proximos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_dashboard_documentos: {
        Row: {
          cartao_id: string | null
          competencia: string | null
          created_at: string | null
          data_emissao: string | null
          empresa_id: string | null
          fornecedor_id: string | null
          fornecedor_nome: string | null
          id: string | null
          is_extra: boolean | null
          is_fatura_cartao: boolean | null
          is_overdue: boolean | null
          numero: string | null
          observacao: string | null
          origem: string | null
          parcelas_pagas: number | null
          proximo_vencimento: string | null
          subtipo: string | null
          tipo: string | null
          total_parcelas: number | null
          valor_pago: number | null
          valor_pendente: number | null
          valor_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cartao_id_fkey"
            columns: ["cartao_id"]
            isOneToOne: false
            referencedRelation: "cartoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_pagamentos_por_dia: {
        Row: {
          data_pagamento: string | null
          empresa: string | null
          qtd_parcelas: number | null
          total_pago: number | null
        }
        Relationships: []
      }
      vw_vencimentos_proximos: {
        Row: {
          empresa: string | null
          fornecedor: string | null
          id: string | null
          numero_doc: string | null
          status: string | null
          tipo: string | null
          valor: number | null
          vencimento: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_empresa_id: { Args: never; Returns: string }
      auth_user_ativo: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
