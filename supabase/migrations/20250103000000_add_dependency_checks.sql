-- Migration: Validações críticas de dependências
-- Data: 28/12/2025
-- Objetivo: Criar funções SQL para validar dependências antes de desativar registros

-- Função: Verificar se hospital possui setores ativos
CREATE OR REPLACE FUNCTION check_hospital_has_active_setores(hospital_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.setores
        WHERE setores.hospital_id = check_hospital_has_active_setores.hospital_id
        AND setores.ativo = true
    );
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se setor possui escalas ativas (futuras ou em andamento)
CREATE OR REPLACE FUNCTION check_setor_has_active_escalas(setor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.setor_id = check_setor_has_active_escalas.setor_id
        AND escalas.status = 'confirmado'
        AND escalas.data_fim >= NOW()  -- Escalas futuras ou em andamento
    );
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se grupo possui profissionais ativos
CREATE OR REPLACE FUNCTION check_grupo_has_active_profissionais(grupo_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profissionais
        WHERE profissionais.grupo_id = check_grupo_has_active_profissionais.grupo_id
        AND profissionais.ativo = true
    );
END;
$$ LANGUAGE plpgsql;

-- Função: Verificar se profissional possui escalas futuras confirmadas
CREATE OR REPLACE FUNCTION check_profissional_has_future_escalas(profissional_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.profissional_id = check_profissional_has_future_escalas.profissional_id
        AND escalas.status = 'confirmado'
        AND escalas.data_inicio > NOW()  -- Apenas escalas futuras
    );
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION check_hospital_has_active_setores(UUID) IS 
'Verifica se um hospital possui setores ativos. Retorna TRUE se houver setores ativos, FALSE caso contrário.';

COMMENT ON FUNCTION check_setor_has_active_escalas(UUID) IS 
'Verifica se um setor possui escalas confirmadas futuras ou em andamento. Retorna TRUE se houver escalas ativas, FALSE caso contrário.';

COMMENT ON FUNCTION check_grupo_has_active_profissionais(UUID) IS 
'Verifica se um grupo possui profissionais ativos. Retorna TRUE se houver profissionais ativos, FALSE caso contrário.';

COMMENT ON FUNCTION check_profissional_has_future_escalas(UUID) IS 
'Verifica se um profissional possui escalas confirmadas futuras. Retorna TRUE se houver escalas futuras, FALSE caso contrário.';




