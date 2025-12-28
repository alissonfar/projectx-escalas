-- Migration: Criação automática de profile no registro
-- Quando um usuário se registra, cria apenas o profile (sem organização)
-- O usuário criará a organização manualmente na tela

-- Função para criar profile automaticamente (sem organização)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
BEGIN
    -- Obter nome do usuário (pode vir de raw_user_meta_data ou email)
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'nome_completo',
        NEW.raw_user_meta_data->>'full_name',
        split_part(NEW.email, '@', 1)
    );
    
    -- Criar apenas o profile (sem organização ativa)
    -- O usuário criará a organização na tela após o registro
    INSERT INTO public.profiles (id, nome_completo, organizacao_ativa_id)
    VALUES (
        NEW.id,
        user_name,
        NULL  -- Sem organização ativa inicialmente
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa após criação de usuário em auth.users
-- Cria apenas o profile, sem organização
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

