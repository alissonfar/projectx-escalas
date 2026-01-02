# Ações de Backend: Pré-Escala e Publicação

**Data:** 04/01/2025  
**Arquivo:** `lib/actions/escalas.ts`

---

## 📋 Resumo

Implementadas todas as ações de backend necessárias para suportar o fluxo de pré-escala (rascunho/publicação) conforme análise conceitual.

---

## ✅ Ações Implementadas

### 1. `salvarRascunhoEscala(data: EscalaFormData)`

**Descrição:**  
Salva uma nova escala como rascunho. Sempre cria com `status='rascunho'`, não preenche `publicado_em` nem `publicado_por`.

**Uso:**  
Quando o coordenador quer salvar progresso sem publicar.

**Comportamento:**
- Valida dados com schema completo
- Verifica conflitos com escalas publicadas (apenas aviso, permite salvar)
- Cria escala com `status='rascunho'`
- Campo `turno` pode ser inferido automaticamente pelo trigger

**Retorno:**
```typescript
{
  success: boolean
  message?: string
  error?: string
  conflitos?: Escala[]  // Avisa sobre conflitos, mas permite salvar
}
```

---

### 2. `atualizarRascunhoEscala(id: string, data: EscalaFormData)`

**Descrição:**  
Atualiza uma escala existente mantendo como rascunho. Se a escala estava publicada, volta para rascunho.

**Uso:**  
Quando o coordenador quer editar uma escala sem publicar, ou despublicar para editar.

**Comportamento:**
- Valida dados com schema completo
- Verifica conflitos com escalas publicadas
- Atualiza escala com `status='rascunho'`
- Remove `publicado_em` e `publicado_por` se existirem

**Retorno:**
```typescript
ActionResult
```

---

### 3. `publicarEscala(id: string)`

**Descrição:**  
Publica uma escala que está em rascunho. Muda `status` para `'publicado'`. O trigger preenche automaticamente `publicado_em` e `publicado_por`.

**Uso:**  
Quando o coordenador finaliza a edição e quer tornar a escala visível para profissionais.

**Comportamento:**
- Verifica se escala existe e está em rascunho
- Verifica conflitos antes de publicar (apenas com escalas publicadas)
- Atualiza `status` para `'publicado'`
- Trigger preenche `publicado_em` e `publicado_por` automaticamente

**Validações:**
- ❌ Não pode publicar se status não for `'rascunho'`
- ⚠️ Avisa sobre conflitos, mas permite publicar

**Retorno:**
```typescript
ActionResult & { conflitos?: Escala[] }
```

---

### 4. `publicarMultiplasEscalas(ids: string[])`

**Descrição:**  
Publica várias escalas de uma vez. Útil para publicar todas as escalas de um período após finalizar a pré-escala.

**Uso:**  
Quando o coordenador finaliza todas as escalas de um mês e quer publicar tudo de uma vez.

**Comportamento:**
- Filtra apenas escalas em rascunho
- Publica todas as escalas válidas
- Ignora escalas que não estão em rascunho (com aviso)

**Retorno:**
```typescript
ActionResult & {
  publicadas: number      // Quantidade de escalas publicadas
  erros: string[]         // Mensagens de erro/aviso
}
```

**Exemplo de uso:**
```typescript
const result = await publicarMultiplasEscalas(['id1', 'id2', 'id3'])
// result.publicadas = 2
// result.erros = ['1 escala(s) não estavam em rascunho e foram ignoradas']
```

---

### 5. `despublicarEscala(id: string)`

**Descrição:**  
Despublica uma escala (volta para rascunho). Útil quando o coordenador precisa fazer ajustes em escala já publicada.

**Uso:**  
Quando o coordenador precisa editar uma escala já publicada.

**Comportamento:**
- Verifica se escala está publicada
- Verifica se escala já passou (não permite despublicar escalas executadas)
- Atualiza `status` para `'rascunho'`
- Remove `publicado_em` e `publicado_por`

**Validações:**
- ❌ Não pode despublicar se status não for `'publicado'`
- ❌ Não pode despublicar escalas já executadas (data_inicio < agora)

**Retorno:**
```typescript
ActionResult
```

---

### 6. `buscarEscalasRascunho(filters?)`

**Descrição:**  
Busca apenas escalas em rascunho. Útil para o coordenador ver o que ainda precisa ser finalizado.

**Uso:**  
Listar todas as escalas que ainda estão em edição.

**Filtros opcionais:**
- `dataInicio` - Data inicial do período
- `dataFim` - Data final do período
- `setorId` - Filtrar por setor
- `profissionalId` - Filtrar por profissional

**Retorno:**
```typescript
Promise<EscalaComRelacoes[]>
```

---

### 7. `buscarEscalasPublicadas(filters?)`

**Descrição:**  
Busca apenas escalas publicadas. Útil para visualização final e para profissionais verem suas escalas.

**Uso:**  
Listar todas as escalas que já foram publicadas e estão visíveis.

**Filtros opcionais:**
- `dataInicio` - Data inicial do período
- `dataFim` - Data final do período
- `setorId` - Filtrar por setor
- `profissionalId` - Filtrar por profissional

**Retorno:**
```typescript
Promise<EscalaComRelacoes[]>
```

---

### 8. `buscarEscalas(filters?)` - Atualizada

**Descrição:**  
Função existente atualizada para suportar filtro por estado.

**Novo filtro:**
- `estado?: 'rascunho' | 'publicado' | 'cancelado' | 'todos'`

**Comportamento:**
- Se `estado` for fornecido e diferente de `'todos'`, filtra por status
- Mantém compatibilidade com filtro `status` existente
- Ambos os filtros funcionam (mas `estado` é mais semântico)

---

## 🔄 Fluxos de Uso

### Fluxo 1: Criar e Publicar Escala

```typescript
// 1. Criar como rascunho
const rascunho = await salvarRascunhoEscala({
  setor_id: '...',
  profissional_id: '...',
  data_inicio: '...',
  data_fim: '...'
})

// 2. Editar se necessário
await atualizarRascunhoEscala(rascunho.id, { ... })

// 3. Publicar quando pronto
await publicarEscala(rascunho.id)
```

### Fluxo 2: Publicação em Massa

```typescript
// 1. Buscar todos os rascunhos do período
const rascunhos = await buscarEscalasRascunho({
  dataInicio: '2025-01-01',
  dataFim: '2025-01-31'
})

// 2. Publicar todos de uma vez
const ids = rascunhos.map(e => e.id)
await publicarMultiplasEscalas(ids)
```

### Fluxo 3: Editar Escala Publicada

```typescript
// 1. Despublicar
await despublicarEscala(escalaId)

// 2. Editar como rascunho
await atualizarRascunhoEscala(escalaId, { ... })

// 3. Republicar
await publicarEscala(escalaId)
```

---

## ⚠️ Validações e Regras

### Regras de Publicação

1. **Apenas rascunhos podem ser publicados**
   - Escalas com `status='publicado'` ou `'cancelado'` não podem ser publicadas novamente
   - Use `despublicarEscala()` primeiro se necessário

2. **Conflitos são avisos, não bloqueios**
   - Sistema avisa sobre conflitos, mas permite salvar/publicar
   - Coordenador decide se quer prosseguir

3. **Despublicação tem restrições**
   - Não pode despublicar escalas já executadas (data_inicio < agora)
   - Apenas escalas publicadas podem ser despublicadas

### Verificação de Conflitos

- **Rascunhos:** Verificam conflitos apenas com escalas **publicadas**
- **Publicação:** Verifica conflitos apenas com escalas **publicadas**
- **Rascunhos não conflitam entre si** (podem ser ajustados antes de publicar)

---

## 📊 Estrutura de Dados

### Escala em Rascunho

```typescript
{
  id: string
  status: 'rascunho'
  publicado_em: null
  publicado_por: null
  // ... outros campos
}
```

### Escala Publicada

```typescript
{
  id: string
  status: 'publicado'
  publicado_em: string  // Preenchido pelo trigger
  publicado_por: string // Preenchido pelo trigger
  // ... outros campos
}
```

---

## 🔗 Integração com Frontend

### Componentes que Precisam Usar

1. **EscalaForm.tsx**
   - Botão "Salvar Rascunho" → `salvarRascunhoEscala()`
   - Botão "Publicar" → `publicarEscala()`

2. **EscalaList.tsx**
   - Botão "Publicar" em cada escala → `publicarEscala()`
   - Botão "Publicar Todas" → `publicarMultiplasEscalas()`
   - Filtro por estado → `buscarEscalasRascunho()` / `buscarEscalasPublicadas()`

3. **EscalaCalendar.tsx** (futuro)
   - Visualização diferenciada de rascunhos vs. publicadas
   - Ações de publicação em massa

---

## ✅ Checklist de Implementação

- [x] `salvarRascunhoEscala()` - Criar escala como rascunho
- [x] `atualizarRascunhoEscala()` - Atualizar mantendo como rascunho
- [x] `publicarEscala()` - Publicar uma escala
- [x] `publicarMultiplasEscalas()` - Publicar várias escalas
- [x] `despublicarEscala()` - Despublicar escala
- [x] `buscarEscalasRascunho()` - Buscar apenas rascunhos
- [x] `buscarEscalasPublicadas()` - Buscar apenas publicadas
- [x] `buscarEscalas()` - Atualizada com filtro de estado

---

## 🎯 Próximos Passos

1. **Atualizar componentes frontend:**
   - Adicionar botões de "Salvar Rascunho" e "Publicar"
   - Adicionar indicadores visuais de rascunho vs. publicado
   - Implementar filtros por estado

2. **Criar componentes de calendário:**
   - Visualização diferenciada de rascunhos
   - Ações de publicação em massa no calendário

3. **Testes:**
   - Testar fluxos completos de criação → publicação
   - Testar publicação em massa
   - Testar despublicação e republicação

---

**Status:** ✅ Todas as ações de backend implementadas  
**Próxima ação:** Atualizar componentes frontend para usar as novas ações




