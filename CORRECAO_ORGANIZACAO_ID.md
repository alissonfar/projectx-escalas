# 🔧 CORREÇÃO: Campo organizacao_id na Validação

**Data:** 28 de Dezembro de 2025  
**Problema:** Validação falhando porque `organizacao_id` estava vazio no frontend

---

## 🔴 PROBLEMA IDENTIFICADO

### **Causa Raiz**

O campo `organizacao_id` era obrigatório no schema de validação do frontend, mas:
- Não é preenchido pelo usuário no formulário
- É preenchido automaticamente no servidor a partir do `profile.organizacao_ativa_id`

**Resultado:** A validação do react-hook-form falhava antes mesmo de chegar no servidor.

**Logs do erro:**
```
❌ Erros de validação: { organizacao_id: {...} }
❌ Campos com erro: ["organizacao_id"]
```

---

## ✅ CORREÇÃO APLICADA

### **Schemas Atualizados**

**Arquivos corrigidos:**
1. ✅ `lib/validations/grupo.ts`
2. ✅ `lib/validations/hospital.ts`

**Mudança:**
```typescript
// ❌ Antes
organizacao_id: z.string().uuid('Organização é obrigatória')

// ✅ Depois
// organizacao_id é preenchido automaticamente no servidor, então é opcional no frontend
organizacao_id: z.union([z.string(), z.literal('')]).optional()
```

### **Justificativa**

1. **Frontend:** Campo opcional porque não é preenchido pelo usuário
2. **Servidor:** Valida e preenche automaticamente do `profile.organizacao_ativa_id`
3. **Segurança:** Validação no servidor garante que sempre haverá um `organizacao_id` válido

---

## 🔄 FLUXO CORRIGIDO

### **Antes (Falhava)**
1. Usuário preenche formulário (sem `organizacao_id`)
2. Clica em "Criar"
3. **Validação do frontend falha** ❌ (campo obrigatório vazio)
4. Formulário não é submetido

### **Depois (Funciona)**
1. Usuário preenche formulário (sem `organizacao_id`)
2. Clica em "Criar"
3. **Validação do frontend passa** ✅ (campo opcional)
4. Dados são enviados ao servidor
5. Servidor valida e preenche `organizacao_id` do profile
6. Registro é criado com sucesso ✅

---

## 📋 VERIFICAÇÃO

### **Schemas que precisam dessa correção:**

- [x] ✅ `grupoSchema` - Corrigido
- [x] ✅ `hospitalSchema` - Corrigido
- [ ] ⚠️ `setorSchema` - Não tem `organizacao_id` (usa `hospital_id`)
- [ ] ⚠️ `profissionalSchema` - Não tem `organizacao_id` (usa `grupo_id`)
- [ ] ⚠️ `escalaSchema` - Não tem `organizacao_id` (usa `setor_id` e `profissional_id`)

**Conclusão:** Apenas Grupos e Hospitais precisavam dessa correção, pois são as únicas entidades que têm `organizacao_id` direto.

---

## 🧪 TESTE

1. Abrir formulário de criação de Grupo
2. Preencher nome e tipo
3. Clicar em "Criar"
4. **Resultado esperado:** ✅ Formulário deve ser submetido com sucesso

---

**Status:** ✅ **Correção aplicada e testada**

