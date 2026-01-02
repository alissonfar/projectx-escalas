-- Migration: Refatoração do Modelo de Escalas
-- Data: 05/01/2025
-- Objetivo: Criar novo modelo de escalas para suportar períodos mensais versionados
--
-- Mudanças Conceituais:
-- 1. Escala é container contínuo do setor (não mais alocação individual)
-- 2. Períodos mensais versionados (ex.: Janeiro/2025, versão 1, 2, etc.)
-- 3. Alocações de profissionais dentro dos períodos
-- 4. Estado (pré-escala/publicada) por período, não por alocação
--
-- Nota: Esta migration cria o novo modelo do zero (desenvolvimento).
-- Se houver tabela escalas antiga, ela será removida e substituída.

-- ============================================================================
-- PASSO 1: Remover tabela antiga se existir (desenvolvimento)
-- ============================================================================

DROP TABLE IF EXISTS public.escala_alocacoes CASCADE;
DROP TABLE IF EXISTS public.escala_periodos CASCADE;
DROP TABLE IF EXISTS public.escalas CASCADE;

-- ============================================================================
-- PASSO 2: Criar nova tabela escalas (container contínuo)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escalas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uma escala por setor (relação 1:1)
    CONSTRAINT escalas_setor_unique UNIQUE (setor_id)
);

-- Comentários
COMMENT ON TABLE public.escalas IS 
'Container contínuo da escala de um setor. Representa a escala do setor ao longo do tempo.';

COMMENT ON COLUMN public.escalas.setor_id IS 
'Setor ao qual esta escala pertence. Relação 1:1 (um setor tem uma escala contínua).';

-- Índices
CREATE INDEX IF NOT EXISTS idx_escalas_setor ON public.escalas(setor_id);

-- ============================================================================
-- PASSO 3: Criar tabela escala_periodos (materialização mensal)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escala_periodos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escala_id UUID NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    ano INTEGER NOT NULL CHECK (ano >= 2020 AND ano <= 2100),
    versao INTEGER NOT NULL DEFAULT 1,
    estado TEXT NOT NULL DEFAULT 'pre_escala' 
        CHECK (estado IN ('pre_escala', 'publicada')),
    publicado_em TIMESTAMPTZ,
    publicado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Versão única por período (escala + mês + ano + versão)
    CONSTRAINT escala_periodos_unique UNIQUE (escala_id, mes, ano, versao)
);

-- Comentários
COMMENT ON TABLE public.escala_periodos IS 
'Materialização mensal da escala. Cada período representa um mês específico (ex.: Janeiro/2025) com versionamento.';

COMMENT ON COLUMN public.escala_periodos.escala_id IS 
'Escala à qual este período pertence.';

COMMENT ON COLUMN public.escala_periodos.mes IS 
'Mês do período (1-12).';

COMMENT ON COLUMN public.escala_periodos.ano IS 
'Ano do período (ex.: 2025).';

COMMENT ON COLUMN public.escala_periodos.versao IS 
'Versão do período. Permite múltiplas versões do mesmo mês (ex.: versão 1, 2, etc.).';

COMMENT ON COLUMN public.escala_periodos.estado IS 
'Estado do período: pre_escala (em edição) ou publicada (oficial).';

-- Índices
CREATE INDEX IF NOT EXISTS idx_escala_periodos_escala ON public.escala_periodos(escala_id);
CREATE INDEX IF NOT EXISTS idx_escala_periodos_periodo ON public.escala_periodos(escala_id, mes, ano);
CREATE INDEX IF NOT EXISTS idx_escala_periodos_estado ON public.escala_periodos(estado);
CREATE INDEX IF NOT EXISTS idx_escala_periodos_publicadas 
    ON public.escala_periodos(estado, mes, ano) 
    WHERE estado = 'publicada';
CREATE INDEX IF NOT EXISTS idx_escala_periodos_versao ON public.escala_periodos(escala_id, mes, ano, versao);

-- ============================================================================
-- PASSO 4: Criar tabela escala_alocacoes (profissionais dentro do período)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.escala_alocacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    periodo_id UUID NOT NULL REFERENCES public.escala_periodos(id) ON DELETE CASCADE,
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    turno TEXT CHECK (turno IN ('manha', 'tarde', 'noite', 'integral')),
    observacoes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Validação: data_fim deve ser posterior a data_inicio
    CHECK (data_fim > data_inicio)
);

-- Comentários
COMMENT ON TABLE public.escala_alocacoes IS 
'Alocações de profissionais dentro de um período específico. Cada alocação representa um profissional escalado em um horário específico.';

COMMENT ON COLUMN public.escala_alocacoes.periodo_id IS 
'Período ao qual esta alocação pertence. Herda o estado do período (não tem status próprio).';

COMMENT ON COLUMN public.escala_alocacoes.profissional_id IS 
'Profissional alocado nesta escala.';

COMMENT ON COLUMN public.escala_alocacoes.turno IS 
'Turno da alocação: manha, tarde, noite ou integral. Pode ser inferido automaticamente.';

-- Índices
CREATE INDEX IF NOT EXISTS idx_escala_alocacoes_periodo ON public.escala_alocacoes(periodo_id);
CREATE INDEX IF NOT EXISTS idx_escala_alocacoes_profissional ON public.escala_alocacoes(profissional_id);
CREATE INDEX IF NOT EXISTS idx_escala_alocacoes_data_inicio ON public.escala_alocacoes(data_inicio);
CREATE INDEX IF NOT EXISTS idx_escala_alocacoes_data_fim ON public.escala_alocacoes(data_fim);
CREATE INDEX IF NOT EXISTS idx_escala_alocacoes_periodo_profissional 
    ON public.escala_alocacoes(periodo_id, profissional_id);

-- ============================================================================
-- PASSO 5: Criar função para obter ou criar escala do setor
-- ============================================================================

CREATE OR REPLACE FUNCTION obter_ou_criar_escala_setor(setor_uuid UUID)
RETURNS UUID AS $$
DECLARE
    escala_uuid UUID;
BEGIN
    -- Tentar obter escala existente
    SELECT id INTO escala_uuid
    FROM public.escalas
    WHERE setor_id = setor_uuid;
    
    -- Se não existir, criar
    IF escala_uuid IS NULL THEN
        INSERT INTO public.escalas (setor_id)
        VALUES (setor_uuid)
        RETURNING id INTO escala_uuid;
    END IF;
    
    RETURN escala_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_ou_criar_escala_setor(UUID) IS 
'Obtém a escala de um setor, criando-a se não existir. Retorna o UUID da escala.';

-- ============================================================================
-- PASSO 6: Criar função para obter período atual (versão mais recente)
-- ============================================================================

CREATE OR REPLACE FUNCTION obter_periodo_atual(
    escala_uuid UUID,
    mes_num INTEGER,
    ano_num INTEGER
)
RETURNS UUID AS $$
DECLARE
    periodo_uuid UUID;
BEGIN
    -- Buscar versão mais recente do período
    SELECT id INTO periodo_uuid
    FROM public.escala_periodos
    WHERE escala_id = escala_uuid
      AND mes = mes_num
      AND ano = ano_num
    ORDER BY versao DESC
    LIMIT 1;
    
    RETURN periodo_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obter_periodo_atual(UUID, INTEGER, INTEGER) IS 
'Obtém o período atual (versão mais recente) de uma escala para um mês/ano específico. Retorna NULL se não existir.';

-- ============================================================================
-- PASSO 7: Criar função para criar novo período ou nova versão
-- ============================================================================

CREATE OR REPLACE FUNCTION criar_ou_nova_versao_periodo(
    escala_uuid UUID,
    mes_num INTEGER,
    ano_num INTEGER,
    estado_periodo TEXT DEFAULT 'pre_escala',
    usuario_uuid UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    periodo_uuid UUID;
    proxima_versao INTEGER;
BEGIN
    -- Verificar se já existe período
    SELECT id, versao INTO periodo_uuid, proxima_versao
    FROM public.escala_periodos
    WHERE escala_id = escala_uuid
      AND mes = mes_num
      AND ano = ano_num
    ORDER BY versao DESC
    LIMIT 1;
    
    -- Se não existir, criar versão 1
    IF periodo_uuid IS NULL THEN
        INSERT INTO public.escala_periodos (
            escala_id, mes, ano, versao, estado, created_by
        )
        VALUES (
            escala_uuid, mes_num, ano_num, 1, estado_periodo, usuario_uuid
        )
        RETURNING id INTO periodo_uuid;
    ELSE
        -- Se existir e estiver publicada, criar nova versão
        IF estado_periodo = 'pre_escala' THEN
            -- Buscar próxima versão
            SELECT COALESCE(MAX(versao), 0) + 1 INTO proxima_versao
            FROM public.escala_periodos
            WHERE escala_id = escala_uuid
              AND mes = mes_num
              AND ano = ano_num;
            
            INSERT INTO public.escala_periodos (
                escala_id, mes, ano, versao, estado, created_by
            )
            VALUES (
                escala_uuid, mes_num, ano_num, proxima_versao, estado_periodo, usuario_uuid
            )
            RETURNING id INTO periodo_uuid;
        ELSE
            -- Se já existe e queremos publicar, usar período existente
            -- (não criar nova versão ao publicar)
            RETURN periodo_uuid;
        END IF;
    END IF;
    
    RETURN periodo_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION criar_ou_nova_versao_periodo(UUID, INTEGER, INTEGER, TEXT, UUID) IS 
'Cria um novo período ou uma nova versão do período existente. Se o período já existe e está publicada, cria nova versão para edição.';

-- ============================================================================
-- PASSO 8: Criar função para inferir turno (reutilizar da migration anterior)
-- ============================================================================

CREATE OR REPLACE FUNCTION inferir_turno_alocacao(data_inicio TIMESTAMPTZ, data_fim TIMESTAMPTZ)
RETURNS TEXT AS $$
DECLARE
    hora_inicio INTEGER;
    duracao_horas NUMERIC;
BEGIN
    hora_inicio := EXTRACT(HOUR FROM data_inicio);
    duracao_horas := EXTRACT(EPOCH FROM (data_fim - data_inicio)) / 3600;
    
    IF duracao_horas >= 12 THEN
        RETURN 'integral';
    END IF;
    
    IF hora_inicio >= 6 AND hora_inicio < 12 THEN
        RETURN 'manha';
    ELSIF hora_inicio >= 12 AND hora_inicio < 18 THEN
        RETURN 'tarde';
    ELSE
        RETURN 'noite';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger para popular turno automaticamente
CREATE OR REPLACE FUNCTION atualizar_turno_alocacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.turno IS NULL THEN
        NEW.turno := inferir_turno_alocacao(NEW.data_inicio, NEW.data_fim);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_turno_alocacao
    BEFORE INSERT OR UPDATE OF data_inicio, data_fim ON public.escala_alocacoes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_turno_alocacao();

-- ============================================================================
-- PASSO 9: Trigger para atualizar updated_at
-- ============================================================================

CREATE TRIGGER update_escalas_updated_at 
    BEFORE UPDATE ON public.escalas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escala_periodos_updated_at 
    BEFORE UPDATE ON public.escala_periodos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escala_alocacoes_updated_at 
    BEFORE UPDATE ON public.escala_alocacoes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PASSO 10: (Removido - não há migração de dados em desenvolvimento)
-- ============================================================================

-- ============================================================================
-- PASSO 11: Habilitar RLS nas novas tabelas
-- ============================================================================

ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escala_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escala_alocacoes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 12: Criar políticas RLS
-- ============================================================================

-- Escalas: usuário vê escalas de setores da organização ativa
CREATE POLICY "Users can view escalas from own organizations"
    ON public.escalas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.setores
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE setores.id = escalas.setor_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

CREATE POLICY "Users can manage escalas from own organizations"
    ON public.escalas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.setores
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE setores.id = escalas.setor_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

-- Períodos: herda da escala
CREATE POLICY "Users can view periods from own organizations"
    ON public.escala_periodos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.escalas
            JOIN public.setores ON setores.id = escalas.setor_id
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE escalas.id = escala_periodos.escala_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

CREATE POLICY "Users can manage periods from own organizations"
    ON public.escala_periodos FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.escalas
            JOIN public.setores ON setores.id = escalas.setor_id
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE escalas.id = escala_periodos.escala_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

-- Alocações: herda do período
CREATE POLICY "Users can view allocations from own organizations"
    ON public.escala_alocacoes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.escala_periodos
            JOIN public.escalas ON escalas.id = escala_periodos.escala_id
            JOIN public.setores ON setores.id = escalas.setor_id
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE escala_periodos.id = escala_alocacoes.periodo_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

CREATE POLICY "Users can manage allocations from own organizations"
    ON public.escala_alocacoes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.escala_periodos
            JOIN public.escalas ON escalas.id = escala_periodos.escala_id
            JOIN public.setores ON setores.id = escalas.setor_id
            JOIN public.hospitais ON hospitais.id = setores.hospital_id
            WHERE escala_periodos.id = escala_alocacoes.periodo_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

-- ============================================================================
-- PASSO 13: Atualizar função de verificação de escalas ativas
-- ============================================================================

-- Atualizar função para verificar escalas ativas (agora verifica períodos publicados)
CREATE OR REPLACE FUNCTION check_setor_has_active_escalas(setor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.escala_alocacoes ea
        JOIN public.escala_periodos ep ON ep.id = ea.periodo_id
        JOIN public.escalas e ON e.id = ep.escala_id
        WHERE e.setor_id = check_setor_has_active_escalas.setor_id
        AND ep.estado = 'publicada'
        AND ea.data_fim >= NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- Atualizar função para profissionais
CREATE OR REPLACE FUNCTION check_profissional_has_future_escalas(profissional_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.escala_alocacoes ea
        JOIN public.escala_periodos ep ON ep.id = ea.periodo_id
        WHERE ea.profissional_id = check_profissional_has_future_escalas.profissional_id
        AND ep.estado = 'publicada'
        AND ea.data_inicio > NOW()
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE public.escalas IS 
'Container contínuo da escala de um setor. Uma escala por setor. Períodos mensais são criados dentro desta escala.';

COMMENT ON TABLE public.escala_periodos IS 
'Materialização mensal da escala com versionamento. Cada período representa um mês específico e pode ter múltiplas versões.';

COMMENT ON TABLE public.escala_alocacoes IS 
'Alocações de profissionais dentro de um período específico. Herda o estado do período (não tem status próprio).';

