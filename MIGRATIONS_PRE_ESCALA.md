# Migrations: Suporte para Pré-Escala

**Data:** 04/01/2025  
**Migration:** `20250104000000_add_pre_escala_support.sql`

---

## 📋 Resumo

Migration criada para adicionar suporte completo para pré-escala (rascunho/publicação) e campo de turno nas escalas.

---

## ✅ Mudanças Implementadas

### 1. Expansão do Campo `status`

**Antes:**
- Valores permitidos: `'confirmado'`, `'cancelado'`
- Default: `'confirmado'`

**Depois:**
- Valores permitidos: `'rascunho'`, `'publicado'`, `'cancelado'`
- Default: `'rascunho'` (novas escalas começam como rascunho)

**Migração de Dados:**
- Todas as escalas com `status='confirmado'` foram migradas para `status='publicado'`
- Campos `publicado_em` e `publicado_por` foram preenchidos com `created_at` e `created_by` respectivamente

### 2. Novos Campos Adicionados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `publicado_em` | `TIMESTAMPTZ` | Data/hora em que a escala foi publicada. NULL se ainda está em rascunho. |
| `publicado_por` | `UUID` | ID do usuário que publicou a escala. NULL se ainda está em rascunho. |
| `turno` | `TEXT` | Turno da escala: `'manha'`, `'tarde'`, `'noite'`, `'integral'`. Inferido automaticamente se não especificado. |

### 3. Função para Inferir Turno

**Função:** `inferir_turno(data_inicio, data_fim)`

**Lógica:**
- **Integral:** Duração >= 12 horas
- **Manhã:** Início entre 06:00 e 12:00
- **Tarde:** Início entre 12:00 e 18:00
- **Noite:** Início entre 18:00 e 06:00

**Trigger Automático:**
- Campo `turno` é preenchido automaticamente ao criar/atualizar escala se não especificado

### 4. Validação de Publicação

**Trigger:** `trigger_validar_publicacao_escala`

**Comportamento:**
- Quando `status` muda para `'publicado'`:
  - Se `publicado_em` é NULL, preenche com `NOW()`
  - Se `publicado_por` é NULL, usa `created_by` ou `auth.uid()`

### 5. Índices para Performance

Criados índices otimizados:
- `idx_escalas_status` - Filtro por status
- `idx_escalas_turno` - Filtro por turno
- `idx_escalas_publicadas_periodo` - Busca escalas publicadas por período
- `idx_escalas_rascunhos_criador` - Busca rascunhos por criador

### 6. Atualização de Funções Existentes

**Funções atualizadas:**
- `check_setor_has_active_escalas()` - Agora considera apenas escalas `'publicado'`
- `check_profissional_has_future_escalas()` - Agora considera apenas escalas `'publicado'`

---

## 🔄 Mudanças no Código TypeScript

### Tipos Atualizados

**`types/database.ts`:**
```typescript
// Antes
export type EscalaStatus = 'confirmado' | 'cancelado'

// Depois
export type EscalaStatus = 'rascunho' | 'publicado' | 'cancelado'
export type EscalaTurno = 'manha' | 'tarde' | 'noite' | 'integral'

export type Escala = {
  // ... campos existentes
  status: EscalaStatus
  turno: EscalaTurno | null
  publicado_em: string | null
  publicado_por: string | null
  // ...
}
```

### Validações Atualizadas

**`lib/validations/escala.ts`:**
- Schema atualizado para aceitar novos valores de `status`
- Default mudado de `'confirmado'` para `'rascunho'`
- Campo `turno` adicionado (opcional)

### Actions Atualizadas

**`lib/actions/escalas.ts`:**
- Default de `status` mudado de `'confirmado'` para `'rascunho'`

### Queries Atualizadas

**`lib/supabase/queries.ts`:**
- Verificação de conflitos agora considera apenas escalas `'publicado'`

**`lib/utils/validations.ts`:**
- Validações de desativação agora consideram apenas escalas `'publicado'`

### Componentes Atualizados

**`components/escalas/EscalaForm.tsx`:**
- Campo de status removido do formulário (será gerenciado via ações separadas)
- Default mudado para `'rascunho'`

**`components/escalas/EscalaList.tsx`:**
- Filtros atualizados para incluir `'rascunho'` e `'publicado'`

---

## 📝 Próximos Passos

### Ações Backend Necessárias

1. **Criar `salvarRascunhoEscala()`**
   - Salva escala com `status='rascunho'`
   - Não preenche `publicado_em` nem `publicado_por`

2. **Criar `publicarEscala(id)`**
   - Atualiza `status` para `'publicado'`
   - Trigger preenche automaticamente `publicado_em` e `publicado_por`

3. **Criar `publicarMultiplasEscalas(ids[])`**
   - Publica várias escalas de uma vez

4. **Criar `buscarEscalasRascunho()`**
   - Lista apenas escalas com `status='rascunho'`

5. **Criar `buscarEscalasPublicadas()`**
   - Lista apenas escalas com `status='publicado'`

6. **Atualizar `buscarEscalas()`**
   - Adicionar filtro opcional por `estado` (rascunho/publicado/todos)

### Componentes Frontend Necessários

1. **Botão "Salvar Rascunho"** no formulário
2. **Botão "Publicar"** na lista/detalhes da escala
3. **Indicadores visuais** para rascunho vs. publicado
4. **Ação de publicação em massa**

---

## ⚠️ Observações Importantes

### Migração de Dados

- ✅ Escalas existentes foram migradas automaticamente
- ✅ Dados históricos preservados (`publicado_em` = `created_at`)

### Compatibilidade

- ⚠️ Código que ainda referencia `status='confirmado'` precisa ser atualizado
- ✅ Queries que filtram por `'confirmado'` foram atualizadas para `'publicado'`

### RLS (Row Level Security)

- As políticas RLS existentes continuam funcionando
- Considerar adicionar política para profissionais verem apenas escalas `'publicado'`

### Performance

- Índices criados otimizam queries por status e turno
- Queries de calendário mensal devem usar índices compostos

---

## 🧪 Como Testar

1. **Criar nova escala:**
   ```sql
   INSERT INTO escalas (setor_id, profissional_id, data_inicio, data_fim, created_by)
   VALUES (...);
   -- Deve criar com status='rascunho' e turno inferido automaticamente
   ```

2. **Publicar escala:**
   ```sql
   UPDATE escalas SET status='publicado' WHERE id='...';
   -- Deve preencher publicado_em e publicado_por automaticamente
   ```

3. **Verificar turno:**
   ```sql
   SELECT id, data_inicio, data_fim, turno FROM escalas;
   -- turno deve estar preenchido automaticamente
   ```

---

## 📚 Referências

- Migration: `supabase/migrations/20250104000000_add_pre_escala_support.sql`
- Análise completa: `ANALISE_FLUXO_ESCALAS.md`
- Tipos atualizados: `types/database.ts`

---

**Status:** ✅ Migration criada e código atualizado  
**Próxima ação:** Implementar ações de backend para salvar rascunho e publicar escalas



