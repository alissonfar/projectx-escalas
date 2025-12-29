# Análise da Situação Atual: Frontend de Escalas

**Data:** 28/12/2024  
**Objetivo:** Analisar o estado atual e planejar a implementação do módulo de Escalas

---

## 🔍 SITUAÇÃO IDENTIFICADA

### ❌ PROBLEMA CRÍTICO: Desalinhamento entre Banco e Código

**Banco de Dados (NEW):**
- ✅ Migration `20250105000000_refatorar_modelo_escalas.sql` criada
- ✅ Modelo novo implementado:
  - `escalas` (container por setor)
  - `escala_periodos` (mês + ano + versão + estado)
  - `escala_alocacoes` (profissionais dentro do período)

**Código Frontend/Backend (OLD):**
- ❌ Ainda usa modelo antigo:
  - `escalas` com `profissional_id`, `data_inicio`, `data_fim`, `status`
  - Sem conceito de períodos
  - Sem conceito de alocações

### 📊 Diagnóstico Detalhado

#### Arquivos que precisam ser atualizados:

1. **`types/database.ts`**
   - ❌ Tipo `Escala` está no modelo antigo
   - ❌ Faltam tipos: `EscalaPeriodo`, `EscalaAlocacao`
   - ❌ `EscalaStatus` usa 'rascunho'|'publicado'|'cancelado' (modelo antigo)
   - ✅ Precisa: 'pre_escala'|'publicada' (modelo novo, no período)

2. **`lib/actions/escalas.ts`**
   - ❌ Todas as actions usam modelo antigo
   - ❌ `criarEscala`, `atualizarEscala` inserem em `escalas` diretamente
   - ❌ Não criam períodos nem alocações
   - ✅ Precisa: actions para períodos e alocações

3. **`lib/validations/escala.ts`**
   - ❌ Schema valida modelo antigo
   - ✅ Precisa: schemas para período e alocação

4. **`components/escalas/EscalaForm.tsx` e `EscalaList.tsx`**
   - ❌ Componentes para modelo antigo (lista tabular)
   - ❌ Não há grid de calendário
   - ✅ Precisa: reimplementação completa

5. **`app/(dashboard)/escalas/page.tsx`**
   - ❌ Página usa `EscalaList` (modelo antigo)
   - ✅ Precisa: implementação com grid

---

## 🎯 DECISÃO ESTRATÉGICA

### ⚠️ BLOQUEIO IDENTIFICADO

**Não posso implementar o frontend sem:**
1. ❌ Migration `20250105000000` executada no banco
2. ❌ Tipos TypeScript atualizados
3. ❌ Server Actions refatoradas

### 🚀 PLANO DE AÇÃO RECOMENDADO

#### Opção 1: Executar Migration e Refatorar Tudo (RECOMENDADO)
1. Executar migration no banco
2. Atualizar tipos TypeScript
3. Refatorar server actions
4. Implementar novo frontend

#### Opção 2: Implementar Frontend com Modelo Antigo (NÃO RECOMENDADO)
- ⚠️ Desalinhado com o modelo conceitual
- ⚠️ Precisaria ser refeito depois
- ⚠️ Não atende aos requisitos

---

## 📋 ANÁLISE DO MODELO NOVO vs REQUISITOS

### ✅ Modelo Novo ATENDE aos Requisitos

| Requisito | Modelo Antigo | Modelo Novo | Status |
|-----------|---------------|-------------|--------|
| Escala pertence ao SETOR | ❌ (tem profissional_id) | ✅ (só setor_id) | ✅ |
| Períodos mensais | ❌ | ✅ (escala_periodos) | ✅ |
| Versionamento | ❌ | ✅ (campo versao) | ✅ |
| Pré-escala/Publicada | Parcial (status rascunho/publicado) | ✅ (estado no período) | ✅ |
| Múltiplos profissionais por dia | ❌ (1 escala = 1 profissional) | ✅ (N alocações) | ✅ |
| Grid mensal | Difícil | ✅ (natural) | ✅ |

---

## 🛠️ TAREFAS NECESSÁRIAS

### ETAPA 1: Preparar Backend (CRÍTICO)

#### 1.1 Atualizar `types/database.ts`
```typescript
// Adicionar novos tipos:
export type Escala = {
  id: string
  setor_id: string
  created_at: string
  updated_at: string
}

export type EscalaPeriodo = {
  id: string
  escala_id: string
  mes: number // 1-12
  ano: number // ex: 2025
  versao: number
  estado: 'pre_escala' | 'publicada'
  publicado_em: string | null
  publicado_por: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export type EscalaAlocacao = {
  id: string
  periodo_id: string
  profissional_id: string
  data_inicio: string
  data_fim: string
  turno: 'manha' | 'tarde' | 'noite' | 'integral'
  observacoes: string | null
  created_by: string
  created_at: string
  updated_at: string
}
```

#### 1.2 Criar `lib/actions/escala-periodos.ts`
```typescript
// Actions para gerenciar períodos:
- buscarPeriodo(setorId, mes, ano)
- criarOuObterPeriodo(setorId, mes, ano)
- publicarPeriodo(periodoId)
- despublicarPeriodo(periodoId)
- buscarAlocacoesPeriodo(periodoId)
```

#### 1.3 Criar `lib/actions/escala-alocacoes.ts`
```typescript
// Actions para gerenciar alocações:
- criarAlocacao(periodoId, profissionalId, dataInicio, dataFim, observacoes)
- atualizarAlocacao(alocacaoId, dados)
- removerAlocacao(alocacaoId)
- verificarConflitos(profissionalId, dataInicio, dataFim)
```

#### 1.4 Criar `lib/validations/escala-periodo.ts` e `escala-alocacao.ts`
```typescript
// Schemas Zod para validação
```

### ETAPA 2: Implementar Frontend

#### 2.1 Estrutura de Componentes (components/escalas/)
```
components/escalas/
  grid/
    ScaleGrid.tsx          // Container principal do grid
    ScaleHeader.tsx        // Header com datas do mês
    ScaleRowSector.tsx     // Linha por setor
    ScaleDayCell.tsx       // Célula (dia × setor)
    ShiftCard.tsx          // Card de plantão (alocação)
    AddShiftButton.tsx     // Botão "+" para adicionar
  
  forms/
    AddShiftModal.tsx      // Modal para adicionar plantão
    ShiftForm.tsx          // Formulário de plantão
  
  filters/
    MonthSelector.tsx      // Navegação mês/ano
    SectorFilter.tsx       // Filtro de setores
    StateIndicator.tsx     // Indicador pré-escala/publicada
```

#### 2.2 Página (app/(dashboard)/escalas/)
```typescript
// page.tsx (Server Component)
- Buscar setores da organização
- Passar mês/ano inicial
- Renderizar EscalasClient

// EscalasClient.tsx (Client Component)
- Gerenciar estado do grid
- Buscar período e alocações
- Renderizar ScaleGrid
```

---

## 🎨 ESTRUTURA DO GRID (Baseada na Imagem)

### Layout Visual

```
┌─────────────────────────────────────────────────────────┐
│  [< Janeiro 2025 >]  [Filtros] [Publicar Mês]          │
├─────────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬─┤
│ Setor   │ 01 │ 02 │ 03 │ 04 │ 05 │ ... │ 30 │ 31 │    │
│         │ Seg│ Ter│ Qua│ Qui│ Sex│     │    │    │    │
├─────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─┤
│ UTI     │[Dr]│[Dr]│    │[+] │[Dr]│     │    │    │    │
│         │João│Ana │    │    │João│     │    │    │    │
│         │8-16│8-16│    │    │8-16│     │    │    │    │
├─────────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼─┤
│ Pronto  │[Dr]│    │[Dr]│[+] │    │     │    │    │    │
│ Socorro │José│    │José│    │    │     │    │    │    │
│         │8-16│    │8-16│    │    │     │    │    │    │
└─────────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴─┘
```

### Componentes Mapeados

1. **Header de Navegação**
   - Seletor de mês/ano
   - Filtros (setor, grupo, profissional)
   - Botão "Publicar Mês" (se pré-escala)

2. **Header de Datas** (`ScaleHeader`)
   - Todos os dias do mês
   - Dia da semana
   - Destaque de fins de semana

3. **Linha de Setor** (`ScaleRowSector`)
   - Nome do setor
   - Células por dia

4. **Célula** (`ScaleDayCell`)
   - Múltiplos cards de plantão
   - Botão "+" (se pré-escala)
   - Scroll se muitos plantões

5. **Card de Plantão** (`ShiftCard`)
   - Nome do profissional
   - Horário (8h-16h)
   - Turno (manha/tarde/noite/integral)
   - Cor por grupo
   - Click para editar (se pré-escala)

---

## 📦 DADOS NECESSÁRIOS

### Para renderizar o grid:

```typescript
interface ScaleGridData {
  setor: Setor
  periodo: EscalaPeriodo
  mes: number
  ano: number
  alocacoes: EscalaAlocacao[] // Todas do período
  profissionais: Profissional[] // Para o modal
  ehPreEscala: boolean // periodo.estado === 'pre_escala'
}
```

### Estrutura de busca:

```typescript
// 1. Selecionar setor (ou todos)
const setorId = '...'

// 2. Selecionar mês/ano
const mes = 1 // Janeiro
const ano = 2025

// 3. Buscar ou criar período
const periodo = await buscarPeriodo(setorId, mes, ano)
// Se não existir, criar automaticamente como pre_escala

// 4. Buscar alocações do período
const alocacoes = await buscarAlocacoesPeriodo(periodo.id)

// 5. Agrupar alocações por dia + setor
const grid = agruparPorDiaSetor(alocacoes, mes, ano)
```

---

## ⚠️ DECISÕES PENDENTES

### Preciso confirmar com o usuário:

1. **A migration foi executada?**
   - ❓ Se SIM: posso refatorar tudo
   - ❓ Se NÃO: preciso esperar execução

2. **Escopo desta implementação:**
   - ❓ Devo refatorar backend E frontend?
   - ❓ Ou só frontend (assumindo backend pronto)?

3. **Prioridade:**
   - ❓ Um setor por vez (mais simples)?
   - ❓ Ou múltiplos setores no grid?

---

## 🚦 STATUS ATUAL: BLOQUEADO

**Não posso avançar com a implementação sem:**
1. Confirmação se migration foi executada
2. Definição do escopo (refatorar backend + frontend ou só frontend)
3. Atualização dos tipos e actions

**Próximo passo recomendado:**
- Usuário executar migration: `npx supabase migration up`
- Eu refatorar tipos e actions
- Então implementar frontend novo

---

## 📌 RESUMO EXECUTIVO

| Item | Status | Bloqueio |
|------|--------|----------|
| **Banco de Dados** | ✅ Pronto | Migration não executada |
| **Tipos TypeScript** | ❌ Desatualizados | Precisa refatoração |
| **Server Actions** | ❌ Modelo antigo | Precisa refatoração |
| **Frontend** | ❌ Não implementado | Depende dos anteriores |

**Recomendação:** Executar migration → Refatorar backend → Implementar frontend

