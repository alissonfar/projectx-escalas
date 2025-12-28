# 🏥 Sistema de Gestão de Escalas - Pega Plantão

Sistema completo para gerenciamento de escalas médicas e de profissionais de saúde.

## ✅ Status da Implementação

**Fase 1: Autenticação e Layout Base - COMPLETO ✅**

- ✅ Sistema de login e cadastro
- ✅ Gestão de múltiplas organizações
- ✅ Layout principal responsivo
- ✅ Proteção de rotas e segurança RLS
- ✅ Design profissional baseado em referência

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- NPM ou Yarn
- Conta Supabase (ou Supabase local)

### Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# Criar arquivo .env.local na raiz do projeto
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 3. Aplicar migrations do banco de dados
npx supabase db push

# 4. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`

## 📖 Documentação Completa

O projeto inclui documentação detalhada:

- **`DOCUMENTACAO_FLUXO_AUTH.md`** - Documentação completa do fluxo de autenticação
- **`GUIA_VISUAL.md`** - Diagramas visuais e fluxos
- **`RESUMO_TECNICO.md`** - Resumo técnico da implementação

## 🎯 Funcionalidades Implementadas

### Autenticação

- ✅ Registro de novos usuários
- ✅ Login com email e senha
- ✅ Logout seguro
- ✅ Proteção de rotas via middleware
- ✅ Sessões persistentes

### Gestão de Organizações

- ✅ Criar múltiplas organizações
- ✅ Selecionar organização ativa
- ✅ Trocar entre organizações
- ✅ Isolamento completo de dados por organização (RLS)

### Layout e Interface

- ✅ Header com logo e navegação
- ✅ Sidebar responsiva e colapsável
- ✅ Seletor de organização no header
- ✅ Menu de usuário com logout
- ✅ Design responsivo (mobile/tablet/desktop)
- ✅ Animações suaves e modernas

## 🏗️ Arquitetura

### Stack Tecnológico

- **Frontend:** Next.js 14 (App Router)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Estilização:** Tailwind CSS
- **Componentes:** shadcn/ui
- **Linguagem:** TypeScript
- **Segurança:** Row Level Security (RLS)

### Estrutura do Banco de Dados

```
auth.users (Supabase Auth)
    ↓
profiles (1:1)
    ↓
organizacoes (1:N)
    ↓
├─► hospitais → setores
└─► grupos → profissionais
        ↓
    escalas (conecta setores + profissionais)
```

## 🔐 Segurança

- ✅ **Autenticação:** Supabase Auth com JWT
- ✅ **Autorização:** Row Level Security (RLS) em todas as tabelas
- ✅ **Senhas:** Criptografadas com bcrypt
- ✅ **Isolamento:** Dados completamente isolados por organização
- ✅ **Validações:** Frontend + Backend + Database triggers

## 📱 Responsividade

O sistema é totalmente responsivo:

- **Desktop (1280px+):** Layout completo com sidebar fixa
- **Tablet (768-1279px):** Sidebar colapsável
- **Mobile (<768px):** Menu overlay com backdrop

## 🧪 Como Testar

### Fluxo Completo de Teste

1. **Criar Conta:**
   - Acesse `/cadastro`
   - Preencha: nome, email, senha
   - Clique "Criar conta"

2. **Criar Organização:**
   - Digite o nome da organização
   - Clique "Criar e Acessar"

3. **Acessar Dashboard:**
   - Veja o layout completo
   - Header + Sidebar + Conteúdo

4. **Testar Funcionalidades:**
   - Trocar organização (header)
   - Colapsar sidebar
   - Fazer logout

## 📂 Estrutura do Projeto

```
projectx_escalas/
├── app/
│   ├── (auth)/              # Rotas públicas (login, cadastro)
│   ├── (dashboard)/         # Rotas protegidas (dashboard)
│   ├── page.tsx            # Página raiz
│   └── layout.tsx          # Layout global
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   └── dashboard/          # Componentes do dashboard
├── lib/
│   ├── actions/            # Server actions
│   ├── supabase/           # Config Supabase
│   └── validations/        # Schemas de validação
├── supabase/
│   └── migrations/         # Migrations SQL
├── types/                  # Tipos TypeScript
└── middleware.ts           # Middleware Next.js
```

## 🎨 Design System

### Cores Principais

- **Primária:** `#1E73BE` (Azul médico)
- **Secundária:** `#2589D4` (Azul claro)
- **Fundo:** `#F9FAFB` (Cinza claro)
- **Sucesso:** `#10B981` (Verde)
- **Erro:** `#EF4444` (Vermelho)

### Componentes Base

Todos os componentes seguem o design system do **shadcn/ui**:
- Button
- Input
- Label
- Card
- Alert

## 🚧 Próximas Funcionalidades

As seguintes funcionalidades estão planejadas mas **não implementadas** (escopo da fase atual era apenas autenticação + layout):

- ⏳ CRUD de Hospitais
- ⏳ CRUD de Setores
- ⏳ CRUD de Grupos
- ⏳ CRUD de Profissionais
- ⏳ CRUD de Escalas
- ⏳ Calendário de visualização
- ⏳ Detecção de conflitos de horário
- ⏳ Exportação PDF e Excel

## 📝 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm run start

# Linting
npm run lint

# Type checking
npm run type-check

# Gerar tipos do Supabase
npm run gen-types
```

## 🔧 Configuração do Supabase

### Migrations

O projeto inclui 2 migrations essenciais:

1. **`20250101000000_initial_schema.sql`**
   - Cria todas as tabelas
   - Configura RLS
   - Define políticas de segurança

2. **`20250102000000_auto_create_org.sql`**
   - Trigger para criar profile automaticamente
   - Vinculação de usuário com organização

### Aplicar Migrations

```bash
# Com Supabase CLI
npx supabase db push

# Ou aplicar manualmente no dashboard do Supabase
```

## 🐛 Troubleshooting

### Erro: "Usuário não possui organização ativa"

**Solução:** Crie uma organização na tela de seleção.

### Erro: RLS não está filtrando dados

**Solução:** Verifique se as migrations foram aplicadas corretamente.

### Erro: Redirect loop

**Solução:** Limpe os cookies do navegador e faça login novamente.

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Autores

- **AI Assistant** - Implementação inicial completa
- **Cliente** - Especificação e design de referência

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação em `DOCUMENTACAO_FLUXO_AUTH.md`
2. Veja os diagramas em `GUIA_VISUAL.md`
3. Leia o resumo técnico em `RESUMO_TECNICO.md`

---

**Status:** ✅ Fase 1 Completa - Autenticação e Layout  
**Versão:** 1.0.0  
**Última Atualização:** 28 de Dezembro de 2025
