-- Migration: Adicionar campos adicionais à tabela profissionais
-- Data: 2025-01-06
-- Descrição: Adiciona campos para telefone2, data_nascimento, profissao, crefito e uf_crefito

-- ============================================================================
-- ADICIONAR CAMPOS À TABELA PROFISSIONAIS
-- ============================================================================

-- Telefone 2 (opcional)
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS telefone2 TEXT;

-- Data de nascimento (obrigatório)
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS data_nascimento DATE;

-- Profissão (obrigatório)
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS profissao TEXT;

-- CREFITO (obrigatório para fisioterapeutas, pode ser null para outras profissões)
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS crefito TEXT;

-- UF do CREFITO (obrigatório para fisioterapeutas, pode ser null para outras profissões)
ALTER TABLE public.profissionais
ADD COLUMN IF NOT EXISTS uf_crefito TEXT;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON COLUMN public.profissionais.telefone2 IS 
'Telefone secundário do profissional (opcional)';

COMMENT ON COLUMN public.profissionais.data_nascimento IS 
'Data de nascimento do profissional (obrigatório)';

COMMENT ON COLUMN public.profissionais.profissao IS 
'Profissão do profissional (ex: fisioterapeuta, enfermeiro, médico). Controla quais campos adicionais são obrigatórios.';

COMMENT ON COLUMN public.profissionais.crefito IS 
'Número do CREFITO (apenas para fisioterapeutas). Formato: 123456-F';

COMMENT ON COLUMN public.profissionais.uf_crefito IS 
'UF do CREFITO (apenas para fisioterapeutas). Sigla de 2 letras (ex: SP, RJ)';

-- ============================================================================
-- ÍNDICES (se necessário para buscas futuras)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profissionais_profissao 
ON public.profissionais(profissao);

CREATE INDEX IF NOT EXISTS idx_profissionais_crefito 
ON public.profissionais(crefito) 
WHERE crefito IS NOT NULL;

