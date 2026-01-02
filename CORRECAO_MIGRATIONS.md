# 🚨 CORREÇÃO DE ERRO - Migrations Não Aplicadas

## ❌ PROBLEMA IDENTIFICADO

```
Erro: column organizacoes.criado_por does not exist
```

**Causa:** As migrations SQL não foram aplicadas no banco de dados local do Supabase.

---

## ✅ SOLUÇÃO PASSO A PASSO

### Opção 1: Aplicar Migrations via Supabase CLI (RECOMENDADO)

```bash
# 1. Parar o servidor Next.js (Ctrl+C no terminal)

# 2. Verificar se Supabase está rodando
npx supabase status

# 3. Aplicar as migrations
npx supabase db reset

# OU se preferir aplicar apenas as novas migrations:
npx supabase db push

# 4. Reiniciar o servidor Next.js
npm run dev
```

---

### Opção 2: Aplicar Manualmente via SQL Editor

Se a Opção 1 não funcionar, aplique manualmente:

#### Passo 1: Acessar o Supabase Studio

Abra no navegador:
```
http://127.0.0.1:54323
```

#### Passo 2: Ir para SQL Editor

1. Na sidebar esquerda, clique em **SQL Editor**
2. Clique em **New query**

#### Passo 3: Copiar e Executar Migration 1

Copie TODO o conteúdo de:
```
supabase/migrations/20250101000000_initial_schema.sql
```

Cole no editor e clique em **RUN** (ou Ctrl+Enter)

#### Passo 4: Copiar e Executar Migration 2

Copie TODO o conteúdo de:
```
supabase/migrations/20250102000000_auto_create_org.sql
```

Cole no editor e clique em **RUN**

#### Passo 5: Verificar se Funcionou

Execute no SQL Editor:
```sql
-- Verificar se a tabela existe com as colunas corretas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organizacoes';
```

**Deve retornar:**
```
column_name     | data_type
----------------|------------------
id              | uuid
nome            | text
criado_por      | uuid
ativo           | boolean
created_at      | timestamp with time zone
```

---

### Opção 3: Reset Completo do Banco (Última Alternativa)

⚠️ **ATENÇÃO: Isso apaga todos os dados!**

```bash
# 1. Parar tudo
Ctrl+C no terminal do Next.js

# 2. Parar Supabase
npx supabase stop

# 3. Reiniciar com reset
npx supabase start --reset

# 4. Verificar status
npx supabase status

# 5. Aplicar migrations
npx supabase db push

# 6. Reiniciar Next.js
npm run dev
```

---

## 🧪 TESTAR SE FUNCIONOU

Após aplicar as migrations:

### 1. Verificar no SQL Editor

```sql
-- Deve retornar as colunas corretas
\d+ organizacoes
```

### 2. Tentar Criar uma Organização

1. Acesse `http://localhost:3000/cadastro`
2. Crie uma conta
3. Crie uma organização
4. O erro **NÃO deve mais aparecer**

### 3. Verificar Console do Navegador

- Não deve mais aparecer erro 400
- Request deve retornar 200 OK

---

## 📝 COMANDOS ÚTEIS

```bash
# Ver status do Supabase
npx supabase status

# Ver logs do banco
npx supabase db logs

# Listar migrations aplicadas
npx supabase migration list

# Aplicar migrations pendentes
npx supabase db push

# Reset completo (apaga tudo)
npx supabase db reset
```

---

## 🎯 COMANDOS PARA EXECUTAR AGORA

**Execute na ordem:**

```bash
# Terminal 1: Parar o Next.js
Ctrl+C

# Terminal 2: Aplicar migrations
npx supabase db push

# Terminal 1: Reiniciar Next.js
npm run dev
```

---

## ⚠️ SE AINDA DER ERRO

### Erro: "Supabase CLI não encontrado"

```bash
npm install -g supabase
```

### Erro: "Cannot connect to database"

```bash
# Reiniciar Supabase
npx supabase stop
npx supabase start
```

### Erro: "Migration already applied"

Isso é normal! Significa que a migration já foi aplicada com sucesso.

---

## ✅ RESULTADO ESPERADO

Após aplicar as migrations corretamente:

```sql
-- Esta query deve funcionar sem erros:
SELECT * FROM organizacoes WHERE criado_por = '[user_id]';
```

E no navegador:
```
✅ Status 200 OK
✅ Sem erros no console
✅ Organização criada com sucesso
```

---

## 📞 AINDA COM PROBLEMAS?

Se após seguir todos os passos o erro persistir:

1. Verifique se há outro Supabase rodando em outra porta
2. Verifique o arquivo `.env.local` com as URLs corretas
3. Tente reset completo (Opção 3)

---

**Criado em:** 28/12/2025  
**Problema:** Migrations não aplicadas  
**Solução:** Aplicar via `supabase db push`




