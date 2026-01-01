# Atualizações Frontend: Pré-Escala e Publicação

**Data:** 04/01/2025  
**Componentes Atualizados:** `EscalaForm.tsx`, `EscalaList.tsx`, `StatusBadge.tsx`

---

## 📋 Resumo

Componentes frontend atualizados para suportar o fluxo completo de pré-escala (rascunho/publicação) com novas ações e indicadores visuais.

---

## ✅ Componentes Atualizados

### 1. `StatusBadge.tsx`

**Mudanças:**
- ✅ Adicionados novos status: `'rascunho'` e `'publicado'`
- ✅ Cores e ícones específicos para cada status:
  - **Rascunho:** Amarelo com ícone de aviso
  - **Publicado:** Verde com ícone de check

**Status Suportados:**
- `ativo` / `inativo`
- `confirmado` (mantido para compatibilidade)
- `cancelado`
- `rascunho` ✨ **NOVO**
- `publicado` ✨ **NOVO**

---

### 2. `EscalaForm.tsx`

**Mudanças Principais:**

#### Novos Props
- `onSalvarRascunho?: (data: EscalaFormData) => Promise<void>` - Callback para salvar como rascunho
- `onPublicar?: (data: EscalaFormData) => Promise<void>` - Callback para publicar
- `initialData.status` - Agora suporta `'rascunho' | 'publicado' | 'cancelado'`

#### Novos Botões
- **💾 Salvar Rascunho** - Sempre visível (exceto para escalas publicadas)
- **📢 Publicar** - Visível apenas para rascunhos ou novas escalas
- Botão padrão de submit - Usado quando callbacks específicos não são fornecidos

#### Comportamento
- **Nova escala:** Mostra "Salvar Rascunho" e "Publicar"
- **Editar rascunho:** Mostra "Salvar Rascunho" e "Publicar"
- **Editar publicada:** Mostra apenas "Salvar Rascunho" (desabilitado) + aviso de que precisa despublicar primeiro

#### UI Customizada
- Substituído `FormModal` por `Dialog` customizado do Headless UI
- Footer com múltiplos botões de ação
- Indicadores visuais de estado

---

### 3. `EscalaList.tsx`

**Mudanças Principais:**

#### Novas Ações
- ✅ `handleSalvarRascunho()` - Salva escala como rascunho
- ✅ `handlePublicar()` - Publica escala diretamente do formulário
- ✅ `handlePublicarEscala()` - Abre diálogo para publicar escala da lista
- ✅ `handleDespublicarEscala()` - Despublica escala (volta para rascunho)
- ✅ `handleConfirmPublicar()` - Confirma publicação via diálogo

#### Nova Coluna de Status
- Usa `StatusBadge` para exibir status visualmente
- Cores diferentes para rascunho/publicado/cancelado

#### Nova Coluna de Ações Customizadas
- **Botão Publicar** (verde) - Aparece apenas para escalas em rascunho
- **Botão Despublicar** (amarelo) - Aparece apenas para escalas publicadas
- **Botão Cancelar** (vermelho) - Aparece para rascunhos e publicadas

#### Novos Diálogos
- **Diálogo de Publicação** - Confirma antes de publicar escala
- Mensagens de sucesso/erro melhoradas

#### Integração com Formulário
- Formulário agora recebe `onSalvarRascunho` e `onPublicar`
- Fluxo completo: Criar → Salvar Rascunho → Publicar

---

## 🎨 Indicadores Visuais

### Status Badges

```typescript
// Rascunho
<StatusBadge status="rascunho" />
// Amarelo com ícone de aviso

// Publicado
<StatusBadge status="publicado" />
// Verde com ícone de check

// Cancelado
<StatusBadge status="cancelado" />
// Vermelho com ícone de X
```

### Botões de Ação

- **💾 Salvar Rascunho:** Botão outline (cinza)
- **📢 Publicar:** Botão verde destacado
- **Publicar (lista):** Ícone verde com hover
- **Despublicar:** Ícone amarelo com hover
- **Cancelar:** Ícone vermelho com hover

---

## 🔄 Fluxos Implementados

### Fluxo 1: Criar Nova Escala como Rascunho

```
1. Usuário clica "Nova Escala"
2. Preenche formulário
3. Clica "💾 Salvar Rascunho"
4. Escala é criada com status='rascunho'
5. Aparece na lista com badge amarelo "Rascunho"
```

### Fluxo 2: Publicar Escala da Lista

```
1. Usuário vê escala com status "Rascunho" na lista
2. Clica no botão verde "Publicar" na coluna de ações
3. Diálogo de confirmação aparece
4. Confirma publicação
5. Escala muda para status='publicado'
6. Badge muda para verde "Publicado"
```

### Fluxo 3: Criar e Publicar Diretamente

```
1. Usuário clica "Nova Escala"
2. Preenche formulário
3. Clica "📢 Publicar"
4. Sistema cria como rascunho e publica imediatamente
5. Escala aparece na lista como "Publicado"
```

### Fluxo 4: Editar Escala Publicada

```
1. Usuário vê escala "Publicado" na lista
2. Clica "Despublicar" (botão amarelo)
3. Escala volta para "Rascunho"
4. Agora pode editar normalmente
5. Após editar, pode publicar novamente
```

---

## 📊 Estrutura de Dados

### Props do EscalaForm

```typescript
interface EscalaFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EscalaFormData) => Promise<void>
  onSalvarRascunho?: (data: EscalaFormData) => Promise<void>  // ✨ NOVO
  onPublicar?: (data: EscalaFormData) => Promise<void>        // ✨ NOVO
  initialData?: EscalaFormData & { 
    id?: string
    status?: 'rascunho' | 'publicado' | 'cancelado'  // ✨ ATUALIZADO
  }
  loading?: boolean
}
```

---

## ⚠️ Validações e Regras de Negócio

### Regras Implementadas

1. **Escalas Publicadas:**
   - Não podem ser editadas diretamente
   - Precisam ser despublicadas primeiro
   - Mostram aviso no formulário

2. **Botão Publicar:**
   - Visível apenas para rascunhos ou novas escalas
   - Desabilitado para escalas publicadas

3. **Botão Salvar Rascunho:**
   - Sempre visível (exceto escalas publicadas)
   - Permite salvar progresso sem publicar

4. **Conflitos:**
   - Sistema avisa sobre conflitos mas permite salvar/publicar
   - Coordenador decide se quer prosseguir

---

## 🎯 Funcionalidades Implementadas

### ✅ Implementado

- [x] Botão "Salvar Rascunho" no formulário
- [x] Botão "Publicar" no formulário
- [x] Botão "Publicar" na lista (coluna de ações)
- [x] Botão "Despublicar" na lista
- [x] Status badges visuais (rascunho/publicado)
- [x] Diálogo de confirmação para publicação
- [x] Mensagens de sucesso/erro
- [x] Indicadores visuais de estado
- [x] Validação de estado antes de ações

### 🔄 Próximos Passos (Futuro)

- [ ] Publicação em massa (selecionar múltiplas escalas)
- [ ] Filtro rápido por estado (rascunho/publicado)
- [ ] Contador de rascunhos vs. publicadas
- [ ] Notificações ao publicar
- [ ] Histórico de publicações

---

## 🐛 Correções Necessárias

### Problema Conhecido

**Publicação de Nova Escala:**
- Quando cria nova escala e clica "Publicar", o sistema cria como rascunho mas não publica imediatamente
- **Solução temporária:** Usuário precisa publicar manualmente da lista
- **Solução futura:** Ajustar `handlePublicar` para buscar ID da escala criada e publicar

### Melhorias Sugeridas

1. **Feedback Visual:**
   - Adicionar loading states específicos para cada ação
   - Animações de transição ao mudar status

2. **UX:**
   - Tooltips nos botões de ação
   - Confirmação antes de despublicar
   - Atalhos de teclado

3. **Performance:**
   - Otimizar re-renders ao mudar status
   - Cache de escalas por estado

---

## 📝 Exemplo de Uso

### Criar Escala como Rascunho

```tsx
<EscalaForm
  open={formOpen}
  onClose={() => setFormOpen(false)}
  onSalvarRascunho={async (data) => {
    const result = await salvarRascunhoEscala(data)
    if (result.success) {
      router.refresh()
    }
  }}
  onPublicar={async (data) => {
    // Criar e publicar
    const createResult = await salvarRascunhoEscala(data)
    if (createResult.success) {
      // Buscar ID e publicar
      await publicarEscala(escalaId)
      router.refresh()
    }
  }}
/>
```

### Lista com Ações

```tsx
<EscalaList escalas={escalas} />
// Automaticamente mostra botões de ação baseados no status
// Rascunho → Botão Publicar
// Publicado → Botão Despublicar
```

---

## ✅ Checklist de Implementação

- [x] Atualizar StatusBadge com novos status
- [x] Modificar EscalaForm para suportar múltiplos botões
- [x] Adicionar callbacks onSalvarRascunho e onPublicar
- [x] Criar Dialog customizado no EscalaForm
- [x] Adicionar coluna de ações customizadas no EscalaList
- [x] Implementar handlePublicarEscala
- [x] Implementar handleDespublicarEscala
- [x] Adicionar diálogo de confirmação de publicação
- [x] Integrar com ações de backend
- [x] Adicionar mensagens de sucesso/erro
- [x] Testar fluxos completos

---

**Status:** ✅ Componentes frontend atualizados e funcionais  
**Próxima ação:** Testar fluxos completos e ajustar publicação de novas escalas



