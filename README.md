# Sistema de Escalas - MVP

Sistema web para coordenadores criarem e gerenciarem escalas de plantonistas com alertas de conflito e exportação.

## Stack Tecnológica

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Calendário**: React Big Calendar (a ser instalado)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Exportação**: jsPDF (PDF) + xlsx (Excel)
- **State Management**: Zustand
- **Formulários**: React Hook Form + Zod

## Estrutura do Projeto

```
projectx_escalas/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   └── ui/               # Componentes shadcn/ui
├── lib/                  # Utilitários e helpers
│   ├── supabase/        # Clientes Supabase
│   ├── validations/     # Schemas Zod
│   ├── export/          # Funções de exportação
│   └── utils/           # Utilitários gerais
├── hooks/               # React Hooks customizados
├── stores/              # Zustand stores
├── types/               # Tipos TypeScript
└── supabase/            # Configuração Supabase
    └── migrations/      # Migrations SQL
```

## Setup Inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase Local

O Supabase CLI já está configurado. Para iniciar o ambiente local:

```bash
supabase start
```

Copie as credenciais exibidas e crie um arquivo `.env.local`:

```bash
cp .env.local.example .env.local
```

Edite `.env.local` com as credenciais do Supabase local.

### 3. Aplicar Migrations

```bash
supabase db reset
```

Ou para aplicar apenas as migrations:

```bash
supabase migration up
```

### 4. Executar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Modelo de Dados

O sistema possui as seguintes entidades principais:

- **Organizacao**: Organizações do usuário
- **Hospital**: Hospitais vinculados a uma organização
- **Grupo**: Grupos de profissionais (ex: Fisioterapeutas, Médicos)
- **Setor**: Setores do hospital (ex: UTI 1, Emergência)
- **Profissional**: Profissionais que podem ser escalados
- **Escala**: Escalas de plantão com data/hora início e fim
- **Profile**: Perfil do usuário com organização ativa

## Funcionalidades Principais

- ✅ Autenticação com Supabase Auth
- ✅ CRUD de Hierarquia (Organização → Hospital → Grupo/Setor)
- ✅ CRUD de Profissionais
- ✅ CRUD de Escalas com verificação de conflitos
- ✅ Visualização em calendário
- ✅ Exportação PDF e Excel
- ✅ RLS (Row Level Security) por organização

## Próximos Passos

1. Implementar telas de autenticação
2. Criar componentes de CRUD para cada entidade
3. Implementar calendário com React Big Calendar
4. Adicionar sistema de alertas de conflito
5. Implementar exportação PDF/Excel
6. Polimento da UI/UX

## Referências

- [PRD Inicial](./PRD%20INICIAL.txt) - Documento de requisitos completo
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

