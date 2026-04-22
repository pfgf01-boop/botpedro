-- Migration 001: Adiciona coluna fornecedor_nome à tabela documentos
-- Corrige bug onde o nome do fornecedor não era persistido em coluna dedicada,
-- ficando apenas misturado em 'observacoes'. Necessário para buscas e relatórios.
--
-- Executar no SQL Editor do Supabase antes de subir o bot v2.2.

ALTER TABLE public.documentos
    ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT;

CREATE INDEX IF NOT EXISTS idx_documentos_fornecedor_nome
    ON public.documentos (fornecedor_nome);

CREATE INDEX IF NOT EXISTS idx_documentos_vencimento_status
    ON public.documentos (vencimento, status);

-- Backfill (opcional): se documentos antigos tiverem o nome no início de 'observacoes'
-- após "Motor: xxx | ", ajuste conforme seu padrão de dados. Deixamos comentado:
-- UPDATE public.documentos
-- SET fornecedor_nome = split_part(observacoes, '|', 2)
-- WHERE fornecedor_nome IS NULL AND observacoes LIKE 'Motor:%';
