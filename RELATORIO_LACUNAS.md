# 📋 RELATÓRIO DE LACUNAS - CRUDs DO SISTEMA

**Data:** 28 de Dezembro de 2025  
**Objetivo:** Documentar todas as informações faltantes que impactam a implementação dos CRUDs

---

## 🚨 LACUNAS CRÍTICAS (Bloqueiam ou Comprometem Funcionalidade)

### **LACUNA H1: Validação de Dependências - Hospitais**

**O que está faltando:**
- Função SQL que verifica se um hospital possui setores ativos antes de permitir desativação

**Por que é necessário:**
- Evitar inconsistências: hospital desativado com setores ativos
- Prevenir escalas órfãs (setores sem hospital válido)
- Manter integridade referencial lógica

**Impacto direto:**
- **CRUD Hospitais:** Botão "Desativar" pode quebrar relacionamentos
- **CRUD Setores:** Setores podem ficar sem hospital válido
- **CRUD Escalas:** Escalas podem referenciar setores de hospital desativado

**Solução proposta:**
```sql
-- Migration: 20250103000000_add_dependency_checks.sql

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

-- Uso no frontend/backend:
-- Antes de desativar hospital, verificar:
-- SELECT check_hospital_has_active_setores('hospital-id');
-- Se retornar TRUE, impedir desativação e mostrar erro
```

**Prioridade:** 🔴 **ALTA** - Deve ser implementada antes do CRUD de Hospitais

---

### **LACUNA S1: Validação de Dependências - Setores**

**O que está faltando:**
- Função SQL que verifica se um setor possui escalas ativas antes de permitir desativação

**Por que é necessário:**
- Evitar escalas órfãs (escalas sem setor válido)
- Manter histórico de escalas válido
- Prevenir inconsistências de dados

**Impacto direto:**
- **CRUD Setores:** Botão "Desativar" pode quebrar relacionamentos
- **CRUD Escalas:** Escalas podem referenciar setor desativado
- **Visualização:** Calendário pode mostrar escalas inválidas

**Solução proposta:**
```sql
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
```

**Prioridade:** 🔴 **ALTA** - Deve ser implementada antes do CRUD de Setores

---

### **LACUNA G1: Validação de Valores para Campo `tipo` em Grupos**

**O que está faltando:**
- Enum, constraint ou validação que define valores permitidos para `grupos.tipo`
- Atualmente é TEXT livre, permitindo qualquer valor

**Por que é necessário:**
- Consistência de dados (evitar "Médico", "médico", "Medico")
- Facilita filtros e agrupamentos
- Melhora UX (select com opções pré-definidas)

**Impacto direto:**
- **CRUD Grupos:** Campo `tipo` pode ter valores inconsistentes
- **Filtros:** Agrupamento por tipo pode não funcionar corretamente
- **Relatórios:** Dados podem estar duplicados por inconsistência

**Solução proposta (3 opções):**

**Opção A: ENUM no PostgreSQL** (Mais rígido)
```sql
CREATE TYPE tipo_grupo_enum AS ENUM (
    'Médico',
    'Enfermeiro',
    'Fisioterapeuta',
    'Técnico de Enfermagem',
    'Outro'
);

ALTER TABLE grupos 
ALTER COLUMN tipo TYPE tipo_grupo_enum USING tipo::tipo_grupo_enum;
```

**Opção B: Tabela `tipos_grupo`** (Mais flexível)
```sql
CREATE TABLE tipos_grupo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL UNIQUE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE grupos 
ADD COLUMN tipo_id UUID REFERENCES tipos_grupo(id);
```

**Opção C: Validação apenas no Frontend** (Mais simples, sem alterar schema)
```typescript
// lib/constants.ts
export const TIPOS_GRUPO_PERMITIDOS = [
  'Médico',
  'Enfermeiro',
  'Fisioterapeuta',
  'Técnico de Enfermagem',
  'Outro'
] as const;

// Atualizar grupoSchema para validar
export const grupoSchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(TIPOS_GRUPO_PERMITIDOS),  // Validação
  organizacao_id: z.string().uuid()
});
```

**Recomendação:** **Opção C** (validação frontend) - Não altera schema, mais flexível

**Prioridade:** 🟡 **MÉDIA** - Pode ser implementada durante o CRUD de Grupos

---

### **LACUNA G2: Validação de Dependências - Grupos**

**O que está faltando:**
- Função SQL que verifica se um grupo possui profissionais ativos antes de permitir desativação

**Por que é necessário:**
- Evitar profissionais órfãos (profissionais sem grupo válido)
- Manter integridade referencial
- Prevenir inconsistências

**Impacto direto:**
- **CRUD Grupos:** Botão "Desativar" pode quebrar relacionamentos
- **CRUD Profissionais:** Profissionais podem ficar sem grupo válido
- **CRUD Escalas:** Escalas podem referenciar profissional sem grupo válido

**Solução proposta:**
```sql
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
```

**Prioridade:** 🔴 **ALTA** - Deve ser implementada antes do CRUD de Grupos

---

### **LACUNA P3: Validação de Dependências - Profissionais**

**O que está faltando:**
- Função SQL que verifica se um profissional possui escalas futuras antes de permitir desativação

**Por que é necessário:**
- Evitar escalas futuras sem profissional válido
- Manter compromissos futuros válidos
- Prevenir inconsistências operacionais

**Impacto direto:**
- **CRUD Profissionais:** Botão "Desativar" pode quebrar escalas futuras
- **CRUD Escalas:** Escalas futuras podem referenciar profissional desativado
- **Operacional:** Escalas agendadas podem ficar inválidas

**Solução proposta:**
```sql
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
```

**Prioridade:** 🔴 **ALTA** - Deve ser implementada antes do CRUD de Profissionais

---

### **LACUNA E1: Integração de Validação de Conflitos de Horário**

**O que está faltando:**
- Integração da função `getEscalasProfissionalPeriodo()` no formulário de escalas
- Interface visual para mostrar alertas de conflito
- Decisão do usuário (salvar mesmo assim ou cancelar)

**Por que é necessário:**
- Função já existe mas não está sendo usada
- Usuário precisa ser alertado sobre sobreposições
- Melhora UX e previne erros

**Impacto direto:**
- **CRUD Escalas:** Usuário pode criar escalas sobrepostas sem saber
- **Operacional:** Profissional pode ter dois plantões no mesmo horário
- **UX:** Falta de feedback visual sobre conflitos

**Solução proposta:**
```typescript
// components/escalas/EscalaForm.tsx

// No handleSubmit, antes de salvar:
const conflitos = await getEscalasProfissionalPeriodo(
  formData.profissional_id,
  formData.data_inicio,
  formData.data_fim
);

if (conflitos.length > 0) {
  // Mostrar modal de confirmação
  setConflitosDetectados(conflitos);
  setShowConflictDialog(true);
  return; // Não salva ainda
}

// Se usuário confirmar, salva mesmo assim
```

**Prioridade:** 🟡 **MÉDIA** - Pode ser implementada durante o CRUD de Escalas

---

## ⚠️ LACUNAS IMPORTANTES (Melhoram UX mas Não Bloqueiam)

### **LACUNA S2: Validação ao Transferir Setor Entre Hospitais**

**O que está faltando:**
- Validação explícita que garante hospital de destino pertence à mesma organização
- RLS já previne, mas validação explícita melhora feedback ao usuário

**Impacto:** Médio - RLS já protege, mas UX pode ser melhorada

**Solução:** Validação no frontend antes de submit

---

### **LACUNA P4: Validação ao Transferir Profissional Entre Grupos**

**O que está faltando:**
- Validação explícita que garante grupo de destino pertence à mesma organização

**Impacto:** Médio - RLS já protege, mas UX pode ser melhorada

**Solução:** Validação no frontend antes de submit

---

### **LACUNA E2: Regra de Negócio para Cancelamento de Escalas Passadas**

**O que está faltando:**
- Regra definida: pode ou não cancelar escalas já executadas?

**Impacto:** Médio - Comportamento indefinido

**Solução proposta:**
- **Opção A:** Não pode cancelar escalas com `data_inicio < NOW()`
- **Opção B:** Pode cancelar mas com confirmação especial
- **Opção C:** Pode cancelar qualquer escala

**Recomendação:** Opção A (não pode cancelar passadas)

---

### **LACUNA E3: Interface de Data/Hora**

**O que está faltando:**
- Componente DateTimePicker adequado para TIMESTAMPTZ
- Atualmente campo é TIMESTAMPTZ único, precisa de interface amigável

**Impacto:** Médio - UX pode ser melhorada

**Solução:** Criar componente `DateTimePicker` ou usar biblioteca (ex: react-datepicker)

---

### **LACUNA E5: Validação de Duração Mínima/Máxima**

**O que está faltando:**
- Validação que impede escalas muito curtas (< 1 hora) ou muito longas (> 24 horas)

**Impacto:** Baixo - Validação de negócio opcional

**Solução:** Adicionar ao `escalaSchema`:
```typescript
.refine((data) => {
  const duracao = new Date(data.data_fim).getTime() - new Date(data.data_inicio).getTime();
  const horas = duracao / (1000 * 60 * 60);
  return horas >= 1 && horas <= 24;
}, {
  message: 'Escala deve ter entre 1 e 24 horas de duração',
  path: ['data_fim']
})
```

---

## 📊 RESUMO PRIORIZADO

### **🔴 ALTA PRIORIDADE (Implementar Antes dos CRUDs)**

1. ✅ **H1** - Validação dependências Hospitais
2. ✅ **S1** - Validação dependências Setores  
3. ✅ **G2** - Validação dependências Grupos
4. ✅ **P3** - Validação dependências Profissionais

**Total:** 4 validações críticas

### **🟡 MÉDIA PRIORIDADE (Implementar Durante os CRUDs)**

1. ✅ **G1** - Validação tipo de grupo (Opção C - frontend)
2. ✅ **E1** - Integração validação conflitos
3. ✅ **S2** - Validação transferência setor
4. ✅ **P4** - Validação transferência profissional
5. ✅ **E2** - Regra cancelamento escalas passadas
6. ✅ **E3** - Interface data/hora

**Total:** 6 melhorias importantes

### **🟢 BAIXA PRIORIDADE (Opcional)**

1. ✅ **H2, S3, G3** - Campos descrição (opcional)
2. ✅ **P1, P2** - Validações formato (já valida frontend)
3. ✅ **P5** - Campo CPF (opcional)
4. ✅ **E4** - Histórico alterações (opcional)
5. ✅ **E5** - Validação duração (opcional)

**Total:** 9 melhorias opcionais

---

## 🎯 PLANO DE IMPLEMENTAÇÃO DAS LACUNAS

### **ETAPA 1: Validações Críticas (ANTES de implementar CRUDs)**

**Arquivo:** `supabase/migrations/20250103000000_add_dependency_checks.sql`

```sql
-- Funções de validação de dependências
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

CREATE OR REPLACE FUNCTION check_setor_has_active_escalas(setor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.setor_id = check_setor_has_active_escalas.setor_id
        AND escalas.status = 'confirmado'
        AND escalas.data_fim >= NOW()
    );
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION check_profissional_has_future_escalas(profissional_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.escalas
        WHERE escalas.profissional_id = check_profissional_has_future_escalas.profissional_id
        AND escalas.status = 'confirmado'
        AND escalas.data_inicio > NOW()
    );
END;
$$ LANGUAGE plpgsql;
```

**Helper TypeScript:** `lib/utils/validations.ts`
```typescript
export async function canDeactivateHospital(hospitalId: string): Promise<{ can: boolean; reason?: string }> {
  // Chamar função SQL e retornar resultado
}

// Similar para setores, grupos, profissionais
```

---

### **ETAPA 2: Validação de Tipo de Grupo (Durante CRUD Grupos)**

**Arquivo:** `lib/constants.ts`
```typescript
export const TIPOS_GRUPO_PERMITIDOS = [
  'Médico',
  'Enfermeiro',
  'Fisioterapeuta',
  'Técnico de Enfermagem',
  'Outro'
] as const;

export type TipoGrupo = typeof TIPOS_GRUPO_PERMITIDOS[number];
```

**Atualizar:** `lib/validations/grupo.ts`
```typescript
import { TIPOS_GRUPO_PERMITIDOS } from '@/lib/constants'

export const grupoSchema = z.object({
  nome: z.string().min(1, 'Nome do grupo é obrigatório'),
  tipo: z.enum(TIPOS_GRUPO_PERMITIDOS, {
    errorMap: () => ({ message: 'Tipo inválido' })
  }),
  organizacao_id: z.string().uuid('Organização é obrigatória'),
})
```

---

### **ETAPA 3: Integração Validação Conflitos (Durante CRUD Escalas)**

**Arquivo:** `components/escalas/EscalaForm.tsx`

Adicionar lógica de detecção e alerta de conflitos antes de salvar.

---

### **ETAPA 4: Melhorias Opcionais (Futuro)**

- Campos descrição (se necessário)
- Histórico de alterações (se necessário)
- Validações adicionais (se necessário)

---

## ✅ CHECKLIST DE VALIDAÇÃO

Antes de implementar cada CRUD, verificar:

- [ ] **Hospitais:** Função `check_hospital_has_active_setores` criada
- [ ] **Setores:** Função `check_setor_has_active_escalas` criada
- [ ] **Grupos:** Função `check_grupo_has_active_profissionais` criada + validação tipo
- [ ] **Profissionais:** Função `check_profissional_has_future_escalas` criada
- [ ] **Escalas:** Integração validação conflitos + regra cancelamento

---

**Relatório criado em:** 28/12/2025  
**Status:** ✅ Completo e pronto para validação

