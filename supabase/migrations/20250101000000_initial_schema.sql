-- Migration inicial baseada no PRD
-- Cria todas as tabelas do modelo de dados

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela: organizacoes
CREATE TABLE IF NOT EXISTS public.organizacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    criado_por UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: hospitals
CREATE TABLE IF NOT EXISTS public.hospitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: grupos
-- Grupos pertencem à organização, não ao hospital
-- Permite que profissionais de um grupo trabalhem em qualquer hospital da organização
CREATE TABLE IF NOT EXISTS public.grupos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: setores
CREATE TABLE IF NOT EXISTS public.setores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitais(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: profissionais
CREATE TABLE IF NOT EXISTS public.profissionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    telefone TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: escalas
CREATE TABLE IF NOT EXISTS public.escalas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
    profissional_id UUID NOT NULL REFERENCES public.profissionais(id) ON DELETE CASCADE,
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'cancelado')),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Validação: data_fim deve ser posterior a data_inicio
    CHECK (data_fim > data_inicio)
);

-- Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    organizacao_ativa_id UUID REFERENCES public.organizacoes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_hospitais_organizacao ON public.hospitais(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_grupos_organizacao ON public.grupos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_setores_hospital ON public.setores(hospital_id);
CREATE INDEX IF NOT EXISTS idx_profissionais_grupo ON public.profissionais(grupo_id);
CREATE INDEX IF NOT EXISTS idx_escalas_setor ON public.escalas(setor_id);
CREATE INDEX IF NOT EXISTS idx_escalas_profissional ON public.escalas(profissional_id);
CREATE INDEX IF NOT EXISTS idx_escalas_data_inicio ON public.escalas(data_inicio);
CREATE INDEX IF NOT EXISTS idx_escalas_data_fim ON public.escalas(data_fim);
CREATE INDEX IF NOT EXISTS idx_escalas_status ON public.escalas(status);

-- Função para validar email único por organização
CREATE OR REPLACE FUNCTION check_email_unique_in_org()
RETURNS TRIGGER AS $$
DECLARE
    org_id UUID;
    existing_count INTEGER;
BEGIN
    -- Obter organização diretamente do grupo
    SELECT grupos.organizacao_id INTO org_id
    FROM public.grupos
    WHERE grupos.id = NEW.grupo_id;
    
    -- Verificar se já existe outro profissional com mesmo email na mesma organização
    SELECT COUNT(*) INTO existing_count
    FROM public.profissionais
    JOIN public.grupos ON grupos.id = profissionais.grupo_id
    WHERE profissionais.email = NEW.email
      AND grupos.organizacao_id = org_id
      AND (TG_OP = 'INSERT' OR profissionais.id != NEW.id)
      AND profissionais.ativo = true;
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'Email já cadastrado nesta organização';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para validar email único por organização
CREATE TRIGGER check_profissional_email_unique
    BEFORE INSERT OR UPDATE ON public.profissionais
    FOR EACH ROW
    EXECUTE FUNCTION check_email_unique_in_org();

-- Trigger para atualizar updated_at em escalas
CREATE TRIGGER update_escalas_updated_at 
    BEFORE UPDATE ON public.escalas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para validar que organização ativa pertence ao usuário
CREATE OR REPLACE FUNCTION validate_organizacao_ativa()
RETURNS TRIGGER AS $$
BEGIN
    -- Se organizacao_ativa_id for NULL, permite (para desativar organização)
    IF NEW.organizacao_ativa_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Verificar se a organização pertence ao usuário
    IF NOT EXISTS (
        SELECT 1 FROM public.organizacoes
        WHERE id = NEW.organizacao_ativa_id
        AND criado_por = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Organização não pertence ao usuário';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar organização ativa antes de atualizar profile
CREATE TRIGGER validate_org_ativa_before_update
    BEFORE UPDATE OF organizacao_ativa_id ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION validate_organizacao_ativa();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profissionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Função helper para obter organização ativa do usuário
CREATE OR REPLACE FUNCTION get_user_active_org_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organizacao_ativa_id
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS básicas (serão refinadas conforme necessário)
-- Organizações: usuário só vê suas próprias organizações
-- IMPORTANTE: A política de INSERT permite criar organização mesmo sem organização ativa
-- Isso é necessário para o fluxo: criar conta -> criar organização na tela -> definir como ativa
CREATE POLICY "Users can view own organizations"
    ON public.organizacoes FOR SELECT
    USING (auth.uid() = criado_por);

CREATE POLICY "Users can create own organizations"
    ON public.organizacoes FOR INSERT
    WITH CHECK (auth.uid() = criado_por);
    -- Nota: Não verifica organização ativa para permitir criação inicial

CREATE POLICY "Users can update own organizations"
    ON public.organizacoes FOR UPDATE
    USING (auth.uid() = criado_por);

-- Hospitais: usuário só vê hospitais da organização ativa
CREATE POLICY "Users can view hospitals from own organizations"
    ON public.hospitais FOR SELECT
    USING (organizacao_id = get_user_active_org_id());

CREATE POLICY "Users can manage hospitals from own organizations"
    ON public.hospitais FOR ALL
    USING (organizacao_id = get_user_active_org_id());

-- Grupos: pertencem diretamente à organização
CREATE POLICY "Users can view grupos from own organizations"
    ON public.grupos FOR SELECT
    USING (organizacao_id = get_user_active_org_id());

CREATE POLICY "Users can manage grupos from own organizations"
    ON public.grupos FOR ALL
    USING (organizacao_id = get_user_active_org_id());

-- Setores: seguem a mesma lógica dos hospitais
CREATE POLICY "Users can view setores from own organizations"
    ON public.setores FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.hospitais
            WHERE hospitais.id = setores.hospital_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

CREATE POLICY "Users can manage setores from own organizations"
    ON public.setores FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.hospitais
            WHERE hospitais.id = setores.hospital_id
            AND hospitais.organizacao_id = get_user_active_org_id()
        )
    );

-- Profissionais: pertencem à organização através do grupo
CREATE POLICY "Users can view profissionais from own organizations"
    ON public.profissionais FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grupos
            WHERE grupos.id = profissionais.grupo_id
            AND grupos.organizacao_id = get_user_active_org_id()
        )
    );

CREATE POLICY "Users can manage profissionais from own organizations"
    ON public.profissionais FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.grupos
            WHERE grupos.id = profissionais.grupo_id
            AND grupos.organizacao_id = get_user_active_org_id()
        )
    );

-- Escalas: seguem a mesma lógica
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

-- Profiles: usuário só vê e gerencia seu próprio profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

