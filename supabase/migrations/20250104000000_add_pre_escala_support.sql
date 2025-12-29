-- Migration: Suporte para Pré-Escala e Publicação
-- Data: 04/01/2025
-- Objetivo: Adicionar suporte para rascunho/publicação de escalas e campo de turno
--
-- Mudanças:
-- 1. Expandir status para incluir 'rascunho' e 'publicado' (substituindo 'confirmado')
-- 2. Adicionar campos publicado_em e publicado_por
-- 3. Adicionar campo turno
-- 4. Migrar dados existentes (confirmado → publicado)
-- 5. Criar função para inferir turno automaticamente

-- ============================================================================
-- PASSO 1: Remover constraint antiga de status
-- ============================================================================
ALTER TABLE public.escalas 
DROP CONSTRAINT IF EXISTS escalas_status_check;

-- ============================================================================
-- PASSO 2: Adicionar novos campos
-- ============================================================================

-- Campo para data de publicação
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS publicado_em TIMESTAMPTZ;

-- Campo para quem publicou
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS publicado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Campo para turno (manhã, tarde, noite, integral)
ALTER TABLE public.escalas 
ADD COLUMN IF NOT EXISTS turno TEXT;

-- ============================================================================
-- PASSO 3: Migrar dados existentes
-- ============================================================================

-- Migrar escalas com status='confirmado' para status='publicado'
-- Preencher publicado_em com created_at e publicado_por com created_by
UPDATE public.escalas
SET 
    status = 'publicado',
    publicado_em = created_at,
    publicado_por = created_by
WHERE status = 'confirmado';

-- ============================================================================
-- PASSO 4: Criar função para inferir turno baseado no horário
-- ============================================================================

CREATE OR REPLACE FUNCTION inferir_turno(data_inicio TIMESTAMPTZ, data_fim TIMESTAMPTZ)
RETURNS TEXT AS $$
DECLARE
    hora_inicio INTEGER;
    hora_fim INTEGER;
    duracao_horas NUMERIC;
BEGIN
    -- Extrair hora do início
    hora_inicio := EXTRACT(HOUR FROM data_inicio);
    
    -- Calcular duração em horas
    duracao_horas := EXTRACT(EPOCH FROM (data_fim - data_inicio)) / 3600;
    
    -- Se a duração for maior que 12 horas, considerar integral
    IF duracao_horas >= 12 THEN
        RETURN 'integral';
    END IF;
    
    -- Determinar turno baseado na hora de início
    -- Manhã: 06:00 - 12:00
    -- Tarde: 12:00 - 18:00
    -- Noite: 18:00 - 06:00 (próximo dia)
    
    IF hora_inicio >= 6 AND hora_inicio < 12 THEN
        RETURN 'manha';
    ELSIF hora_inicio >= 12 AND hora_inicio < 18 THEN
        RETURN 'tarde';
    ELSE
        -- Noite: 18:00 - 06:00 (pode cruzar meia-noite)
        RETURN 'noite';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentário da função
COMMENT ON FUNCTION inferir_turno(TIMESTAMPTZ, TIMESTAMPTZ) IS 
'Infere o turno de uma escala baseado na hora de início e duração. Retorna: manha, tarde, noite ou integral.';

-- ============================================================================
-- PASSO 5: Popular campo turno para escalas existentes
-- ============================================================================

UPDATE public.escalas
SET turno = inferir_turno(data_inicio, data_fim)
WHERE turno IS NULL;

-- ============================================================================
-- PASSO 6: Criar trigger para popular turno automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION atualizar_turno_escala()
RETURNS TRIGGER AS $$
BEGIN
    -- Se turno não foi definido manualmente, inferir automaticamente
    IF NEW.turno IS NULL THEN
        NEW.turno := inferir_turno(NEW.data_inicio, NEW.data_fim);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para popular turno antes de inserir ou atualizar
CREATE TRIGGER trigger_atualizar_turno_escala
    BEFORE INSERT OR UPDATE OF data_inicio, data_fim ON public.escalas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_turno_escala();

-- ============================================================================
-- PASSO 7: Adicionar nova constraint de status
-- ============================================================================

ALTER TABLE public.escalas 
ADD CONSTRAINT escalas_status_check 
CHECK (status IN ('rascunho', 'publicado', 'cancelado'));

-- Alterar default para 'rascunho' (novas escalas começam como rascunho)
ALTER TABLE public.escalas 
ALTER COLUMN status SET DEFAULT 'rascunho';

-- ============================================================================
-- PASSO 8: Adicionar constraint para validar publicação
-- ============================================================================

-- Se status = 'publicado', então publicado_em e publicado_por devem estar preenchidos
CREATE OR REPLACE FUNCTION validar_publicacao_escala()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'publicado' THEN
        -- Se está sendo publicado agora e não tem publicado_em, preencher automaticamente
        IF NEW.publicado_em IS NULL THEN
            NEW.publicado_em := NOW();
        END IF;
        
        -- Se não tem publicado_por, usar created_by ou auth.uid()
        IF NEW.publicado_por IS NULL THEN
            NEW.publicado_por := COALESCE(NEW.created_by, auth.uid());
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar publicação antes de inserir ou atualizar
CREATE TRIGGER trigger_validar_publicacao_escala
    BEFORE INSERT OR UPDATE OF status ON public.escalas
    FOR EACH ROW
    EXECUTE FUNCTION validar_publicacao_escala();

-- ============================================================================
-- PASSO 9: Adicionar índices para performance
-- ============================================================================

-- Índice para filtrar por estado de publicação
CREATE INDEX IF NOT EXISTS idx_escalas_status ON public.escalas(status);

-- Índice para filtrar por turno
CREATE INDEX IF NOT EXISTS idx_escalas_turno ON public.escalas(turno);

-- Índice composto para buscar escalas publicadas por período
CREATE INDEX IF NOT EXISTS idx_escalas_publicadas_periodo 
ON public.escalas(status, data_inicio, data_fim) 
WHERE status = 'publicado';

-- Índice composto para buscar rascunhos por criador
CREATE INDEX IF NOT EXISTS idx_escalas_rascunhos_criador 
ON public.escalas(status, created_by) 
WHERE status = 'rascunho';

-- ============================================================================
-- PASSO 10: Atualizar função de verificação de escalas ativas
-- ============================================================================

-- Atualizar função existente para considerar apenas escalas publicadas
CREATE OR REPLACE FUNCTION check_setor_has_active_escalas(setor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.setor_id = check_setor_has_active_escalas.setor_id
        AND escalas.status = 'publicado'  -- Apenas escalas publicadas
        AND escalas.data_fim >= NOW()  -- Escalas futuras ou em andamento
    );
END;
$$ LANGUAGE plpgsql;

-- Atualizar função para profissionais
CREATE OR REPLACE FUNCTION check_profissional_has_future_escalas(profissional_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.profissional_id = check_profissional_has_future_escalas.profissional_id
        AND escalas.status = 'publicado'  -- Apenas escalas publicadas
        AND escalas.data_inicio > NOW()  -- Apenas escalas futuras
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON COLUMN public.escalas.status IS 
'Estado da escala: rascunho (em edição), publicado (visível para profissionais), cancelado (cancelada)';

COMMENT ON COLUMN public.escalas.publicado_em IS 
'Data e hora em que a escala foi publicada. NULL se ainda está em rascunho.';

COMMENT ON COLUMN public.escalas.publicado_por IS 
'ID do usuário que publicou a escala. NULL se ainda está em rascunho.';

COMMENT ON COLUMN public.escalas.turno IS 
'Turno da escala: manha (06:00-12:00), tarde (12:00-18:00), noite (18:00-06:00), integral (>=12h). Inferido automaticamente se não especificado.';

