# 🚀 PLANO DE IMPLEMENTAÇÃO - CRUDs DO SISTEMA

**Data:** 28 de Dezembro de 2025  
**Objetivo:** Plano detalhado e sequencial para implementação dos 5 CRUDs

---

## 📋 VISÃO GERAL

### **Ordem de Implementação (Por Dependências)**

```
1. Hospitais (base)
   ↓
2. Setores (depende de Hospitais)
   ↓
3. Grupos (base, paralelo a Hospitais)
   ↓
4. Profissionais (depende de Grupos)
   ↓
5. Escalas (depende de Setores + Profissionais)
```

### **Fases de Implementação**

**FASE 0:** Validações Críticas (Pré-requisito)  
**FASE 1:** Componentes Reutilizáveis  
**FASE 2:** CRUD Hospitais  
**FASE 3:** CRUD Setores  
**FASE 4:** CRUD Grupos  
**FASE 5:** CRUD Profissionais  
**FASE 6:** CRUD Escalas  

---

## 🔧 FASE 0: VALIDAÇÕES CRÍTICAS (PRÉ-REQUISITO)

### **Objetivo**
Criar funções SQL de validação de dependências antes de implementar os CRUDs.

### **Arquivos a Criar**

**1. Migration SQL**
```
supabase/migrations/20250103000000_add_dependency_checks.sql
```

**Conteúdo:**
- Função `check_hospital_has_active_setores()`
- Função `check_setor_has_active_escalas()`
- Função `check_grupo_has_active_profissionais()`
- Função `check_profissional_has_future_escalas()`

**2. Helper TypeScript**
```
lib/utils/validations.ts
```

**Funções:**
```typescript
export async function canDeactivateHospital(hospitalId: string): Promise<ValidationResult>
export async function canDeactivateSetor(setorId: string): Promise<ValidationResult>
export async function canDeactivateGrupo(grupoId: string): Promise<ValidationResult>
export async function canDeactivateProfissional(profissionalId: string): Promise<ValidationResult>

type ValidationResult = {
  can: boolean
  reason?: string
  count?: number
}
```

**3. Constantes de Tipos**
```
lib/constants.ts
```

**Conteúdo:**
```typescript
export const TIPOS_GRUPO_PERMITIDOS = [
  'Médico',
  'Enfermeiro',
  'Fisioterapeuta',
  'Técnico de Enfermagem',
  'Outro'
] as const

export type TipoGrupo = typeof TIPOS_GRUPO_PERMITIDOS[number]
```

**4. Atualizar Schema de Validação**
```
lib/validations/grupo.ts
```

**Mudança:**
- Adicionar validação de enum para `tipo`

---

## 🧩 FASE 1: COMPONENTES REUTILIZÁVEIS

### **Objetivo**
Criar componentes genéricos que serão usados em todos os CRUDs.

### **Componentes a Criar**

#### **1. DataTable** - Tabela genérica
```
components/crud/DataTable.tsx
```

**Props:**
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onToggleActive?: (row: T) => void
  filters?: FilterConfig[]
  searchPlaceholder?: string
  pagination?: boolean
  loading?: boolean
}
```

**Features:**
- Ordenação por colunas
- Busca global
- Filtros customizáveis
- Paginação
- Ações por linha (editar, desativar)
- Responsivo

#### **2. FormModal** - Modal de formulário
```
components/crud/FormModal.tsx
```

**Props:**
```typescript
interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  onSubmit: () => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

**Features:**
- Header com título
- Footer com botões
- Loading state
- Fechar ao clicar fora
- Fechar com ESC

#### **3. Select** - Select genérico
```
components/crud/Select.tsx
```

**Props:**
```typescript
interface SelectProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
}
```

**Features:**
- Estilo consistente
- Suporte a erro
- Placeholder
- Desabilitado

#### **4. StatusBadge** - Badge de status
```
components/crud/StatusBadge.tsx
```

**Props:**
```typescript
interface StatusBadgeProps {
  status: 'ativo' | 'inativo' | 'confirmado' | 'cancelado'
  variant?: 'default' | 'success' | 'warning' | 'danger'
}
```

**Features:**
- Cores por status
- Ícones opcionais
- Tema claro/escuro

#### **5. ConfirmDialog** - Diálogo de confirmação
```
components/crud/ConfirmDialog.tsx
```

**Props:**
```typescript
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger'
  loading?: boolean
}
```

**Features:**
- Título e mensagem
- Botões customizáveis
- Variante danger (para ações destrutivas)
- Loading state

#### **6. DateTimePicker** - Seletor de data/hora
```
components/crud/DateTimePicker.tsx
```

**Props:**
```typescript
interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  label?: string
  error?: string
  required?: boolean
  min?: Date
  max?: Date
  showTime?: boolean
  disabled?: boolean
}
```

**Features:**
- Data e hora
- Validação de min/max
- Formato brasileiro
- Tema claro/escuro

#### **7. SearchInput** - Campo de busca
```
components/crud/SearchInput.tsx
```

**Props:**
```typescript
interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: (value: string) => void
  debounceMs?: number
}
```

**Features:**
- Debounce automático
- Ícone de busca
- Limpar busca

---

## 🏥 FASE 2: CRUD DE HOSPITAIS

### **Rotas**

```
app/(dashboard)/hospitais/
├── page.tsx              # Listagem
├── novo/
│   └── page.tsx          # Criação
└── [id]/
    └── editar/
        └── page.tsx      # Edição
```

### **Componentes**

```
components/hospitais/
├── HospitalForm.tsx      # Formulário (criar/editar)
└── HospitalList.tsx       # Listagem
```

### **Server Actions**

```
lib/actions/hospitais.ts
```

**Funções:**
```typescript
export async function criarHospital(data: HospitalFormData): Promise<ActionResult>
export async function atualizarHospital(id: string, data: HospitalFormData): Promise<ActionResult>
export async function desativarHospital(id: string): Promise<ActionResult>
export async function buscarHospitais(): Promise<Hospital[]>
export async function buscarHospital(id: string): Promise<Hospital | null>
```

### **Fluxo de Implementação**

1. **Criar Server Actions** (`lib/actions/hospitais.ts`)
   - Implementar todas as funções acima
   - Usar validação `hospitalSchema`
   - Usar função `canDeactivateHospital()` antes de desativar

2. **Criar Componente HospitalForm** (`components/hospitais/HospitalForm.tsx`)
   - Usar `FormModal` como wrapper
   - Campo: nome (Input)
   - Validação com React Hook Form + Zod
   - Submit via server action

3. **Criar Componente HospitalList** (`components/hospitais/HospitalList.tsx`)
   - Usar `DataTable`
   - Colunas: nome, status, created_at, ações
   - Filtro: ativo/inativo
   - Busca: por nome
   - Ações: editar, desativar

4. **Criar Página de Listagem** (`app/(dashboard)/hospitais/page.tsx`)
   - Server component
   - Buscar hospitais via server action
   - Renderizar `HospitalList`

5. **Criar Página de Criação** (`app/(dashboard)/hospitais/novo/page.tsx`)
   - Client component
   - Renderizar `HospitalForm` em modal
   - Redirecionar após sucesso

6. **Criar Página de Edição** (`app/(dashboard)/hospitais/[id]/editar/page.tsx`)
   - Server component para buscar hospital
   - Client component para formulário
   - Renderizar `HospitalForm` pré-preenchido

### **Validações**

- ✅ Schema já existe (`hospitalSchema`)
- ✅ RLS já configurado
- ✅ Validação de dependências (Fase 0)

---

## 🏢 FASE 3: CRUD DE SETORES

### **Rotas**

```
app/(dashboard)/setores/
├── page.tsx              # Listagem
├── novo/
│   └── page.tsx          # Criação
└── [id]/
    └── editar/
        └── page.tsx      # Edição
```

### **Componentes**

```
components/setores/
├── SetorForm.tsx         # Formulário
└── SetorList.tsx         # Listagem
```

### **Componentes Auxiliares**

```
components/setores/HospitalSelect.tsx  # Select de hospitais
```

### **Server Actions**

```
lib/actions/setores.ts
```

**Funções:**
```typescript
export async function criarSetor(data: SetorFormData): Promise<ActionResult>
export async function atualizarSetor(id: string, data: SetorFormData): Promise<ActionResult>
export async function desativarSetor(id: string): Promise<ActionResult>
export async function buscarSetores(): Promise<SetorComHospital[]>
export async function buscarSetor(id: string): Promise<SetorComHospital | null>
export async function buscarHospitaisParaSelect(): Promise<{ value: string; label: string }[]>
```

### **Fluxo de Implementação**

1. **Criar Server Actions** (`lib/actions/setores.ts`)
   - Implementar todas as funções
   - Queries com JOIN para incluir nome do hospital
   - Validação `setorSchema`
   - Validação de dependências antes de desativar

2. **Criar Componente HospitalSelect** (`components/setores/HospitalSelect.tsx`)
   - Buscar hospitais ativos da organização
   - Renderizar como Select
   - Mostrar nome do hospital

3. **Criar Componente SetorForm** (`components/setores/SetorForm.tsx`)
   - Campo: nome (Input)
   - Campo: hospital_id (HospitalSelect)
   - Validação React Hook Form + Zod
   - Submit via server action

4. **Criar Componente SetorList** (`components/setores/SetorList.tsx`)
   - Colunas: nome, hospital, status, created_at, ações
   - Filtro: hospital, ativo/inativo
   - Busca: por nome
   - Agrupar por hospital (opcional)

5. **Criar Páginas** (mesmo padrão de hospitais)

### **Validações**

- ✅ Schema já existe (`setorSchema`)
- ✅ RLS já configurado
- ✅ Validação de dependências (Fase 0)
- ⚠️ Validação ao transferir entre hospitais (opcional)

---

## 👥 FASE 4: CRUD DE GRUPOS

### **Rotas**

```
app/(dashboard)/grupos/
├── page.tsx              # Listagem
├── novo/
│   └── page.tsx          # Criação
└── [id]/
    └── editar/
        └── page.tsx      # Edição
```

### **Componentes**

```
components/grupos/
├── GrupoForm.tsx         # Formulário
└── GrupoList.tsx         # Listagem
```

### **Server Actions**

```
lib/actions/grupos.ts
```

**Funções:**
```typescript
export async function criarGrupo(data: GrupoFormData): Promise<ActionResult>
export async function atualizarGrupo(id: string, data: GrupoFormData): Promise<ActionResult>
export async function desativarGrupo(id: string): Promise<ActionResult>
export async function buscarGrupos(): Promise<Grupo[]>
export async function buscarGrupo(id: string): Promise<Grupo | null>
```

### **Fluxo de Implementação**

1. **Atualizar Schema de Validação** (`lib/validations/grupo.ts`)
   - Adicionar enum para `tipo` usando `TIPOS_GRUPO_PERMITIDOS`

2. **Criar Server Actions** (`lib/actions/grupos.ts`)
   - Implementar funções
   - Validação `grupoSchema` atualizado

3. **Criar Componente GrupoForm** (`components/grupos/GrupoForm.tsx`)
   - Campo: nome (Input)
   - Campo: tipo (Select com opções de `TIPOS_GRUPO_PERMITIDOS`)
   - Validação React Hook Form + Zod

4. **Criar Componente GrupoList** (`components/grupos/GrupoList.tsx`)
   - Colunas: nome, tipo, status, created_at, ações
   - Filtro: tipo, ativo/inativo
   - Busca: por nome
   - Agrupar por tipo (opcional)

5. **Criar Páginas** (mesmo padrão)

### **Validações**

- ✅ Schema atualizado com enum
- ✅ RLS já configurado
- ✅ Validação de dependências (Fase 0)

---

## 👤 FASE 5: CRUD DE PROFISSIONAIS

### **Rotas**

```
app/(dashboard)/profissionais/
├── page.tsx              # Listagem
├── novo/
│   └── page.tsx          # Criação
└── [id]/
    └── editar/
        └── page.tsx      # Edição
```

### **Componentes**

```
components/profissionais/
├── ProfissionalForm.tsx  # Formulário
└── ProfissionalList.tsx  # Listagem
```

### **Componentes Auxiliares**

```
components/profissionais/GrupoSelect.tsx  # Select de grupos
```

### **Server Actions**

```
lib/actions/profissionais.ts
```

**Funções:**
```typescript
export async function criarProfissional(data: ProfissionalFormData): Promise<ActionResult>
export async function atualizarProfissional(id: string, data: ProfissionalFormData): Promise<ActionResult>
export async function desativarProfissional(id: string): Promise<ActionResult>
export async function buscarProfissionais(): Promise<ProfissionalComGrupo[]>
export async function buscarProfissional(id: string): Promise<ProfissionalComGrupo | null>
export async function buscarGruposParaSelect(): Promise<{ value: string; label: string }[]>
export async function verificarEmailUnico(email: string, excludeId?: string): Promise<boolean>
```

### **Fluxo de Implementação**

1. **Criar Server Actions** (`lib/actions/profissionais.ts`)
   - Implementar funções
   - Queries com JOIN para incluir grupo
   - Validação `profissionalSchema`
   - Validação assíncrona de email único
   - Validação de dependências antes de desativar

2. **Criar Componente GrupoSelect** (`components/profissionais/GrupoSelect.tsx`)
   - Buscar grupos ativos da organização
   - Renderizar como Select
   - Mostrar nome e tipo do grupo

3. **Criar Componente ProfissionalForm** (`components/profissionais/ProfissionalForm.tsx`)
   - Campo: nome (Input)
   - Campo: email (Input type="email")
   - Campo: telefone (Input type="tel", opcional)
   - Campo: grupo_id (GrupoSelect)
   - Validação React Hook Form + Zod
   - Validação assíncrona de email único
   - Submit via server action

4. **Criar Componente ProfissionalList** (`components/profissionais/ProfissionalList.tsx`)
   - Colunas: nome, email, telefone, grupo, status, ações
   - Filtro: grupo, ativo/inativo
   - Busca: por nome ou email
   - Agrupar por grupo (opcional)

5. **Criar Páginas** (mesmo padrão)

### **Validações**

- ✅ Schema já existe (`profissionalSchema`)
- ✅ RLS já configurado
- ✅ Trigger de email único já existe
- ✅ Validação de dependências (Fase 0)

---

## 📅 FASE 6: CRUD DE ESCALAS

### **Rotas**

```
app/(dashboard)/escalas/
├── page.tsx              # Listagem/Calendário
├── nova/
│   └── page.tsx          # Criação
└── [id]/
    └── editar/
        └── page.tsx      # Edição
```

### **Componentes**

```
components/escalas/
├── EscalaForm.tsx        # Formulário (complexo)
├── EscalaList.tsx        # Listagem em tabela
└── EscalaCalendar.tsx    # Visualização em calendário (futuro)
```

### **Componentes Auxiliares**

```
components/escalas/SetorSelect.tsx        # Select de setores
components/escalas/ProfissionalSelect.tsx # Select de profissionais
components/escalas/ConflictAlert.tsx     # Alerta de conflito
```

### **Server Actions**

```
lib/actions/escalas.ts
```

**Funções:**
```typescript
export async function criarEscala(data: EscalaFormData): Promise<ActionResult>
export async function atualizarEscala(id: string, data: EscalaFormData): Promise<ActionResult>
export async function cancelarEscala(id: string): Promise<ActionResult>
export async function buscarEscalas(filters?: EscalaFilters): Promise<EscalaComRelacoes[]>
export async function buscarEscala(id: string): Promise<EscalaComRelacoes | null>
export async function buscarSetoresParaSelect(): Promise<{ value: string; label: string }[]>
export async function buscarProfissionaisParaSelect(): Promise<{ value: string; label: string }[]>
export async function verificarConflitos(profissionalId: string, dataInicio: string, dataFim: string, excludeId?: string): Promise<Escala[]>
```

### **Fluxo de Implementação**

1. **Criar Server Actions** (`lib/actions/escalas.ts`)
   - Implementar todas as funções
   - Queries com JOINs múltiplos (setor → hospital, profissional → grupo)
   - Validação `escalaSchemaCompleto` (assíncrona)
   - Validação de conflitos usando `getEscalasProfissionalPeriodo`
   - Regra: não pode cancelar escalas passadas

2. **Criar Componente SetorSelect** (`components/escalas/SetorSelect.tsx`)
   - Buscar setores ativos com nome do hospital
   - Renderizar como Select
   - Mostrar: "Setor - Hospital"

3. **Criar Componente ProfissionalSelect** (`components/escalas/ProfissionalSelect.tsx`)
   - Buscar profissionais ativos com grupo
   - Renderizar como Select
   - Mostrar: "Nome - Grupo"

4. **Criar Componente ConflictAlert** (`components/escalas/ConflictAlert.tsx`)
   - Mostrar alerta visual de conflitos
   - Listar escalas conflitantes
   - Botões: "Salvar Mesmo Assim" / "Cancelar"

5. **Criar Componente EscalaForm** (`components/escalas/EscalaForm.tsx`)
   - Campo: setor_id (SetorSelect)
   - Campo: profissional_id (ProfissionalSelect)
   - Campo: data_inicio (DateTimePicker)
   - Campo: data_fim (DateTimePicker)
   - Campo: observacoes (Textarea, opcional)
   - Campo: status (Select, default 'confirmado')
   - Validação React Hook Form + Zod (assíncrona)
   - Validação de conflitos antes de salvar
   - Mostrar ConflictAlert se houver conflitos
   - Submit via server action

6. **Criar Componente EscalaList** (`components/escalas/EscalaList.tsx`)
   - Colunas: profissional, setor, hospital, data_inicio, data_fim, status, ações
   - Filtros: período, hospital, setor, profissional, status
   - Busca: por profissional ou setor
   - Ordenar por: data_inicio

7. **Criar Páginas** (mesmo padrão)

### **Validações**

- ✅ Schema já existe (`escalaSchema` e `escalaSchemaCompleto`)
- ✅ RLS já configurado
- ✅ Função de verificação de organização já existe
- ✅ Função de verificação de conflitos já existe
- ⚠️ Integração de conflitos no formulário (Fase 0)
- ⚠️ Regra de cancelamento (definir na Fase 0)

---

## 📊 RESUMO DE DEPENDÊNCIAS

### **Ordem de Implementação**

```
FASE 0: Validações Críticas
  ↓
FASE 1: Componentes Reutilizáveis
  ↓
FASE 2: Hospitais (base)
  ↓
FASE 3: Setores (depende de Hospitais)
  ↓
FASE 4: Grupos (paralelo a Hospitais)
  ↓
FASE 5: Profissionais (depende de Grupos)
  ↓
FASE 6: Escalas (depende de Setores + Profissionais)
```

### **Componentes Reutilizáveis por Fase**

| Componente | Fase 2 | Fase 3 | Fase 4 | Fase 5 | Fase 6 |
|------------|--------|--------|--------|--------|--------|
| DataTable | ✅ | ✅ | ✅ | ✅ | ✅ |
| FormModal | ✅ | ✅ | ✅ | ✅ | ✅ |
| Select | ✅ | ✅ | ✅ | ✅ | ✅ |
| StatusBadge | ✅ | ✅ | ✅ | ✅ | ✅ |
| ConfirmDialog | ✅ | ✅ | ✅ | ✅ | ✅ |
| DateTimePicker | ❌ | ❌ | ❌ | ❌ | ✅ |
| SearchInput | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## ✅ CHECKLIST FINAL

### **Antes de Começar**

- [ ] Fase 0 completa (validações críticas)
- [ ] Componentes reutilizáveis criados
- [ ] Padrão visual definido e documentado
- [ ] Testes de validação funcionando

### **Para Cada CRUD**

- [ ] Server actions criadas
- [ ] Componentes específicos criados
- [ ] Páginas criadas (listagem, criar, editar)
- [ ] Validações funcionando
- [ ] RLS testado
- [ ] Tema claro/escuro funcionando
- [ ] Responsivo testado

---

**Plano criado em:** 28/12/2025  
**Status:** ✅ Pronto para implementação sequencial

