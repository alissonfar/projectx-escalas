# Análise Conceitual: Fluxo de Escalas

**Data:** Janeiro 2025  
**Objetivo:** Definir fluxos, identificar lacunas estruturais e propor soluções antes da implementação

---

## 📋 Sumário Executivo

Esta análise examina a estrutura atual do sistema de escalas, identifica lacunas para suportar pré-escala/rascunho/publicação e propõe fluxos conceituais baseados nas imagens de referência.

**Status Atual:** Sistema básico de CRUD sem suporte para pré-escala, calendário visual ou estados de publicação.

**Principais Lacunas Identificadas:**
1. ❌ Ausência de estados de pré-escala (rascunho/publicado)
2. ❌ Ausência de calendário mensal visual
3. ❌ Ausência de agrupamento por setor no calendário
4. ❌ Ausência de versionamento de escalas
5. ❌ Ausência de campo de turno (manhã/tarde/noite)

---

## 🔍 1. Análise da Estrutura Atual

### 1.1 Schema do Banco de Dados

#### Tabela `escalas` (Atual)
```sql
CREATE TABLE public.escalas (
    id UUID PRIMARY KEY,
    setor_id UUID NOT NULL REFERENCES setores(id),
    profissional_id UUID NOT NULL REFERENCES profissionais(id),
    data_inicio TIMESTAMPTZ NOT NULL,
    data_fim TIMESTAMPTZ NOT NULL,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmado' 
        CHECK (status IN ('confirmado', 'cancelado')),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (data_fim > data_inicio)
);
```

**Campos Existentes:**
- ✅ `id`, `setor_id`, `profissional_id`
- ✅ `data_inicio`, `data_fim` (suporta horários)
- ✅ `observacoes`
- ✅ `status` (limitado a 'confirmado'/'cancelado')
- ✅ `created_by`, `created_at`, `updated_at`

**Campos Ausentes (Críticos):**
- ❌ **Estado de publicação:** Não há distinção entre rascunho e publicado
- ❌ **Versão da escala:** Não há suporte para versionamento
- ❌ **Turno:** Não há campo explícito para manhã/tarde/noite
- ❌ **Data de publicação:** Não há registro de quando foi publicada
- ❌ **Publicado por:** Não há registro de quem publicou

### 1.2 Funcionalidades Atuais

**O que já funciona:**
- ✅ CRUD básico de escalas (criar, editar, cancelar)
- ✅ Verificação de conflitos de horário
- ✅ Validação de profissional e setor na mesma organização
- ✅ Listagem em tabela com filtros básicos
- ✅ RLS (Row Level Security) configurado

**O que não existe:**
- ❌ Visualização em calendário mensal
- ❌ Pré-escala com rascunho
- ❌ Sistema de publicação
- ❌ Agrupamento visual por setor
- ❌ Múltiplas escalas visíveis no mesmo dia
- ❌ Filtros avançados (por grupo, profissional, setor)

### 1.3 Componentes Atuais

**Estrutura de Componentes:**
```
components/escalas/
├── EscalaForm.tsx      # Formulário modal (criar/editar)
└── EscalaList.tsx      # Lista em tabela (DataTable)
```

**Página:**
```
app/(dashboard)/escalas/page.tsx  # Renderiza EscalaList
```

**Ausências:**
- ❌ Componente de calendário mensal
- ❌ Componente de card de escala para calendário
- ❌ Componente de filtros avançados
- ❌ Componente de pré-escala/rascunho
- ❌ Overlay/modal para visualização detalhada

---

## 🎯 2. Requisitos Identificados (Baseados nas Imagens)

### 2.1 Visualização de Calendário

**Requisitos Visuais:**
- Calendário mensal ocupando grande parte da tela
- Dias do mês organizados em grade (7 colunas × ~5 linhas)
- Escalas exibidas diretamente sobre os dias
- Informações visíveis: profissional, horário, turno
- Cores diferentes por turno/tipo de escala
- Múltiplas escalas no mesmo dia (empilhadas ou lado a lado)

**Requisitos Funcionais:**
- Navegação entre meses (setas anterior/próximo)
- Visualização do mês atual destacada
- Filtros visíveis no topo (por setor, profissional, grupo)
- Botão "Replicar Semana" por setor (referência visual)

### 2.2 Sistema de Pré-Escala

**Fluxo Esperado:**
1. Coordenador cria/edita escalas gradualmente
2. Salva como rascunho (progresso preservado)
3. Retorna posteriormente para continuar edição
4. Finaliza e publica quando completo
5. Escala publicada fica visível para profissionais

**Estados Necessários:**
- **Rascunho (Draft):** Escala em edição, não visível para profissionais
- **Publicado (Published):** Escala finalizada e visível
- **Cancelado (Cancelled):** Escala cancelada (já existe)

**Ações Necessárias:**
- Salvar rascunho (salvar progresso sem publicar)
- Publicar escala (tornar visível)
- Despublicar (voltar para rascunho) - opcional
- Visualizar apenas rascunhos vs. apenas publicados

### 2.3 Filtros e Busca

**Filtros Necessários:**
- Por setor (obrigatório - referência mostra filtro por setor)
- Por profissional
- Por grupo
- Por hospital
- Por período (mês/ano)
- Por estado (rascunho/publicado)

**Busca:**
- Pesquisa por nome de profissional
- Pesquisa por setor

---

## 🚨 3. Lacunas Estruturais Identificadas

### 3.1 Banco de Dados - Tabela `escalas`

#### ❌ LACUNA 1: Estado de Publicação

**Problema:** 
O campo `status` atual só suporta 'confirmado'/'cancelado', não distingue rascunho de publicado.

**Impacto:**
- Impossível ter escalas em rascunho
- Impossível publicar/despublicar escalas
- Todas as escalas são imediatamente "confirmadas" ao criar

**Solução Necessária:**
Adicionar campo `estado_publicacao` ou expandir `status`:
```sql
-- Opção 1: Campo separado
estado_publicacao TEXT NOT NULL DEFAULT 'rascunho' 
    CHECK (estado_publicacao IN ('rascunho', 'publicado'))

-- Opção 2: Expandir status (recomendado)
status TEXT NOT NULL DEFAULT 'rascunho' 
    CHECK (status IN ('rascunho', 'publicado', 'cancelado'))
```

**Campos Adicionais Necessários:**
```sql
publicado_em TIMESTAMPTZ,           -- Quando foi publicada
publicado_por UUID REFERENCES auth.users(id),  -- Quem publicou
```

#### ❌ LACUNA 2: Versionamento

**Problema:**
Não há suporte para versionamento de escalas. Se uma escala for editada após publicação, não há histórico.

**Impacto:**
- Impossível rastrear mudanças
- Impossível reverter para versão anterior
- Perda de auditoria

**Solução Necessária (Opcional - pode ser fase 2):**
```sql
-- Tabela de versões (opcional)
CREATE TABLE escala_versoes (
    id UUID PRIMARY KEY,
    escala_id UUID REFERENCES escalas(id),
    versao INTEGER NOT NULL,
    dados JSONB NOT NULL,  -- Snapshot dos dados
    criado_por UUID REFERENCES auth.users(id),
    criado_em TIMESTAMPTZ DEFAULT NOW()
);
```

#### ❌ LACUNA 3: Turno Explícito

**Problema:**
Não há campo explícito para turno (manhã/tarde/noite). Pode ser inferido do horário, mas não é ideal.

**Impacto:**
- Dificulta filtros por turno
- Dificulta agrupamento visual
- Dificulta validações específicas por turno

**Solução Necessária:**
```sql
turno TEXT CHECK (turno IN ('manha', 'tarde', 'noite', 'integral'))
-- Ou inferir do horário via função/computed field
```

**Nota:** Pode ser inferido de `data_inicio`/`data_fim`, mas campo explícito facilita queries e validações.

#### ❌ LACUNA 4: Agrupamento por Setor no Calendário

**Problema:**
Calendário precisa mostrar escalas agrupadas por setor (linhas diferentes por setor).

**Impacto:**
- Estrutura atual não suporta visualização agrupada eficientemente
- Queries precisam ser otimizadas para agrupar por setor

**Solução Necessária:**
Não requer mudança no schema, mas requer:
- Query otimizada agrupando por setor
- Componente de calendário que renderiza linhas por setor
- Índice adicional (já existe `idx_escalas_setor`)

### 3.2 Funcionalidades Ausentes

#### ❌ LACUNA 5: Ações de Pré-Escala

**Ações Necessárias:**
- `salvarRascunho()` - Salva sem publicar
- `publicarEscala()` - Publica escala
- `despublicarEscala()` - Volta para rascunho (opcional)
- `buscarRascunhos()` - Lista apenas rascunhos
- `buscarPublicadas()` - Lista apenas publicadas

**Impacto:**
- Actions atuais não suportam esses fluxos
- UI não tem botões/controles para essas ações

#### ❌ LACUNA 6: Componentes de Calendário

**Componentes Necessários:**
- `EscalaCalendar.tsx` - Calendário mensal principal
- `EscalaCalendarDay.tsx` - Célula de dia com escalas
- `EscalaCard.tsx` - Card de escala para exibir no calendário
- `EscalaCalendarFilters.tsx` - Filtros específicos do calendário
- `EscalaReplicateWeek.tsx` - Botão/funcionalidade de replicar semana

**Impacto:**
- Impossível visualizar escalas em calendário sem esses componentes

---

## 📐 4. Fluxos Conceituais Propostos

### 4.1 Fluxo Principal: Visualização e Edição

```
┌─────────────────────────────────────────────────────────┐
│ 1. Coordenador acessa /escalas                          │
│    ↓                                                     │
│ 2. Sistema carrega calendário do mês atual              │
│    - Busca escalas publicadas + rascunhos (se autor)    │
│    - Agrupa por setor                                   │
│    ↓                                                     │
│ 3. Coordenador visualiza:                               │
│    - Calendário mensal (grade 7×5)                      │
│    - Escalas por setor (linhas diferentes)             │
│    - Informações: profissional, horário, turno          │
│    ↓                                                     │
│ 4. Coordenador pode:                                    │
│    a) Clicar em dia vazio → Criar nova escala           │
│    b) Clicar em escala existente → Editar               │
│    c) Aplicar filtros (setor, profissional, grupo)      │
│    d) Navegar entre meses                                │
│    e) Replicar semana de um setor                       │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Fluxo de Pré-Escala: Criar e Publicar

```
┌─────────────────────────────────────────────────────────┐
│ FASE 1: Criação/Edição                                  │
│ ─────────────────────────────────────────────────────── │
│ 1. Coordenador clica em dia vazio ou escala            │
│    ↓                                                     │
│ 2. Modal de formulário abre                            │
│    - Campos: setor, profissional, data/hora, turno      │
│    ↓                                                     │
│ 3. Coordenador preenche dados                          │
│    ↓                                                     │
│ 4. Coordenador clica "Salvar Rascunho"                 │
│    ↓                                                     │
│ 5. Sistema salva com status='rascunho'                 │
│    - Escala NÃO visível para profissionais             │
│    - Escala visível no calendário (indicador visual)   │
│    ↓                                                     │
│ 6. Coordenador pode continuar editando depois          │
│                                                          │
│ FASE 2: Publicação                                      │
│ ─────────────────────────────────────────────────────── │
│ 7. Coordenador finaliza todas as escalas do período    │
│    ↓                                                     │
│ 8. Coordenador seleciona escalas (ou todas)            │
│    ↓                                                     │
│ 9. Coordenador clica "Publicar Escala"                 │
│    ↓                                                     │
│ 10. Sistema atualiza status='publicado'                │
│     - Define publicado_em = NOW()                       │
│     - Define publicado_por = user.id                    │
│     - Escala torna-se visível para profissionais       │
│     ↓                                                    │
│ 11. Sistema pode enviar notificações (futuro)         │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Fluxo de Filtros

```
┌─────────────────────────────────────────────────────────┐
│ 1. Coordenador aplica filtros no topo do calendário    │
│    - Setor (dropdown)                                   │
│    - Profissional (dropdown)                            │
│    - Grupo (dropdown)                                   │
│    - Período (mês/ano)                                  │
│    - Estado (rascunho/publicado)                        │
│    ↓                                                     │
│ 2. Sistema atualiza query:                              │
│    - Filtra escalas por critérios                       │
│    - Mantém agrupamento por setor                       │
│    ↓                                                     │
│ 3. Calendário re-renderiza com dados filtrados         │
│    - Mantém estrutura de dias                          │
│    - Mostra apenas escalas que passam nos filtros      │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Fluxo de Replicação de Semana

```
┌─────────────────────────────────────────────────────────┐
│ 1. Coordenador visualiza semana com escalas            │
│    ↓                                                     │
│ 2. Coordenador clica "Replicar Semana" ao lado do setor│
│    ↓                                                     │
│ 3. Modal abre perguntando:                              │
│    - Para qual semana replicar?                         │
│    - Replicar todas as escalas ou apenas algumas?       │
│    ↓                                                     │
│ 4. Coordenador confirma                                 │
│    ↓                                                     │
│ 5. Sistema cria novas escalas:                          │
│    - Copia estrutura da semana atual                    │
│    - Ajusta datas para semana destino                   │
│    - Mantém profissionais e horários                     │
│    - Status = 'rascunho' (não publica automaticamente)  │
│    ↓                                                     │
│ 6. Calendário atualiza mostrando escalas replicadas    │
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ 5. Arquitetura de Componentes Proposta

### 5.1 Estrutura de Componentes

```
components/escalas/
├── EscalaCalendar.tsx           # Componente principal do calendário
├── EscalaCalendarHeader.tsx     # Cabeçalho (mês, navegação, filtros)
├── EscalaCalendarGrid.tsx       # Grade do calendário (dias)
├── EscalaCalendarDay.tsx        # Célula de dia individual
├── EscalaCard.tsx              # Card de escala (dentro do dia)
├── EscalaCalendarFilters.tsx    # Painel de filtros
├── EscalaReplicateWeek.tsx      # Botão/modal de replicar semana
├── EscalaForm.tsx              # Formulário (já existe, ajustar)
└── EscalaList.tsx              # Lista em tabela (já existe)
```

### 5.2 Hierarquia de Componentes

```
EscalaCalendar (Container)
├── EscalaCalendarHeader
│   ├── Navegação de mês (anterior/próximo)
│   ├── EscalaCalendarFilters
│   │   ├── Filtro por setor
│   │   ├── Filtro por profissional
│   │   ├── Filtro por grupo
│   │   └── Filtro por estado
│   └── Botão "Nova Escala"
├── EscalaCalendarGrid
│   ├── Cabeçalho de dias da semana (DOM, SEG, TER...)
│   └── Linhas por setor
│       └── EscalaCalendarDay (para cada dia)
│           ├── Número do dia
│           └── EscalaCard[] (múltiplas escalas)
│               ├── Nome do profissional
│               ├── Horário (início - fim)
│               └── Indicador de turno (cor)
└── EscalaReplicateWeek (por linha de setor)
```

### 5.3 Estados e Props

**EscalaCalendar:**
```typescript
interface EscalaCalendarProps {
  mes: number  // 1-12
  ano: number
  filtros: {
    setorId?: string
    profissionalId?: string
    grupoId?: string
    estado?: 'rascunho' | 'publicado' | 'todos'
  }
}

interface EscalaCalendarState {
  escalas: EscalaComRelacoes[]
  setores: Setor[]
  mesAtual: Date
  filtros: Filtros
}
```

**EscalaCard:**
```typescript
interface EscalaCardProps {
  escala: EscalaComRelacoes
  onClick: () => void
  isRascunho: boolean  // Para indicador visual
}
```

---

## 🔧 6. Estratégias de Implementação

### 6.1 Fase 1: Preparação do Banco de Dados

**Objetivo:** Adicionar suporte estrutural para pré-escala/publicação

**Migrations Necessárias:**

1. **Migration: Adicionar estado de publicação**
   ```sql
   -- Alterar CHECK constraint de status
   -- Adicionar campos publicado_em e publicado_por
   -- Migrar dados existentes (status='confirmado' → status='publicado')
   ```

2. **Migration: Adicionar campo turno (opcional)**
   ```sql
   -- Adicionar campo turno
   -- Criar função para inferir turno de data_inicio/data_fim
   -- Popular campo turno para escalas existentes
   ```

**Impacto:**
- ✅ Suporta rascunho/publicado
- ✅ Permite rastreamento de publicação
- ⚠️ Requer migração de dados existentes

### 6.2 Fase 2: Atualização de Actions

**Objetivo:** Adicionar ações de pré-escala

**Actions a Criar/Atualizar:**

1. `salvarRascunhoEscala()` - Salva sem publicar
2. `publicarEscala()` - Publica escala
3. `publicarMultiplasEscalas()` - Publica várias de uma vez
4. `buscarEscalasRascunho()` - Lista apenas rascunhos
5. `buscarEscalasPublicadas()` - Lista apenas publicadas
6. `replicarSemanaEscala()` - Replica semana

**Impacto:**
- ✅ Backend pronto para pré-escala
- ✅ Suporta fluxos de publicação

### 6.3 Fase 3: Componentes de Calendário

**Objetivo:** Criar visualização em calendário mensal

**Ordem de Implementação:**

1. `EscalaCard` - Card básico de escala
2. `EscalaCalendarDay` - Célula de dia com escalas
3. `EscalaCalendarGrid` - Grade do calendário
4. `EscalaCalendarHeader` - Cabeçalho com navegação
5. `EscalaCalendarFilters` - Filtros
6. `EscalaCalendar` - Container principal

**Bibliotecas Sugeridas:**
- `date-fns` - Manipulação de datas (já em uso)
- `react-big-calendar` - Calendário (mencionado no PRD)
- Ou implementação customizada (mais controle)

**Impacto:**
- ✅ Visualização em calendário funcional
- ✅ Interação com escalas no calendário

### 6.4 Fase 4: Funcionalidades Avançadas

**Objetivo:** Completar fluxos de pré-escala

**Funcionalidades:**

1. Replicação de semana
2. Publicação em massa
3. Indicadores visuais (rascunho vs. publicado)
4. Validações antes de publicar
5. Notificações (futuro)

**Impacto:**
- ✅ Fluxo completo de pré-escala
- ✅ Produtividade do coordenador

---

## ✅ 7. Checklist de Implementação

### Banco de Dados
- [ ] Migration: Adicionar estado de publicação (rascunho/publicado)
- [ ] Migration: Adicionar campos `publicado_em` e `publicado_por`
- [ ] Migration: Migrar dados existentes
- [ ] Migration: Adicionar campo `turno` (opcional)
- [ ] Atualizar tipos TypeScript (`database.ts`)

### Actions/Backend
- [ ] Criar `salvarRascunhoEscala()`
- [ ] Criar `publicarEscala()`
- [ ] Criar `publicarMultiplasEscalas()`
- [ ] Criar `buscarEscalasRascunho()`
- [ ] Criar `buscarEscalasPublicadas()`
- [ ] Criar `replicarSemanaEscala()`
- [ ] Atualizar `buscarEscalas()` para suportar filtro de estado
- [ ] Atualizar queries para agrupar por setor

### Componentes
- [ ] Criar `EscalaCard.tsx`
- [ ] Criar `EscalaCalendarDay.tsx`
- [ ] Criar `EscalaCalendarGrid.tsx`
- [ ] Criar `EscalaCalendarHeader.tsx`
- [ ] Criar `EscalaCalendarFilters.tsx`
- [ ] Criar `EscalaReplicateWeek.tsx`
- [ ] Criar `EscalaCalendar.tsx` (container)
- [ ] Atualizar `EscalaForm.tsx` (adicionar botão "Salvar Rascunho")
- [ ] Atualizar página `/escalas` (adicionar toggle calendário/tabela)

### Validações
- [ ] Atualizar `escalaSchema` para incluir estado
- [ ] Validar que apenas coordenador pode publicar
- [ ] Validar que escalas publicadas não podem ser editadas diretamente (precisa despublicar)

### UI/UX
- [ ] Indicadores visuais de rascunho vs. publicado
- [ ] Cores diferentes por turno
- [ ] Tooltip com detalhes da escala
- [ ] Modal de confirmação para publicar
- [ ] Feedback visual ao salvar rascunho

---

## 📊 8. Resumo: O que é Possível vs. O que Precisa ser Criado

### ✅ O que JÁ é Possível com a Estrutura Atual

1. **CRUD básico de escalas**
   - Criar, editar, cancelar escalas
   - Validação de conflitos
   - Listagem em tabela

2. **Filtros básicos**
   - Por setor, profissional, status
   - Por período (data início/fim)

3. **Verificação de conflitos**
   - Detecção de sobreposição de horários
   - Alertas visuais

### ❌ O que NÃO é Possível (Requer Mudanças)

1. **Pré-escala/Rascunho**
   - ❌ Salvar sem publicar
   - ❌ Distinguir rascunho de publicado
   - ❌ Publicar posteriormente

2. **Calendário Visual**
   - ❌ Visualização mensal
   - ❌ Agrupamento por setor
   - ❌ Múltiplas escalas no mesmo dia

3. **Funcionalidades Avançadas**
   - ❌ Replicar semana
   - ❌ Publicação em massa
   - ❌ Filtros por grupo
   - ❌ Indicadores visuais de turno

### 🔨 O que Precisa ser Criado/Ajustado

#### Banco de Dados (Crítico)
1. **Migration:** Expandir `status` para incluir 'rascunho'
2. **Migration:** Adicionar `publicado_em` e `publicado_por`
3. **Migration:** Adicionar `turno` (opcional, pode ser inferido)

#### Backend/Actions (Crítico)
1. **Novas actions:** Salvar rascunho, publicar, replicar semana
2. **Queries otimizadas:** Agrupar por setor, filtrar por estado

#### Frontend/Componentes (Crítico)
1. **Componentes de calendário:** 6-7 novos componentes
2. **Atualização de formulário:** Botão "Salvar Rascunho"
3. **Filtros avançados:** Por grupo, por estado

---

## 🎯 9. Próximos Passos Recomendados

### Passo 1: Decisão Arquitetural
- [ ] Decidir se `status` será expandido ou se criará campo separado `estado_publicacao`
- [ ] Decidir se `turno` será campo explícito ou inferido
- [ ] Decidir biblioteca de calendário (react-big-calendar vs. custom)

### Passo 2: Preparação do Banco
- [ ] Criar migration para estado de publicação
- [ ] Testar migration em ambiente de desenvolvimento
- [ ] Migrar dados existentes

### Passo 3: Backend
- [ ] Implementar novas actions
- [ ] Atualizar queries existentes
- [ ] Testar endpoints

### Passo 4: Frontend
- [ ] Criar componentes de calendário (um por vez)
- [ ] Integrar com actions
- [ ] Testar fluxos completos

---

## 📝 10. Observações Importantes

### ⚠️ Pontos de Atenção

1. **Migração de Dados:**
   - Escalas existentes com `status='confirmado'` devem virar `status='publicado'`
   - Definir `publicado_em` = `created_at` para escalas antigas
   - Definir `publicado_por` = `created_by` para escalas antigas

2. **RLS (Row Level Security):**
   - Verificar se políticas permitem filtrar por `estado_publicacao`
   - Profissionais podem ver apenas escalas publicadas?
   - Coordenadores podem ver rascunhos e publicadas?

3. **Performance:**
   - Calendário mensal pode carregar muitas escalas
   - Considerar paginação ou lazy loading
   - Índices já existem (`idx_escalas_setor`, `idx_escalas_data_inicio`)

4. **UX:**
   - Indicadores visuais claros para rascunho vs. publicado
   - Feedback imediato ao salvar rascunho
   - Confirmação antes de publicar

---

## 🏁 Conclusão

A estrutura atual **NÃO suporta** os fluxos de pré-escala e calendário visual requeridos. São necessárias:

1. **Mudanças estruturais no banco** (crítico)
2. **Novas actions no backend** (crítico)
3. **Novos componentes no frontend** (crítico)

**Recomendação:** Implementar em fases, começando pelo banco de dados, depois backend, e por fim frontend.

**Próxima ação sugerida:** Criar migration para estado de publicação e testar em ambiente de desenvolvimento.

---

**Documento gerado em:** Janeiro 2025  
**Baseado em:** Schema atual (`20250101000000_initial_schema.sql`) e requisitos do usuário



