# 🎨 GUIA VISUAL - DESIGN E FLUXOS

## 🎯 VISÃO GERAL DO FLUXO

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO                           │
└─────────────────────────────────────────────────────────────┘

         INÍCIO
           │
           ▼
    ┌──────────────┐
    │   / (root)   │  → Redireciona automaticamente
    └──────┬───────┘
           │
      ┌────┴────┐
      │         │
  Logado?    Não logado?
      │         │
      ▼         ▼
  /dashboard  /login


┌─────────────────────────────────────────────────────────────┐
│              FLUXO PARA NOVO USUÁRIO                         │
└─────────────────────────────────────────────────────────────┘

  /login
    │
    │ [Clica "Cadastre-se"]
    ▼
  /cadastro
    │
    │ [Preenche formulário]
    │ • Nome Completo
    │ • Email
    │ • Senha
    │ • Confirmar Senha
    │
    │ [Clica "Criar conta"]
    ▼
  ┌─────────────────────┐
  │   Supabase Auth     │
  │  Cria auth.users    │
  └──────┬──────────────┘
         │
         │ [TRIGGER automático]
         ▼
  ┌─────────────────────┐
  │  Cria profiles      │
  │  org_ativa = NULL   │
  └──────┬──────────────┘
         │
         ▼
  /selecionar-organizacao?novo=true
    │
    │ [Mostra formulário]
    │ • Digite nome da organização
    │
    │ [Clica "Criar e Acessar"]
    ▼
  ┌─────────────────────┐
  │ INSERT organizacoes │
  │ UPDATE profiles     │
  │  org_ativa = UUID   │
  └──────┬──────────────┘
         │
         ▼
  /dashboard ✅
    │
    │ Layout completo carregado
    │ • Header
    │ • Sidebar
    │ • Conteúdo
    └─────────────────────


┌─────────────────────────────────────────────────────────────┐
│            FLUXO PARA USUÁRIO EXISTENTE                      │
└─────────────────────────────────────────────────────────────┘

  /login
    │
    │ [Preenche credenciais]
    │ • Email
    │ • Senha
    │
    │ [Clica "Entrar"]
    ▼
  ┌─────────────────────┐
  │   Supabase Auth     │
  │  Valida credenciais │
  └──────┬──────────────┘
         │
         │ [Busca profile]
         ▼
  ┌─────────────────────┐
  │ profile.org_ativa?  │
  └──────┬──────────────┘
         │
    ┌────┴────┐
    │         │
  NULL     Tem UUID
    │         │
    ▼         ▼
  /selecionar  /dashboard ✅
   -organizacao


┌─────────────────────────────────────────────────────────────┐
│              TROCA DE ORGANIZAÇÃO                            │
└─────────────────────────────────────────────────────────────┘

  /dashboard
    │
    │ [Clica seletor de org no header]
    ▼
  ┌─────────────────────┐
  │ Dropdown com lista  │
  │ • Hospital Central  │ ← Ativa
  │ • Clínica São José  │
  │ + Nova Organização  │
  └──────┬──────────────┘
         │
    ┌────┴────┐
    │         │
  Seleciona  Cria nova
  existente    │
    │          ▼
    │     [Formulário]
    │     Nome da org
    │          │
    │     [Clica criar]
    │          │
    │    ┌─────▼──────────┐
    │    │ INSERT org     │
    │    │ UPDATE profile │
    │    └────────────────┘
    │          │
    └────┬─────┘
         │
         ▼
  ┌─────────────────────┐
  │ UPDATE profiles     │
  │ org_ativa = [novo]  │
  └──────┬──────────────┘
         │
         ▼
  Refresh automático
  RLS filtra nova org ✅
```

---

## 🗄️ DIAGRAMA DO BANCO DE DADOS

```
┌─────────────────────────────────────────────────────────────┐
│                    TABELAS PRINCIPAIS                        │
└─────────────────────────────────────────────────────────────┘


  auth.users (Supabase Auth)
  ┌──────────────────────────┐
  │ id (PK)                  │
  │ email                    │
  │ encrypted_password       │
  │ raw_user_meta_data       │
  │  └─ nome_completo        │
  └──────┬───────────────────┘
         │
         │ 1:1
         ▼
  public.profiles
  ┌──────────────────────────┐
  │ id (PK) ─────────────────┼─┐
  │ nome_completo            │ │
  │ organizacao_ativa_id (FK)│ │ Determina qual
  │ created_at               │ │ org está ativa
  └──────┬───────────────────┘ │
         │                      │
         │ N:1                  │
         ▼                      │
  public.organizacoes          │
  ┌──────────────────────────┐ │
  │ id (PK) ◄────────────────┼─┘
  │ nome                     │
  │ criado_por (FK) ─────────┼───┐
  │ ativo                    │   │ Referência
  │ created_at               │   │ para quem
  └──────┬───────────────────┘   │ criou
         │                        │
         │ 1:N                    │
         ├────────────────────────┘
         │
    ┌────┴────┬─────────┐
    │         │         │
    ▼         ▼         ▼
hospitais  grupos   [outras]
    │         │
  1:N       1:N
    │         │
    ▼         ▼
 setores  profissionais
    │         │
    └────┬────┘
         │ N:N
         ▼
      escalas


┌─────────────────────────────────────────────────────────────┐
│                  HIERARQUIA DETALHADA                        │
└─────────────────────────────────────────────────────────────┘

ORGANIZAÇÃO
    │
    ├─► HOSPITAIS
    │      └─► SETORES
    │
    └─► GRUPOS
           └─► PROFISSIONAIS

ESCALA conecta:
    SETOR (de um hospital) + PROFISSIONAL (de um grupo)
    
    Validação: Ambos devem pertencer à mesma ORGANIZAÇÃO!
```

---

## 🎨 DESIGN SYSTEM

```
┌─────────────────────────────────────────────────────────────┐
│                      CORES                                   │
└─────────────────────────────────────────────────────────────┘

Primária (Azul Médico)
  #1E73BE  ████████  Botões, links, destaques
  #1557A0  ████████  Hover primário
  #2589D4  ████████  Variação clara

Neutros
  #F9FAFB  ░░░░░░░░  Fundo da aplicação
  #FFFFFF  ████████  Cards, modais
  #E5E7EB  ████████  Bordas
  #6B7280  ████████  Texto secundário
  #111827  ████████  Texto principal

Feedback
  #10B981  ████████  Sucesso
  #F59E0B  ████████  Aviso
  #EF4444  ████████  Erro
  #3B82F6  ████████  Info


┌─────────────────────────────────────────────────────────────┐
│                    TIPOGRAFIA                                │
└─────────────────────────────────────────────────────────────┘

H1 - Display Grande
  • Tamanho: 3xl (30px)
  • Peso: Bold (700)
  • Uso: Títulos principais

H2 - Seção
  • Tamanho: 2xl (24px)
  • Peso: Semibold (600)
  • Uso: Títulos de seções

H3 - Card
  • Tamanho: lg (18px)
  • Peso: Semibold (600)
  • Uso: Títulos de cards

Body
  • Tamanho: base (16px)
  • Peso: Regular (400)
  • Uso: Texto padrão

Small
  • Tamanho: sm (14px)
  • Peso: Medium (500)
  • Uso: Labels, subtexts

Extra Small
  • Tamanho: xs (12px)
  • Peso: Regular (400)
  • Uso: Datas, metadados


┌─────────────────────────────────────────────────────────────┐
│                    ESPAÇAMENTOS                              │
└─────────────────────────────────────────────────────────────┘

Compacto
  • Gap: 2 (8px)
  • Uso: Dentro de componentes

Padrão
  • Gap: 4 (16px)
  • Uso: Entre elementos relacionados

Médio
  • Gap: 6 (24px)
  • Uso: Entre seções

Grande
  • Gap: 8 (32px)
  • Uso: Separação de áreas

Extra Grande
  • Gap: 12+ (48px+)
  • Uso: Layout principal


┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES                               │
└─────────────────────────────────────────────────────────────┘

Botão Primário
┌─────────────────────┐
│   Texto do Botão    │  • bg: #1E73BE
└─────────────────────┘  • hover: #1557A0
                         • h: 44px
                         • rounded: lg (8px)

Botão Secundário
┌─────────────────────┐
│   Texto do Botão    │  • bg: white
└─────────────────────┘  • border: #E5E7EB
                         • hover: #F9FAFB

Input de Texto
┌─────────────────────┐
│ Digite aqui...      │  • border: #E5E7EB
└─────────────────────┘  • focus: #1E73BE
                         • h: 44px

Card
┌─────────────────────────────┐
│                             │  • bg: white
│   Conteúdo do Card          │  • border: #E5E7EB
│                             │  • rounded: xl (12px)
│                             │  • shadow: sm
└─────────────────────────────┘
```

---

## 📱 LAYOUTS RESPONSIVOS

```
┌─────────────────────────────────────────────────────────────┐
│                    DESKTOP (1280px+)                         │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ [☰] 🏥 ESCALA FISIO      [🏢 Hospital] [👤 User ▼]       │ Header
├────────┬───────────────────────────────────────────────────┤
│        │                                                   │
│  Nav   │              Main Content                        │
│  Menu  │                                                   │
│        │   ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  📊    │   │  Card 1  │ │  Card 2  │ │  Card 3  │       │
│  📅    │   └──────────┘ └──────────┘ └──────────┘       │
│  👥    │                                                   │
│  🏥    │   ┌───────────────────────────────────────┐     │
│  📁    │   │                                       │     │
│  👨‍👩‍👧‍👦    │   │         Content Area              │     │
│        │   │                                       │     │
│        │   └───────────────────────────────────────┘     │
└────────┴───────────────────────────────────────────────────┘
256px     Flex-1


┌─────────────────────────────────────────────────────────────┐
│                    TABLET (768px - 1279px)                   │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ [☰] 🏥 ESCALA FISIO      [🏢] [👤 User ▼]                │ Header
├────────┬───────────────────────────────────────────────────┤
│        │                                                   │
│  Nav   │              Main Content                        │
│  Menu  │                                                   │
│        │   ┌───────────┐ ┌───────────┐                   │
│  📊    │   │  Card 1   │ │  Card 2   │                   │
│  📅    │   └───────────┘ └───────────┘                   │
│  👥    │                                                   │
│  🏥    │   ┌───────────────────────────┐                 │
│        │   │      Content Area         │                 │
│        │   └───────────────────────────┘                 │
└────────┴───────────────────────────────────────────────────┘
200px     Flex-1


┌─────────────────────────────────────────────────────────────┐
│                    MOBILE (< 768px)                          │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ [☰] 🏥          [🏢] [👤]             │ Header
├────────────────────────────────────────┤
│                                        │
│            Main Content                │
│                                        │
│   ┌──────────────────────────────┐   │
│   │         Card 1               │   │
│   └──────────────────────────────┘   │
│                                        │
│   ┌──────────────────────────────┐   │
│   │         Card 2               │   │
│   └──────────────────────────────┘   │
│                                        │
│   ┌──────────────────────────────┐   │
│   │      Content Area            │   │
│   └──────────────────────────────┘   │
└────────────────────────────────────────┘

[Sidebar como overlay quando ativo]
```

---

## 🔐 VISUALIZAÇÃO RLS

```
┌─────────────────────────────────────────────────────────────┐
│              COMO O RLS FUNCIONA                             │
└─────────────────────────────────────────────────────────────┘

Usuário faz query:
  SELECT * FROM hospitais

PostgreSQL intercepta e adiciona:
  SELECT * FROM hospitais
  WHERE organizacao_id = get_user_active_org_id()
                         └─────┬──────────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Busca no profile:   │
                    │ organizacao_ativa_id│
                    └──────────┬──────────┘
                               │
                               ▼
                    Retorna apenas registros
                    dessa organização!


Exemplo prático:

  Banco de dados real:
  ┌────────────────────────────────────────┐
  │ hospitais                              │
  ├────────────────────────────────────────┤
  │ id  | nome           | organizacao_id │
  │ 1   | Hospital A     | org-111        │
  │ 2   | Hospital B     | org-222        │
  │ 3   | Hospital C     | org-111        │
  │ 4   | Hospital D     | org-333        │
  └────────────────────────────────────────┘

  Profile do usuário:
  organizacao_ativa_id = org-111

  Usuário vê:
  ┌────────────────────────────────────────┐
  │ hospitais                              │
  ├────────────────────────────────────────┤
  │ id  | nome           | organizacao_id │
  │ 1   | Hospital A     | org-111        │ ✅
  │ 3   | Hospital C     | org-111        │ ✅
  └────────────────────────────────────────┘

  Registros 2 e 4 são invisíveis! 🔒
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

```
□ Criar conta nova
  □ Validação de senhas coincidem
  □ Validação de senha mínima
  □ Email válido
  □ Profile criado automaticamente

□ Criar organização
  □ Nome não vazio
  □ Profile atualizado com org_ativa_id
  □ Redirecionado para dashboard

□ Fazer login
  □ Credenciais validadas
  □ Redireciona conforme org ativa
  □ Sessão mantida

□ Selecionar organização
  □ Lista apenas orgs do usuário
  □ Trocar organização atualiza profile
  □ Dados filtrados pela nova org

□ Layout dashboard
  □ Header visível
  □ Sidebar navegável
  □ Seletor de org funcional
  □ Menu de usuário funcional
  □ Logout funciona
  □ Responsivo mobile/tablet/desktop

□ Proteção de rotas
  □ Rota / redireciona
  □ Rotas auth acessíveis sem login
  □ Dashboard requer login
  □ Dashboard requer org ativa
  □ Login redireciona para dashboard se logado
```

---

**Criado por:** AI Assistant  
**Data:** 28/12/2025  
**Propósito:** Documentação visual e diagramas de fluxo



