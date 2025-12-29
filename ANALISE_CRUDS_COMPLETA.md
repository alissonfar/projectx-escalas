# 📊 ANÁLISE COMPLETA - CRUDs DO SISTEMA

**Data:** 28 de Dezembro de 2025  
**Objetivo:** Mapear todos os CRUDs necessários e identificar lacunas antes da implementação

---

## 🗄️ ANÁLISE DO BANCO DE DADOS

### ✅ **TABELAS EXISTENTES (CONFIRMADAS NO SCHEMA)**

#### 1. **organizacoes**
```sql
Campos:
- id (UUID, PK)
- nome (TEXT, NOT NULL)
- criado_por (UUID, FK → auth.users)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- 1:N → hospitais
- 1:N → grupos

RLS: ✅ Configurado
Políticas: SELECT, INSERT, UPDATE (por criado_por)
```

#### 2. **hospitais**
```sql
Campos:
- id (UUID, PK)
- organizacao_id (UUID, FK → organizacoes, NOT NULL)
- nome (TEXT, NOT NULL)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- N:1 → organizacoes
- 1:N → setores

RLS: ✅ Configurado
Políticas: SELECT, ALL (filtrado por organizacao_id via get_user_active_org_id())
```

#### 3. **grupos**
```sql
Campos:
- id (UUID, PK)
- organizacao_id (UUID, FK → organizacoes, NOT NULL)
- nome (TEXT, NOT NULL)
- tipo (TEXT, NOT NULL) ⚠️ SEM VALIDAÇÃO DE VALORES PERMITIDOS
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- N:1 → organizacoes
- 1:N → profissionais

RLS: ✅ Configurado
Políticas: SELECT, ALL (filtrado por organizacao_id)
```

#### 4. **setores**
```sql
Campos:
- id (UUID, PK)
- hospital_id (UUID, FK → hospitais, NOT NULL)
- nome (TEXT, NOT NULL)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- N:1 → hospitais (que pertence a organizacoes)
- 1:N → escalas

RLS: ✅ Configurado
Políticas: SELECT, ALL (filtrado via join com hospitais)
```

#### 5. **profissionais**
```sql
Campos:
- id (UUID, PK)
- grupo_id (UUID, FK → grupos, NOT NULL)
- nome (TEXT, NOT NULL)
- email (TEXT, NOT NULL) ⚠️ SEM VALIDAÇÃO DE FORMATO NO BANCO
- telefone (TEXT, NULLABLE)
- ativo (BOOLEAN, DEFAULT true)
- created_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- N:1 → grupos (que pertence a organizacoes)
- 1:N → escalas

RLS: ✅ Configurado
Políticas: SELECT, ALL (filtrado via join com grupos)

Triggers:
- ✅ check_profissional_email_unique (valida email único por organização)
```

#### 6. **escalas**
```sql
Campos:
- id (UUID, PK)
- setor_id (UUID, FK → setores, NOT NULL)
- profissional_id (UUID, FK → profissionais, NOT NULL)
- data_inicio (TIMESTAMPTZ, NOT NULL)
- data_fim (TIMESTAMPTZ, NOT NULL)
- observacoes (TEXT, NULLABLE)
- status (TEXT, NOT NULL, DEFAULT 'confirmado')
  ⚠️ CHECK: status IN ('confirmado', 'cancelado')
- created_by (UUID, FK → auth.users, NOT NULL)
- created_at (TIMESTAMPTZ, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, DEFAULT NOW())

Relacionamentos:
- N:1 → setores
- N:1 → profissionais
- N:1 → auth.users (created_by)

Constraints:
- ✅ CHECK: data_fim > data_inicio

Triggers:
- ✅ update_escalas_updated_at (atualiza updated_at automaticamente)

RLS: ✅ Configurado
Políticas: SELECT, ALL (filtrado via join com setores → hospitais)
```

---

## 📋 MAPEAMENTO CRUD POR CRUD

### 1️⃣ **CRUD DE HOSPITAIS**

#### ✅ **DADOS DISPONÍVEIS (CONFIRMADOS)**

**Tabela:** `hospitais`

**Campos para CREATE:**
- `nome` (TEXT, obrigatório)
- `organizacao_id` (UUID, obrigatório) → **Obtido automaticamente via RLS**

**Campos para UPDATE:**
- `nome` (TEXT)
- `ativo` (BOOLEAN) → **Soft delete**

**Campos para READ:**
- Todos os campos + `created_at`

**Campos para DELETE:**
- Não há DELETE físico → usar `ativo = false`

#### 📍 **FLUXO FUNCIONAL**

```
1. LISTAGEM (/dashboard/hospitais)
   ├── Buscar: SELECT * FROM hospitais WHERE organizacao_id = get_user_active_org_id()
   ├── Filtrar por: ativo/inativo (opcional)
   ├── Ordenar por: nome, created_at
   └── Exibir: Tabela com nome, status, data criação, ações

2. CRIAÇÃO (/dashboard/hospitais/novo)
   ├── Formulário:
   │   ├── Campo: nome (text, obrigatório)
   │   └── Campo: organizacao_id (hidden, preenchido automaticamente)
   ├── Validação: hospitalSchema (já existe)
   └── Submit: INSERT INTO hospitais (nome, organizacao_id, ativo)

3. EDIÇÃO (/dashboard/hospitais/[id]/editar)
   ├── Buscar: SELECT * FROM hospitais WHERE id = [id]
   ├── Formulário pré-preenchido
   ├── Validação: hospitalSchema
   └── Submit: UPDATE hospitais SET nome = ?, ativo = ? WHERE id = ?

4. DESATIVAÇÃO (Soft Delete)
   ├── Ação: UPDATE hospitais SET ativo = false WHERE id = ?
   └── Verificar: Não pode desativar se tiver setores ativos
```

#### 🧩 **COMPONENTES NECESSÁRIOS**

**Reutilizáveis:**
- `DataTable` - Tabela genérica de listagem
- `FormModal` - Modal de formulário genérico
- `ConfirmDialog` - Diálogo de confirmação
- `StatusBadge` - Badge de status (ativo/inativo)
- `ActionButtons` - Botões de ação (editar, desativar)

**Específicos:**
- `HospitalForm` - Formulário específico de hospital
- `HospitalList` - Lista de hospitais

#### ⚠️ **LACUNAS IDENTIFICADAS**

**LACUNA H1:** Validação de dependências antes de desativar
- **O que falta:** Não há validação que impede desativar hospital com setores ativos
- **Impacto:** Pode deixar setores órfãos ou inconsistências
- **Solução necessária:** Função SQL ou validação no backend que verifica:
  ```sql
  SELECT COUNT(*) FROM setores 
  WHERE hospital_id = ? AND ativo = true
  ```

**LACUNA H2:** Campo de descrição/observações
- **O que falta:** Não há campo para descrição ou observações do hospital
- **Impacto:** Limitação de informações sobre o hospital
- **Solução necessária:** Adicionar campo `descricao TEXT NULLABLE` (opcional)

---

### 2️⃣ **CRUD DE SETORES**

#### ✅ **DADOS DISPONÍVEIS (CONFIRMADOS)**

**Tabela:** `setores`

**Campos para CREATE:**
- `nome` (TEXT, obrigatório)
- `hospital_id` (UUID, obrigatório) → **Seletor de hospitais da organização**

**Campos para UPDATE:**
- `nome` (TEXT)
- `hospital_id` (UUID) → **Permite transferir setor entre hospitais**
- `ativo` (BOOLEAN)

**Campos para READ:**
- Todos + join com `hospitais` para mostrar nome do hospital

**Campos para DELETE:**
- Soft delete via `ativo = false`

#### 📍 **FLUXO FUNCIONAL**

```
1. LISTAGEM (/dashboard/setores)
   ├── Buscar: SELECT s.*, h.nome as hospital_nome 
   │           FROM setores s
   │           JOIN hospitais h ON h.id = s.hospital_id
   │           WHERE h.organizacao_id = get_user_active_org_id()
   ├── Filtrar por: hospital, ativo/inativo
   ├── Agrupar por: hospital (opcional)
   └── Exibir: Tabela com nome, hospital, status, ações

2. CRIAÇÃO (/dashboard/setores/novo)
   ├── Formulário:
   │   ├── Campo: nome (text, obrigatório)
   │   └── Campo: hospital_id (select, obrigatório)
   │       └── Opções: SELECT * FROM hospitais 
   │                   WHERE organizacao_id = get_user_active_org_id() 
   │                   AND ativo = true
   ├── Validação: setorSchema (já existe)
   └── Submit: INSERT INTO setores (nome, hospital_id, ativo)

3. EDIÇÃO (/dashboard/setores/[id]/editar)
   ├── Buscar: SELECT * FROM setores WHERE id = [id]
   ├── Formulário pré-preenchido
   ├── Validação: setorSchema
   └── Submit: UPDATE setores SET nome = ?, hospital_id = ?, ativo = ?

4. DESATIVAÇÃO
   ├── Verificar: Não pode desativar se tiver escalas ativas
   └── UPDATE setores SET ativo = false WHERE id = ?
```

#### 🧩 **COMPONENTES NECESSÁRIOS**

**Reutilizáveis:**
- `DataTable` (mesmo do hospitais)
- `FormModal` (mesmo do hospitais)
- `Select` - Componente de select (precisa criar)
- `HospitalSelect` - Select específico de hospitais

**Específicos:**
- `SetorForm` - Formulário específico
- `SetorList` - Lista de setores

#### ⚠️ **LACUNAS IDENTIFICADAS**

**LACUNA S1:** Validação de dependências antes de desativar
- **O que falta:** Não há validação que impede desativar setor com escalas ativas
- **Impacto:** Pode deixar escalas órfãs
- **Solução necessária:** Função SQL que verifica:
  ```sql
  SELECT COUNT(*) FROM escalas 
  WHERE setor_id = ? AND status = 'confirmado'
  ```

**LACUNA S2:** Validação ao transferir setor entre hospitais
- **O que falta:** Não há validação que impede transferir setor para hospital de outra organização
- **Impacto:** Quebra de isolamento de dados (mas RLS já previne)
- **Solução necessária:** Validação no frontend/backend que garante hospital pertence à mesma org

**LACUNA S3:** Campo de descrição/capacidade
- **O que falta:** Não há campo para informações adicionais do setor
- **Impacto:** Limitação de informações
- **Solução necessária:** Adicionar `descricao TEXT NULLABLE` (opcional)

---

### 3️⃣ **CRUD DE GRUPOS**

#### ✅ **DADOS DISPONÍVEIS (CONFIRMADOS)**

**Tabela:** `grupos`

**Campos para CREATE:**
- `nome` (TEXT, obrigatório)
- `tipo` (TEXT, obrigatório) ⚠️ **SEM VALIDAÇÃO DE VALORES**
- `organizacao_id` (UUID, obrigatório) → **Obtido automaticamente**

**Campos para UPDATE:**
- `nome` (TEXT)
- `tipo` (TEXT)
- `ativo` (BOOLEAN)

**Campos para READ:**
- Todos os campos

**Campos para DELETE:**
- Soft delete via `ativo = false`

#### 📍 **FLUXO FUNCIONAL**

```
1. LISTAGEM (/dashboard/grupos)
   ├── Buscar: SELECT * FROM grupos 
   │           WHERE organizacao_id = get_user_active_org_id()
   ├── Filtrar por: tipo, ativo/inativo
   ├── Agrupar por: tipo (opcional)
   └── Exibir: Tabela com nome, tipo, status, ações

2. CRIAÇÃO (/dashboard/grupos/novo)
   ├── Formulário:
   │   ├── Campo: nome (text, obrigatório)
   │   ├── Campo: tipo (text/select, obrigatório) ⚠️ SEM VALIDAÇÃO
   │   └── Campo: organizacao_id (hidden)
   ├── Validação: grupoSchema (já existe, mas tipo é TEXT livre)
   └── Submit: INSERT INTO grupos (nome, tipo, organizacao_id, ativo)

3. EDIÇÃO (/dashboard/grupos/[id]/editar)
   ├── Buscar: SELECT * FROM grupos WHERE id = [id]
   ├── Formulário pré-preenchido
   ├── Validação: grupoSchema
   └── Submit: UPDATE grupos SET nome = ?, tipo = ?, ativo = ?

4. DESATIVAÇÃO
   ├── Verificar: Não pode desativar se tiver profissionais ativos
   └── UPDATE grupos SET ativo = false WHERE id = ?
```

#### 🧩 **COMPONENTES NECESSÁRIOS**

**Reutilizáveis:**
- `DataTable`
- `FormModal`
- `StatusBadge`
- `ActionButtons`

**Específicos:**
- `GrupoForm` - Formulário específico
- `GrupoList` - Lista de grupos
- `TipoSelect` - Select de tipos (se houver enum)

#### ⚠️ **LACUNAS IDENTIFICADAS**

**LACUNA G1:** Validação de valores permitidos para `tipo`
- **O que falta:** Campo `tipo` é TEXT livre, sem enum ou validação
- **Impacto:** Pode ter valores inconsistentes (ex: "Médico", "médico", "Medico")
- **Solução necessária:** 
  - Opção A: Criar ENUM no banco: `tipo VARCHAR CHECK (tipo IN ('Médico', 'Enfermeiro', 'Fisioterapeuta', ...))`
  - Opção B: Tabela `tipos_grupo` com FK
  - Opção C: Manter TEXT mas validar no frontend com lista fixa

**LACUNA G2:** Validação de dependências antes de desativar
- **O que falta:** Não há validação que impede desativar grupo com profissionais ativos
- **Impacto:** Pode deixar profissionais órfãos
- **Solução necessária:** Função SQL:
  ```sql
  SELECT COUNT(*) FROM profissionais 
  WHERE grupo_id = ? AND ativo = true
  ```

**LACUNA G3:** Descrição do grupo
- **O que falta:** Não há campo para descrição
- **Impacto:** Limitação de informações
- **Solução necessária:** Adicionar `descricao TEXT NULLABLE` (opcional)

---

### 4️⃣ **CRUD DE PROFISSIONAIS**

#### ✅ **DADOS DISPONÍVEIS (CONFIRMADOS)**

**Tabela:** `profissionais`

**Campos para CREATE:**
- `nome` (TEXT, obrigatório)
- `email` (TEXT, obrigatório) ⚠️ **SEM VALIDAÇÃO DE FORMATO NO BANCO**
- `telefone` (TEXT, nullable, opcional)
- `grupo_id` (UUID, obrigatório) → **Seletor de grupos da organização**

**Campos para UPDATE:**
- `nome` (TEXT)
- `email` (TEXT) → **Validação de unicidade por organização**
- `telefone` (TEXT, nullable)
- `grupo_id` (UUID) → **Permite transferir entre grupos**
- `ativo` (BOOLEAN)

**Campos para READ:**
- Todos + join com `grupos` para mostrar nome do grupo

**Campos para DELETE:**
- Soft delete via `ativo = false`

**Validações Existentes:**
- ✅ Trigger: `check_profissional_email_unique` (email único por organização)

#### 📍 **FLUXO FUNCIONAL**

```
1. LISTAGEM (/dashboard/profissionais)
   ├── Buscar: SELECT p.*, g.nome as grupo_nome, g.tipo as grupo_tipo
   │           FROM profissionais p
   │           JOIN grupos g ON g.id = p.grupo_id
   │           WHERE g.organizacao_id = get_user_active_org_id()
   ├── Filtrar por: grupo, ativo/inativo, busca por nome/email
   ├── Ordenar por: nome, grupo, created_at
   └── Exibir: Tabela com nome, email, telefone, grupo, status, ações

2. CRIAÇÃO (/dashboard/profissionais/novo)
   ├── Formulário:
   │   ├── Campo: nome (text, obrigatório)
   │   ├── Campo: email (email, obrigatório)
   │   ├── Campo: telefone (tel, opcional)
   │   └── Campo: grupo_id (select, obrigatório)
   │       └── Opções: SELECT * FROM grupos 
   │                   WHERE organizacao_id = get_user_active_org_id() 
   │                   AND ativo = true
   ├── Validação: profissionalSchema (já existe)
   ├── Validação assíncrona: Verificar email único (trigger faz isso)
   └── Submit: INSERT INTO profissionais (nome, email, telefone, grupo_id, ativo)

3. EDIÇÃO (/dashboard/profissionais/[id]/editar)
   ├── Buscar: SELECT * FROM profissionais WHERE id = [id]
   ├── Formulário pré-preenchido
   ├── Validação: profissionalSchema
   ├── Validação assíncrona: Email único (exceto próprio registro)
   └── Submit: UPDATE profissionais SET nome = ?, email = ?, telefone = ?, grupo_id = ?, ativo = ?

4. DESATIVAÇÃO
   ├── Verificar: Não pode desativar se tiver escalas ativas futuras
   └── UPDATE profissionais SET ativo = false WHERE id = ?
```

#### 🧩 **COMPONENTES NECESSÁRIOS**

**Reutilizáveis:**
- `DataTable`
- `FormModal`
- `Select`
- `GrupoSelect` - Select específico de grupos
- `EmailInput` - Input com validação de email
- `PhoneInput` - Input com máscara de telefone (opcional)

**Específicos:**
- `ProfissionalForm` - Formulário específico
- `ProfissionalList` - Lista de profissionais

#### ⚠️ **LACUNAS IDENTIFICADAS**

**LACUNA P1:** Validação de formato de email no banco
- **O que falta:** Campo `email` é TEXT sem constraint de formato
- **Impacto:** Pode aceitar emails inválidos (mas trigger valida unicidade)
- **Solução necessária:** Adicionar CHECK ou confiar na validação frontend (já existe)

**LACUNA P2:** Validação de formato de telefone
- **O que falta:** Campo `telefone` é TEXT livre, sem formato padrão
- **Impacto:** Pode ter formatos inconsistentes
- **Solução necessária:** Máscara no frontend ou validação regex

**LACUNA P3:** Validação de dependências antes de desativar
- **O que falta:** Não há validação que impede desativar profissional com escalas futuras
- **Impacto:** Pode deixar escalas futuras sem profissional válido
- **Solução necessária:** Função SQL:
  ```sql
  SELECT COUNT(*) FROM escalas 
  WHERE profissional_id = ? 
  AND status = 'confirmado' 
  AND data_inicio > NOW()
  ```

**LACUNA P4:** Validação ao transferir profissional entre grupos
- **O que falta:** Não há validação que impede transferir para grupo de outra organização
- **Impacto:** Quebra de isolamento (mas RLS previne)
- **Solução necessária:** Validação frontend/backend

**LACUNA P5:** Campo de CPF/RG ou identificação
- **O que falta:** Não há campo para identificação única do profissional
- **Impacto:** Depende apenas de email para identificação
- **Solução necessária:** Adicionar `cpf TEXT NULLABLE` ou `identificacao TEXT NULLABLE` (opcional)

---

### 5️⃣ **CRUD DE ESCALAS**

#### ✅ **DADOS DISPONÍVEIS (CONFIRMADOS)**

**Tabela:** `escalas`

**Campos para CREATE:**
- `setor_id` (UUID, obrigatório) → **Seletor de setores**
- `profissional_id` (UUID, obrigatório) → **Seletor de profissionais**
- `data_inicio` (TIMESTAMPTZ, obrigatório)
- `data_fim` (TIMESTAMPTZ, obrigatório)
- `observacoes` (TEXT, nullable, opcional)
- `status` (TEXT, DEFAULT 'confirmado') → **CHECK: 'confirmado' ou 'cancelado'**
- `created_by` (UUID, obrigatório) → **Obtido automaticamente (auth.uid())**

**Campos para UPDATE:**
- Todos exceto `created_by` e `created_at`
- `updated_at` atualizado automaticamente via trigger

**Campos para READ:**
- Todos + joins com `setores`, `profissionais`, `hospitais` para contexto completo

**Campos para DELETE:**
- Não há DELETE físico → usar `status = 'cancelado'`

**Validações Existentes:**
- ✅ CHECK: `data_fim > data_inicio`
- ✅ CHECK: `status IN ('confirmado', 'cancelado')`
- ✅ Trigger: `update_escalas_updated_at`

**Validações no Código:**
- ✅ Função: `verificarProfissionalSetorMesmaOrg()` (já existe)
- ✅ Schema: `escalaSchema` e `escalaSchemaCompleto` (já existem)

#### 📍 **FLUXO FUNCIONAL**

```
1. LISTAGEM (/dashboard/escalas)
   ├── Buscar: SELECT e.*, 
   │                  s.nome as setor_nome,
   │                  h.nome as hospital_nome,
   │                  p.nome as profissional_nome,
   │                  g.nome as grupo_nome
   │           FROM escalas e
   │           JOIN setores s ON s.id = e.setor_id
   │           JOIN hospitais h ON h.id = s.hospital_id
   │           JOIN profissionais p ON p.id = e.profissional_id
   │           JOIN grupos g ON g.id = p.grupo_id
   │           WHERE h.organizacao_id = get_user_active_org_id()
   ├── Filtrar por: 
   │   ├── Período (data_inicio, data_fim)
   │   ├── Hospital
   │   ├── Setor
   │   ├── Profissional
   │   └── Status
   ├── Ordenar por: data_inicio, profissional, setor
   └── Exibir: Tabela/Calendário com todas as informações

2. CRIAÇÃO (/dashboard/escalas/nova)
   ├── Formulário:
   │   ├── Campo: setor_id (select, obrigatório)
   │   │   └── Opções: SELECT s.*, h.nome as hospital_nome
   │   │               FROM setores s
   │   │               JOIN hospitais h ON h.id = s.hospital_id
   │   │               WHERE h.organizacao_id = get_user_active_org_id()
   │   │               AND s.ativo = true
   │   ├── Campo: profissional_id (select, obrigatório)
   │   │   └── Opções: SELECT p.*, g.nome as grupo_nome
   │   │               FROM profissionais p
   │   │               JOIN grupos g ON g.id = p.grupo_id
   │   │               WHERE g.organizacao_id = get_user_active_org_id()
   │   │               AND p.ativo = true
   │   ├── Campo: data_inicio (datetime-local, obrigatório)
   │   ├── Campo: data_fim (datetime-local, obrigatório)
   │   ├── Campo: observacoes (textarea, opcional)
   │   └── Campo: status (select, default 'confirmado')
   ├── Validação síncrona: escalaSchema
   ├── Validação assíncrona: escalaSchemaCompleto
   │   └── Verificar: profissional e setor mesma organização
   ├── Validação de conflitos: getEscalasProfissionalPeriodo() (já existe)
   │   └── Alertar se houver sobreposição (mas permitir salvar)
   └── Submit: INSERT INTO escalas (setor_id, profissional_id, data_inicio, data_fim, observacoes, status, created_by)

3. EDIÇÃO (/dashboard/escalas/[id]/editar)
   ├── Buscar: SELECT * FROM escalas WHERE id = [id]
   ├── Formulário pré-preenchido
   ├── Validação: escalaSchemaCompleto
   ├── Validação de conflitos: Verificar sobreposição (exceto própria escala)
   └── Submit: UPDATE escalas SET setor_id = ?, profissional_id = ?, data_inicio = ?, data_fim = ?, observacoes = ?, status = ?

4. CANCELAMENTO
   ├── Ação: UPDATE escalas SET status = 'cancelado' WHERE id = ?
   └── Não pode cancelar escalas passadas? (regra de negócio não definida)
```

#### 🧩 **COMPONENTES NECESSÁRIOS**

**Reutilizáveis:**
- `DataTable`
- `FormModal`
- `Select`
- `DateTimePicker` - Seletor de data/hora (precisa criar)
- `StatusBadge` - Badge de status (confirmado/cancelado)
- `ConflictAlert` - Alerta de conflito de horário

**Específicos:**
- `EscalaForm` - Formulário específico (complexo)
- `EscalaList` - Lista de escalas
- `EscalaCalendar` - Visualização em calendário (futuro)
- `SetorSelect` - Select de setores com hospital
- `ProfissionalSelect` - Select de profissionais com grupo

#### ⚠️ **LACUNAS IDENTIFICADAS**

**LACUNA E1:** Validação de conflitos de horário (implementação)
- **O que falta:** Função `getEscalasProfissionalPeriodo()` existe, mas precisa ser integrada no formulário
- **Impacto:** Usuário pode criar escalas sobrepostas sem aviso
- **Solução necessária:** Integrar validação no `EscalaForm` e mostrar alerta visual

**LACUNA E2:** Regra de negócio para cancelamento de escalas passadas
- **O que falta:** Não há regra definida se pode cancelar escalas já executadas
- **Impacto:** Comportamento indefinido
- **Solução necessária:** Definir regra:
  - Opção A: Pode cancelar qualquer escala
  - Opção B: Não pode cancelar escalas com data_inicio < NOW()
  - Opção C: Pode cancelar mas com confirmação especial

**LACUNA E3:** Campo de horário de início/fim separado de data
- **O que falta:** Campo é TIMESTAMPTZ único, não há campos separados de hora
- **Impacto:** Interface pode precisar de dois campos (data + hora) ou datetime picker
- **Solução necessária:** Usar datetime-local no HTML5 ou componente customizado

**LACUNA E4:** Histórico de alterações
- **O que falta:** Não há log de quem alterou e quando (só created_by e updated_at)
- **Impacto:** Não há auditoria completa
- **Solução necessária:** Tabela `escalas_historico` ou campo `updated_by` (opcional)

**LACUNA E5:** Validação de duração mínima/máxima
- **O que falta:** Não há validação de duração mínima ou máxima de uma escala
- **Impacto:** Pode criar escalas de 1 minuto ou 1 mês
- **Solução necessária:** Adicionar validação no schema ou frontend:
  ```sql
  CHECK (data_fim - data_inicio >= INTERVAL '1 hour')
  CHECK (data_fim - data_inicio <= INTERVAL '24 hours')
  ```

---

## 🧩 COMPONENTES REUTILIZÁVEIS IDENTIFICADOS

### **Componentes Base (shadcn/ui - Já Existem)**
- ✅ `Button` - Botões
- ✅ `Input` - Campos de texto
- ✅ `Label` - Labels
- ✅ `Card` - Cards
- ✅ `Alert` - Alertas

### **Componentes a Criar (Reutilizáveis)**

#### 1. **DataTable** - Tabela genérica de listagem
```typescript
Props:
- data: T[]
- columns: ColumnDef<T>[]
- onEdit?: (row: T) => void
- onDelete?: (row: T) => void
- onToggleActive?: (row: T) => void
- filters?: FilterConfig[]
- pagination?: boolean
```

#### 2. **FormModal** - Modal de formulário genérico
```typescript
Props:
- open: boolean
- onClose: () => void
- title: string
- children: ReactNode
- onSubmit: () => void
- loading?: boolean
```

#### 3. **Select** - Select genérico
```typescript
Props:
- options: { value: string, label: string }[]
- value: string
- onChange: (value: string) => void
- placeholder?: string
- disabled?: boolean
```

#### 4. **StatusBadge** - Badge de status
```typescript
Props:
- status: 'ativo' | 'inativo' | 'confirmado' | 'cancelado'
- variant?: 'default' | 'success' | 'warning' | 'danger'
```

#### 5. **ConfirmDialog** - Diálogo de confirmação
```typescript
Props:
- open: boolean
- onClose: () => void
- onConfirm: () => void
- title: string
- message: string
- confirmText?: string
- cancelText?: string
```

#### 6. **DateTimePicker** - Seletor de data/hora
```typescript
Props:
- value: Date | null
- onChange: (date: Date | null) => void
- min?: Date
- max?: Date
- showTime?: boolean
```

#### 7. **SearchInput** - Campo de busca
```typescript
Props:
- value: string
- onChange: (value: string) => void
- placeholder?: string
- onSearch?: (value: string) => void
```

---

## 📊 RESUMO DE LACUNAS

### **LACUNAS CRÍTICAS (Bloqueiam Funcionalidade)**

| ID | CRUD | Descrição | Impacto | Prioridade |
|----|------|-----------|---------|------------|
| H1 | Hospitais | Validação antes de desativar (setores ativos) | Alto | Alta |
| S1 | Setores | Validação antes de desativar (escalas ativas) | Alto | Alta |
| G1 | Grupos | Validação de valores para `tipo` | Médio | Média |
| G2 | Grupos | Validação antes de desativar (profissionais ativos) | Alto | Alta |
| P3 | Profissionais | Validação antes de desativar (escalas futuras) | Alto | Alta |
| E1 | Escalas | Integração de validação de conflitos | Médio | Média |

### **LACUNAS IMPORTANTES (Melhoram UX)**

| ID | CRUD | Descrição | Impacto | Prioridade |
|----|------|-----------|---------|------------|
| H2 | Hospitais | Campo descrição | Baixo | Baixa |
| S2 | Setores | Validação ao transferir entre hospitais | Médio | Média |
| S3 | Setores | Campo descrição | Baixo | Baixa |
| G3 | Grupos | Campo descrição | Baixo | Baixa |
| P1 | Profissionais | Validação formato email no banco | Baixo | Baixa |
| P2 | Profissionais | Validação formato telefone | Baixo | Baixa |
| P4 | Profissionais | Validação ao transferir entre grupos | Médio | Média |
| P5 | Profissionais | Campo CPF/identificação | Baixo | Baixa |
| E2 | Escalas | Regra para cancelar escalas passadas | Médio | Média |
| E3 | Escalas | Interface de data/hora | Médio | Média |
| E4 | Escalas | Histórico de alterações | Baixo | Baixa |
| E5 | Escalas | Validação duração mínima/máxima | Baixo | Baixa |

---

## 🎯 PLANO DE IMPLEMENTAÇÃO DAS LACUNAS

### **FASE 1: Validações Críticas de Dependências**

**Objetivo:** Impedir inconsistências ao desativar registros com dependências

**Ações:**
1. Criar função SQL `check_hospital_has_active_setores(hospital_id UUID)`
2. Criar função SQL `check_setor_has_active_escalas(setor_id UUID)`
3. Criar função SQL `check_grupo_has_active_profissionais(grupo_id UUID)`
4. Criar função SQL `check_profissional_has_future_escalas(profissional_id UUID)`
5. Integrar validações nos formulários de desativação

**Arquivo:** `supabase/migrations/20250103000000_add_dependency_checks.sql`

---

### **FASE 2: Validações de Integridade**

**Objetivo:** Garantir consistência ao transferir registros entre entidades

**Ações:**
1. Criar função SQL `validate_setor_hospital_org(setor_id UUID, hospital_id UUID)`
2. Criar função SQL `validate_profissional_grupo_org(profissional_id UUID, grupo_id UUID)`
3. Integrar validações nos formulários de edição

**Arquivo:** `supabase/migrations/20250103000001_add_integrity_checks.sql`

---

### **FASE 3: Melhorias de Schema (Opcionais)**

**Objetivo:** Adicionar campos opcionais para melhor informação

**Ações:**
1. Adicionar `descricao TEXT NULLABLE` em `hospitais`
2. Adicionar `descricao TEXT NULLABLE` em `setores`
3. Adicionar `descricao TEXT NULLABLE` em `grupos`
4. Adicionar `cpf TEXT NULLABLE` em `profissionais` (opcional)
5. Adicionar `updated_by UUID NULLABLE` em `escalas` (opcional)

**Arquivo:** `supabase/migrations/20250103000002_add_optional_fields.sql`

---

### **FASE 4: Validação de Tipo de Grupo**

**Objetivo:** Padronizar valores de `tipo` em grupos

**Opções:**
- **Opção A:** Criar ENUM no PostgreSQL
- **Opção B:** Criar tabela `tipos_grupo` com FK
- **Opção C:** Manter TEXT mas validar no frontend

**Recomendação:** Opção C (mais flexível, sem alterar schema)

**Ações:**
1. Criar constante `TIPOS_GRUPO_PERMITIDOS` no frontend
2. Atualizar `grupoSchema` para validar contra lista
3. Usar Select com opções fixas no formulário

---

### **FASE 5: Regras de Negócio de Escalas**

**Objetivo:** Definir comportamento para cancelamento e validações

**Ações:**
1. Definir regra: "Não pode cancelar escalas com data_inicio < NOW()"
2. Implementar validação no formulário
3. Adicionar validação de duração mínima (ex: 1 hora)
4. Adicionar validação de duração máxima (ex: 24 horas)

**Arquivo:** Atualizar `lib/validations/escala.ts`

---

## 📁 ESTRUTURA DE ARQUIVOS PROPOSTA

```
app/(dashboard)/
├── hospitais/
│   ├── page.tsx                    # Listagem
│   ├── novo/
│   │   └── page.tsx               # Criação
│   └── [id]/
│       └── editar/
│           └── page.tsx           # Edição
├── setores/
│   ├── page.tsx
│   ├── novo/
│   │   └── page.tsx
│   └── [id]/
│       └── editar/
│           └── page.tsx
├── grupos/
│   ├── page.tsx
│   ├── novo/
│   │   └── page.tsx
│   └── [id]/
│       └── editar/
│           └── page.tsx
├── profissionais/
│   ├── page.tsx
│   ├── novo/
│   │   └── page.tsx
│   └── [id]/
│       └── editar/
│           └── page.tsx
└── escalas/
    ├── page.tsx
    ├── nova/
    │   └── page.tsx
    └── [id]/
        └── editar/
            └── page.tsx

components/
├── ui/                             # shadcn/ui (já existe)
├── crud/                           # Componentes reutilizáveis
│   ├── DataTable.tsx
│   ├── FormModal.tsx
│   ├── Select.tsx
│   ├── StatusBadge.tsx
│   ├── ConfirmDialog.tsx
│   ├── DateTimePicker.tsx
│   └── SearchInput.tsx
├── hospitais/
│   ├── HospitalForm.tsx
│   └── HospitalList.tsx
├── setores/
│   ├── SetorForm.tsx
│   └── SetorList.tsx
├── grupos/
│   ├── GrupoForm.tsx
│   └── GrupoList.tsx
├── profissionais/
│   ├── ProfissionalForm.tsx
│   └── ProfissionalList.tsx
└── escalas/
    ├── EscalaForm.tsx
    ├── EscalaList.tsx
    └── EscalaCalendar.tsx          # Futuro

lib/
├── actions/                        # Server actions
│   ├── hospitais.ts
│   ├── setores.ts
│   ├── grupos.ts
│   ├── profissionais.ts
│   └── escalas.ts
└── hooks/                          # Custom hooks
    ├── use-hospitais.ts
    ├── use-setores.ts
    ├── use-grupos.ts
    ├── use-profissionais.ts
    └── use-escalas.ts
```

---

## ✅ CONCLUSÃO DA ANÁLISE

### **O QUE PODE SER IMPLEMENTADO AGORA**

✅ **Todos os 5 CRUDs podem ser implementados** com os dados existentes no banco

✅ **Validações básicas já existem** (schemas Zod criados)

✅ **RLS já está configurado** para todos os CRUDs

✅ **Componentes base existem** (shadcn/ui)

### **O QUE PRECISA SER RESOLVIDO ANTES**

⚠️ **Validações de dependências** (Fase 1) - Crítico para evitar inconsistências

⚠️ **Validação de tipo de grupo** (Fase 4) - Importante para consistência

⚠️ **Integração de validação de conflitos** (E1) - Importante para UX

### **PRÓXIMOS PASSOS**

1. **Validar lacunas** com o usuário
2. **Implementar validações críticas** (Fase 1)
3. **Criar componentes reutilizáveis** (DataTable, FormModal, etc)
4. **Implementar CRUDs** seguindo ordem de dependência:
   - Hospitais → Setores
   - Grupos → Profissionais
   - Escalas (depende de Setores e Profissionais)

---

**Análise completa realizada em:** 28/12/2025  
**Status:** ✅ Pronto para implementação após validação das lacunas

