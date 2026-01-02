# Análise Completa: Modelo Conceitual de Escalas

**Data:** 04/01/2025  
**Objetivo:** Analisar estado atual vs. modelo esperado e propor correções estruturais

---

## 📋 Sumário Executivo

Esta análise identifica divergências conceituais críticas entre o modelo atual e o modelo esperado, e propõe correções estruturais no banco de dados antes da implementação do calendário.

**Conclusão Principal:** O modelo atual trata cada registro de escala como uma alocação individual de profissional, quando deveria tratar "Escala" como um container contínuo do setor, com períodos mensais versionados e alocações de profissionais dentro desses períodos.

---

## 🔍 ETAPA 1: Análise Profunda do Estado Atual

### 1.1 Schema do Banco de Dados Atual

#### Tabela `escalas` (Estado Atual)

```sql
CREATE TABLE public.escalas (
    id UUID PRIMARY KEY,
    setor_id UUID NOT NULL REFERENCES setores(id),
    profissional_id UUID NOT NULL REFERENCES profissionais(id),  -- ⚠️ PROBLEMA
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho' 
        CHECK (status IN ('rascunho', 'publicado', 'cancelado')),  -- ⚠️ PROBLEMA
    turno TEXT,
    publicado_em TIMESTAMPTZ,
    publicado_por UUID REFERENCES auth.users(id),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (data_fim > data_inicio)
);
```

**Análise do Schema Atual:**

1. **Relação Direta com Profissional:**
   - ❌ `profissional_id` está diretamente na tabela `escalas`
   - ❌ Cada registro = uma alocação de profissional
   - ❌ Não há separação entre "Escala" (container) e "Alocação" (profissional dentro da escala)

2. **Falta de Container de Escala:**
   - ❌ Não existe entidade "Escala" como container do setor
   - ❌ Cada registro representa diretamente uma alocação de profissional em um período

3. **Status no Registro Individual:**
   - ❌ `status` está em cada registro de alocação
   - ❌ Não há estado por período mensal
   - ❌ Não há versionamento de períodos

4. **Ausência de Períodos:**
   - ❌ Não existe tabela de períodos mensais
   - ❌ Não há versionamento de períodos
   - ❌ Não há estado (pré-escala/publicada) por período

### 1.2 Estrutura de Dados no Código

#### Tipo TypeScript Atual

```typescript
export type Escala = {
  id: string
  setor_id: string
  profissional_id: string  // ⚠️ PROBLEMA: profissional está na escala
  data_inicio: string
  data_fim: string
  observacoes: string | null
  status: EscalaStatus  // ⚠️ PROBLEMA: status por alocação
  turno: EscalaTurno | null
  publicado_em: string | null
  publicado_por: string | null
  created_by: string
  created_at: string
  updated_at: string
}
```

#### Uso no Código

**Criação de Escala:**
```typescript
// lib/actions/escalas.ts - criarEscala()
await supabase.from('escalas').insert({
  setor_id: validated.setor_id,
  profissional_id: validated.profissional_id,  // ⚠️ Alocação direta
  data_inicio: validated.data_inicio,
  data_fim: validated.data_fim,
  status: 'rascunho'  // ⚠️ Status por alocação
})
```

**Problema Conceitual:**
- Cada chamada de `criarEscala()` cria uma alocação individual
- Não há conceito de "Escala do Setor para o Mês X"
- Não há agrupamento lógico de alocações por período

### 1.3 Fluxo Atual de Uso

**Como funciona hoje:**
1. Coordenador cria uma "escala" = cria uma alocação de profissional
2. Cada alocação tem seu próprio status (rascunho/publicado)
3. Não há agrupamento por período mensal
4. Não há versionamento

**Exemplo do Problema:**
```
Setor: UTI
Mês: Janeiro/2025

Hoje (ERRADO):
- escala_1: profissional_id=A, data_inicio=01/01, status=rascunho
- escala_2: profissional_id=B, data_inicio=02/01, status=rascunho
- escala_3: profissional_id=A, data_inicio=15/01, status=publicado

Problemas:
- Não há "Escala do Setor UTI para Janeiro/2025"
- Cada alocação tem status independente
- Não há como publicar o mês inteiro de uma vez
- Não há como ter versões diferentes do mesmo mês
```

---

## 🎯 ETAPA 2: Análise de GAP (Estado Atual vs. Modelo Esperado)

### 2.1 Modelo Esperado (Referência Final)

#### Conceitos Fundamentais

1. **Escala (Container):**
   - Pertence a um SETOR
   - É contínua (não tem início/fim)
   - Representa a escala do setor ao longo do tempo

2. **Período (Materialização Mensal):**
   - Cada Escala tem períodos mensais (ex.: Janeiro/2025)
   - Cada período é versionado
   - Cada período tem estado: pré-escala ou publicada

3. **Alocação (Profissional dentro do Período):**
   - Profissionais são alocados dentro de um período específico
   - Cada alocação tem: profissional, data/hora, turno, observações
   - Alocações pertencem a um período, não diretamente à escala

#### Estrutura Esperada

```
Escala (setor_id)
  └── Período (mes/ano, versão, estado)
      ├── Alocação 1 (profissional_id, data_inicio, data_fim)
      ├── Alocação 2 (profissional_id, data_inicio, data_fim)
      └── Alocação N (profissional_id, data_inicio, data_fim)
```

### 2.2 Comparação Detalhada

| Aspecto | Estado Atual | Modelo Esperado | Status |
|---------|--------------|-----------------|--------|
| **Escala pertence a** | Setor + Profissional | Apenas Setor | ❌ ERRADO |
| **Profissional está** | Diretamente na escala | Alocado dentro do período | ❌ ERRADO |
| **Container de Escala** | Não existe | Existe (tabela `escalas`) | ❌ AUSENTE |
| **Períodos Mensais** | Não existe | Existe (tabela `escala_periodos`) | ❌ AUSENTE |
| **Versionamento** | Não existe | Existe (versão por período) | ❌ AUSENTE |
| **Estado (pré/publicada)** | Por alocação | Por período | ❌ ERRADO |
| **Alocações** | Não existe | Existe (tabela `escala_alocacoes`) | ❌ AUSENTE |

### 2.3 Divergências Conceituais Críticas

#### ❌ DIVERGÊNCIA 1: Escala não é Container

**Estado Atual:**
- Escala = registro individual de alocação
- Não há container lógico

**Esperado:**
- Escala = container contínuo do setor
- Períodos mensais dentro da escala
- Alocações dentro dos períodos

**Impacto:**
- Impossível agrupar alocações por mês
- Impossível publicar mês inteiro de uma vez
- Impossível ter versões diferentes do mesmo mês

#### ❌ DIVERGÊNCIA 2: Profissional na Escala

**Estado Atual:**
- `escalas.profissional_id` diretamente

**Esperado:**
- Profissional alocado dentro de um período específico
- Tabela separada `escala_alocacoes`

**Impacto:**
- Confusão conceitual
- Dificulta múltiplas alocações no mesmo período
- Dificulta versionamento

#### ❌ DIVERGÊNCIA 3: Status por Alocação

**Estado Atual:**
- Cada alocação tem `status` próprio

**Esperado:**
- Status está no período (pré-escala/publicada)
- Alocações dentro do período herdam o estado

**Impacto:**
- Impossível publicar mês inteiro
- Estados inconsistentes (algumas alocações publicadas, outras não)
- Dificulta visualização do calendário

#### ❌ DIVERGÊNCIA 4: Ausência de Períodos

**Estado Atual:**
- Não existe conceito de período mensal

**Esperado:**
- Períodos mensais versionados
- Cada período tem estado independente

**Impacto:**
- Impossível trabalhar com "mês de Janeiro"
- Impossível versionar períodos
- Impossível ter pré-escala e publicação por período

#### ❌ DIVERGÊNCIA 5: Ausência de Versionamento

**Estado Atual:**
- Não há versionamento

**Esperado:**
- Períodos podem ter múltiplas versões
- Versão atual vs. versões históricas

**Impacto:**
- Impossível rastrear mudanças
- Impossível reverter para versão anterior
- Perda de histórico

---

## 🔧 ETAPA 3: Proposta de Correção Estrutural

### 3.1 Novo Modelo de Dados

#### Estrutura Proposta

```
escalas (container contínuo)
  ├── id
  ├── setor_id (FK)
  └── created_at

escala_periodos (materialização mensal)
  ├── id
  ├── escala_id (FK)
  ├── mes (1-12)
  ├── ano (ex: 2025)
  ├── versao (incremental por período)
  ├── estado ('pre_escala' | 'publicada')
  ├── publicado_em
  ├── publicado_por
  └── created_at

escala_alocacoes (profissionais dentro do período)
  ├── id
  ├── periodo_id (FK)
  ├── profissional_id (FK)
  ├── data_inicio
  ├── data_fim
  ├── turno
  ├── observacoes
  └── created_at
```

### 3.2 Migração Proposta

#### Migration: Refatoração do Modelo de Escalas

**Estratégia:**
1. Criar novas tabelas (`escalas`, `escala_periodos`, `escala_alocacoes`)
2. Migrar dados existentes
3. Manter tabela antiga temporariamente (renomear para `escalas_old`)
4. Atualizar código para usar novo modelo
5. Remover tabela antiga após validação

**Passos:**

1. **Criar novas tabelas**
2. **Migrar dados existentes** (mapear para novo modelo)
3. **Atualizar constraints e índices**
4. **Criar funções helper**
5. **Atualizar RLS policies**

### 3.3 Detalhamento das Tabelas

#### Tabela: `escalas`

```sql
CREATE TABLE public.escalas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Uma escala por setor (constraint única)
    CONSTRAINT escalas_setor_unique UNIQUE (setor_id)
);

-- Índices
CREATE INDEX idx_escalas_setor ON public.escalas(setor_id);
```

**Propósito:**
- Container contínuo da escala do setor
- Uma escala por setor (relação 1:1)

#### Tabela: `escala_periodos`

```sql
CREATE TABLE public.escala_periodos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Índices
CREATE INDEX idx_escala_periodos_escala ON public.escala_periodos(escala_id);
CREATE INDEX idx_escala_periodos_periodo ON public.escala_periodos(escala_id, mes, ano);
CREATE INDEX idx_escala_periodos_estado ON public.escala_periodos(estado);
CREATE INDEX idx_escala_periodos_publicadas ON public.escala_periodos(estado, mes, ano) 
    WHERE estado = 'publicada';
```

**Propósito:**
- Materialização mensal da escala
- Versionamento por período
- Estado por período (pré-escala/publicada)

#### Tabela: `escala_alocacoes`

```sql
CREATE TABLE public.escala_alocacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Índices
CREATE INDEX idx_escala_alocacoes_periodo ON public.escala_alocacoes(periodo_id);
CREATE INDEX idx_escala_alocacoes_profissional ON public.escala_alocacoes(profissional_id);
CREATE INDEX idx_escala_alocacoes_data_inicio ON public.escala_alocacoes(data_inicio);
CREATE INDEX idx_escala_alocacoes_data_fim ON public.escala_alocacoes(data_fim);
```

**Propósito:**
- Alocações de profissionais dentro de um período específico
- Herda estado do período (não tem status próprio)

### 3.4 Funções Helper Necessárias

#### Função: Obter ou Criar Escala do Setor

```sql
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
```

#### Função: Obter Período Atual (Versão Ativa)

```sql
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
```

### 3.5 Migração de Dados Existentes

#### Estratégia de Migração

```sql
-- 1. Criar escalas para cada setor único
INSERT INTO public.escalas (setor_id)
SELECT DISTINCT setor_id
FROM public.escalas_old
ON CONFLICT (setor_id) DO NOTHING;

-- 2. Criar períodos baseados nas datas existentes
INSERT INTO public.escala_periodos (
    escala_id, mes, ano, versao, estado, publicado_em, publicado_por, created_by
)
SELECT 
    e.id,
    EXTRACT(MONTH FROM eo.data_inicio)::INTEGER,
    EXTRACT(YEAR FROM eo.data_inicio)::INTEGER,
    1, -- versão inicial
    CASE 
        WHEN eo.status = 'publicado' THEN 'publicada'
        ELSE 'pre_escala'
    END,
    eo.publicado_em,
    eo.publicado_por,
    eo.created_by
FROM public.escalas_old eo
JOIN public.escalas e ON e.setor_id = eo.setor_id
GROUP BY e.id, EXTRACT(MONTH FROM eo.data_inicio), EXTRACT(YEAR FROM eo.data_inicio),
         eo.status, eo.publicado_em, eo.publicado_por, eo.created_by;

-- 3. Migrar alocações
INSERT INTO public.escala_alocacoes (
    periodo_id, profissional_id, data_inicio, data_fim, turno, observacoes, created_by
)
SELECT 
    ep.id,
    eo.profissional_id,
    eo.data_inicio,
    eo.data_fim,
    eo.turno,
    eo.observacoes,
    eo.created_by
FROM public.escalas_old eo
JOIN public.escalas e ON e.setor_id = eo.setor_id
JOIN public.escala_periodos ep ON ep.escala_id = e.id
    AND EXTRACT(MONTH FROM eo.data_inicio) = ep.mes
    AND EXTRACT(YEAR FROM eo.data_inicio) = ep.ano;
```

---

## 📊 ETAPA 4: Impacto e Compatibilidade

### 4.1 Impacto no Código Existente

#### Arquivos que Precisam ser Atualizados

1. **`types/database.ts`**
   - Criar novos tipos: `Escala`, `EscalaPeriodo`, `EscalaAlocacao`
   - Remover tipo antigo `Escala`

2. **`lib/actions/escalas.ts`**
   - Refatorar todas as funções para usar novo modelo
   - Criar funções para trabalhar com períodos

3. **`lib/validations/escala.ts`**
   - Atualizar schemas de validação

4. **`components/escalas/*`**
   - Atualizar componentes para trabalhar com períodos
   - Ajustar formulários e listas

### 4.2 Compatibilidade com Dados Existentes

**Estratégia:**
- Migração preserva todos os dados existentes
- Mapeamento direto de `escalas_old` para novo modelo
- Períodos criados automaticamente baseados em `data_inicio`
- Versão inicial = 1 para todos os períodos migrados

**Riscos:**
- ⚠️ Dados duplicados em `data_inicio` podem criar múltiplos períodos
- ⚠️ Necessário agrupar por mês/ano antes de criar períodos

### 4.3 RLS (Row Level Security)

**Políticas Necessárias:**

```sql
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
```

---

## ✅ ETAPA 5: Checklist de Preparação

### 5.1 Banco de Dados

- [ ] Criar migration de refatoração
- [ ] Criar tabela `escalas` (container)
- [ ] Criar tabela `escala_periodos` (períodos mensais)
- [ ] Criar tabela `escala_alocacoes` (alocações)
- [ ] Criar funções helper
- [ ] Criar índices otimizados
- [ ] Configurar RLS policies
- [ ] Migrar dados existentes
- [ ] Validar migração

### 5.2 Código Backend

- [ ] Atualizar tipos TypeScript
- [ ] Refatorar `lib/actions/escalas.ts`
- [ ] Criar actions para períodos
- [ ] Atualizar validações
- [ ] Atualizar queries

### 5.3 Preparação Frontend

- [ ] Atualizar tipos
- [ ] Preparar estrutura para trabalhar com períodos
- [ ] **NÃO implementar calendário ainda** (aguardar validação)

---

## 🎯 Conclusão

### Estado Atual vs. Esperado

| Aspecto | Status |
|---------|--------|
| **Modelo Conceitual** | ❌ Divergente |
| **Estrutura de Dados** | ❌ Incompatível |
| **Preparação para Calendário** | ❌ Não preparado |

### Próximos Passos

1. **Criar migration de refatoração** (próxima etapa)
2. **Migrar dados existentes**
3. **Atualizar código backend**
4. **Validar novo modelo**
5. **Aguardar aprovação antes de implementar calendário**

---

**Status:** ✅ Análise completa realizada  
**Próxima ação:** Criar migration de refatoração do modelo




