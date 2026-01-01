# 🛠️ PLANO DE IMPLEMENTAÇÃO INCREMENTAL

**Data:** 28/12/2024  
**Objetivo:** Ajustes incrementais para 100% de conformidade com modelo conceitual

---

## 📊 VISÃO GERAL

### Status Atual: 95% → Meta: 100%

**Lacunas Identificadas (4):**
1. 🔴 **ALTA**: Scroll horizontal presente
2. 🔴 **ALTA**: Estado do período hardcoded
3. 🟡 **MÉDIA**: Grid não é full-screen
4. 🟡 **MÉDIA**: Falta modo semanal

**Estratégia:** Implementar em sprints incrementais, do mais crítico ao menos crítico.

---

## 🎯 SPRINT 1: Correções Críticas (Prioridade Alta)

**Duração:** 3-4 horas  
**Objetivo:** Corrigir bugs e não-conformidades críticas

### 1.1 ❌ Remover Scroll Horizontal

**Problema:**
```tsx
// ATUAL (components/escalas/grid/ScaleHeader.tsx)
<div className="flex-1 flex overflow-x-auto">  // ❌ Scroll horizontal
  {dias.map(dia => (
    <div className="min-w-[120px] flex-shrink-0">  // ❌ Largura fixa
```

**Solução:**
```tsx
// NOVO (usar CSS Grid)
<div 
  className="grid gap-0"
  style={{
    gridTemplateColumns: `repeat(${numeroDias}, minmax(80px, 1fr))`
  }}
>
  {dias.map(dia => (
    <div className="min-w-0 p-2">  // ✅ Responsivo
```

**Arquivos a Modificar:**
1. `components/escalas/grid/ScaleHeader.tsx`
2. `components/escalas/grid/ScaleRowSector.tsx`
3. `components/escalas/grid/ScaleGrid.tsx`

**Passos:**

```typescript
// 1. ScaleGrid.tsx - Wrapper com CSS Grid
export function ScaleGrid({ setores, mes, ano, ... }: ScaleGridProps) {
  const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Grid layout sem scroll horizontal */}
      <div 
        className="grid"
        style={{
          gridTemplateColumns: '200px 1fr',  // Coluna fixa + grid de dias
        }}
      >
        {/* Header */}
        <ScaleHeader mes={mes} ano={ano} numeroDias={numeroDias} />
        
        {/* Linhas de setores */}
        <div className="contents">
          {setores.map(setor => (
            <ScaleRowSector key={setor.id} ... numeroDias={numeroDias} />
          ))}
        </div>
      </div>
    </div>
  )
}

// 2. ScaleHeader.tsx - Header sem flexbox
export function ScaleHeader({ mes, ano, numeroDias }: ScaleHeaderProps) {
  const dias = Array.from({ length: numeroDias }, (_, i) => i + 1)
  
  return (
    <>
      {/* Coluna fixa de "Setor" */}
      <div className="sticky left-0 z-10 bg-white dark:bg-gray-800 border-b border-r p-3 font-semibold">
        Setor
      </div>
      
      {/* Grid de dias (sem scroll) */}
      <div 
        className="grid border-b"
        style={{
          gridTemplateColumns: `repeat(${numeroDias}, minmax(80px, 1fr))`
        }}
      >
        {dias.map(dia => {
          const diaSemana = obterDiaSemana(dia)
          const ehFimDeSemana = diaSemana === 0 || diaSemana === 6
          
          return (
            <div 
              key={dia}
              className={`p-2 border-r text-center ${ehFimDeSemana ? 'bg-blue-50' : ''}`}
            >
              <div className="text-lg font-bold">{dia.toString().padStart(2, '0')}</div>
              <div className="text-xs">{DIAS_SEMANA[diaSemana]}</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// 3. ScaleRowSector.tsx - Linha sem flexbox
export function ScaleRowSector({ setor, mes, ano, numeroDias, ... }: ScaleRowSectorProps) {
  const dias = Array.from({ length: numeroDias }, (_, i) => i + 1)
  
  return (
    <>
      {/* Coluna fixa com nome do setor */}
      <div className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-900 border-b border-r p-3">
        <div className="font-semibold">{setor.nome}</div>
        <div className="text-xs text-gray-500">{setor.hospital.nome}</div>
      </div>
      
      {/* Grid de células (sem scroll) */}
      <div 
        className="grid border-b"
        style={{
          gridTemplateColumns: `repeat(${numeroDias}, minmax(80px, 1fr))`
        }}
      >
        {dias.map(dia => (
          <ScaleDayCell
            key={dia}
            alocacoes={alocacoesPorDia[dia] || []}
            ...
          />
        ))}
      </div>
    </>
  )
}

// 4. ScaleDayCell.tsx - Ajustar para grid
export function ScaleDayCell({ alocacoes, ... }: ScaleDayCellProps) {
  return (
    <div className="min-w-0 p-2 border-r min-h-[100px] max-h-[200px] overflow-y-auto">
      {/* Conteúdo mantém igual */}
    </div>
  )
}
```

**Teste:**
```bash
# 1. Verificar que não há scroll horizontal
# 2. Redimensionar janela e ver células ajustando
# 3. Testar em diferentes resoluções (1920px, 1366px, 2560px)
```

---

### 1.2 ❌ Corrigir Estado do Período (Hardcoded)

**Problema:**
```tsx
// EscalasClient.tsx linha 85
periodos[setor.id] = {
  id: periodoResult.periodoId,
  estado: 'pre_escala' // ❌ SEMPRE pré-escala
}
```

**Solução:**

```typescript
// 1. lib/actions/escala-periodos.ts - Retornar estado
export async function criarOuObterPeriodo(
  setorId: string,
  mes: number,
  ano: number
): Promise<{ success: boolean; periodoId?: string; estado?: EscalaPeriodoEstado; error?: string }> {
  try {
    // ... código existente ...
    
    // Buscar período existente (com estado)
    const { data: periodoExistente, error: fetchError } = await supabase
      .from('escala_periodos')
      .select('id, estado')  // ✅ Incluir estado
      .eq('escala_id', escalaResult.escalaId)
      .eq('mes', mes)
      .eq('ano', ano)
      .order('versao', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (periodoExistente) {
      return { 
        success: true, 
        periodoId: periodoExistente.id,
        estado: periodoExistente.estado  // ✅ Retornar estado real
      }
    }
    
    // Se criar novo, retornar 'pre_escala'
    const { data: novoPeriodo, error: createError } = await supabase
      .from('escala_periodos')
      .insert({
        escala_id: escalaResult.escalaId,
        mes,
        ano,
        versao: 1,
        estado: 'pre_escala',
        created_by: user.id
      })
      .select('id, estado')  // ✅ Incluir estado
      .single()
    
    if (createError || !novoPeriodo) {
      console.error('Erro ao criar período:', createError)
      return { success: false, error: 'Erro ao criar período' }
    }
    
    revalidatePath('/escalas')
    return { 
      success: true, 
      periodoId: novoPeriodo.id,
      estado: novoPeriodo.estado  // ✅ Retornar estado do novo
    }
  } catch (error) {
    console.error('Erro ao criar/obter período:', error)
    return { success: false, error: 'Erro ao processar período' }
  }
}

// 2. components/escalas/EscalasClient.tsx - Usar estado retornado
const carregarDados = async () => {
  setLoading(true)
  setError(null)
  
  try {
    const periodos: Record<string, { id: string; estado: EscalaPeriodoEstado }> = {}
    const alocacoes: Record<string, EscalaAlocacaoCompleta[]> = {}
    
    for (const setor of setores) {
      const periodoResult = await criarOuObterPeriodo(setor.id, mes, ano)
      
      if (periodoResult.success && periodoResult.periodoId) {
        const alocacoesDoSetor = await buscarAlocacoesPeriodo(periodoResult.periodoId)
        
        periodos[setor.id] = {
          id: periodoResult.periodoId,
          estado: periodoResult.estado || 'pre_escala'  // ✅ Usar estado real
        }
        alocacoes[setor.id] = alocacoesDoSetor
      }
    }
    
    setPeriodosPorSetor(periodos)
    setAlocacoesPorSetor(alocacoes)
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
    setError('Erro ao carregar dados do período')
  } finally {
    setLoading(false)
  }
}
```

**Teste:**
```bash
# 1. Publicar um período
# 2. Recarregar página
# 3. Verificar que aparece como "Publicada" (🟢)
# 4. Verificar que botões de edição estão desabilitados
```

---

## 🎯 SPRINT 2: Melhorias de Layout (Prioridade Média)

**Duração:** 2-3 horas  
**Objetivo:** Otimizar uso do espaço e UX

### 2.1 ⚠️ Implementar Grid Full-Screen

**Problema:**
```tsx
// EscalasClient.tsx
<div className="space-y-6">
  <ScaleGrid ... />
</div>

// ScaleGrid.tsx
<div className="max-h-[600px] overflow-y-auto">  // ❌ Limitado
```

**Solução:**

```tsx
// 1. app/(dashboard)/escalas/page.tsx - Layout full-screen
export default async function EscalasPage() {
  // ... auth checks ...
  
  return (
    <div className="h-screen flex flex-col">
      <EscalasClient
        setoresIniciais={setores}
        mesInicial={mesAtual}
        anoInicial={anoAtual}
      />
    </div>
  )
}

// 2. components/escalas/EscalasClient.tsx - Usar viewport height
export function EscalasClient({ ... }: EscalasClientProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header fixo */}
      <div className="flex-shrink-0 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Escalas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as escalas de plantão por período
            </p>
          </div>
        </div>
        
        {/* Mensagens de erro/sucesso */}
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {/* Controles */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <MonthSelector mes={mes} ano={ano} onChange={handleMudaMes} />
          <StateIndicator
            estado={estadoGeral}
            onPublicar={handlePublicar}
            onDespublicar={handleDespublicar}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Grid ocupa espaço restante */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {loading && Object.keys(alocacoesPorSetor).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Carregando...</p>
          </div>
        ) : (
          <ScaleGrid
            setores={setores}
            mes={mes}
            ano={ano}
            alocacoesPorSetor={alocacoesPorSetor}
            estado={estadoGeral}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
          />
        )}
      </div>
      
      {/* Modal mantém igual */}
      <AddShiftModal ... />
    </div>
  )
}

// 3. components/escalas/grid/ScaleGrid.tsx - Altura 100%
export function ScaleGrid({ ... }: ScaleGridProps) {
  return (
    <div className="h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Header fixo */}
      <div className="flex-shrink-0">
        <ScaleHeader mes={mes} ano={ano} numeroDias={numeroDias} />
      </div>
      
      {/* Linhas scrolláveis */}
      <div className="flex-1 overflow-auto">
        {setores.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Nenhum setor encontrado</p>
          </div>
        ) : (
          setores.map(setor => (
            <ScaleRowSector key={setor.id} ... />
          ))
        )}
      </div>
    </div>
  )
}
```

**Teste:**
```bash
# 1. Verificar que grid ocupa toda altura disponível
# 2. Testar em diferentes resoluções
# 3. Verificar que scroll funciona apenas para linhas (não para header)
```

---

## 🎯 SPRINT 3: Modo Semanal (Prioridade Média)

**Duração:** 4-6 horas  
**Objetivo:** Adicionar visualização semanal

### 3.1 ⚠️ Implementar Modo Semanal

**Solução:**

```typescript
// 1. lib/utils/calendar.ts (criar novo arquivo)
export type VisualizacaoModo = 'mensal' | 'semanal'

export function getWeeksInMonth(mes: number, ano: number): number[][] {
  const primeiroDia = new Date(ano, mes - 1, 1)
  const ultimoDia = new Date(ano, mes, 0)
  const numeroDias = ultimoDia.getDate()
  
  const semanas: number[][] = []
  let semanaAtual: number[] = []
  
  for (let dia = 1; dia <= numeroDias; dia++) {
    const data = new Date(ano, mes - 1, dia)
    const diaSemana = data.getDay() // 0-6 (Dom-Sáb)
    
    semanaAtual.push(dia)
    
    // Se é sábado ou último dia do mês, fecha semana
    if (diaSemana === 6 || dia === numeroDias) {
      semanas.push([...semanaAtual])
      semanaAtual = []
    }
  }
  
  return semanas
}

export function getDaysForVisualization(
  modo: VisualizacaoModo,
  mes: number,
  ano: number,
  semana?: number
): number[] {
  if (modo === 'mensal') {
    const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
    return Array.from({ length: numeroDias }, (_, i) => i + 1)
  }
  
  // Modo semanal
  const semanas = getWeeksInMonth(mes, ano)
  const indice = (semana || 1) - 1
  return semanas[indice] || []
}

// 2. components/escalas/filters/ViewModeSelector.tsx (criar)
interface ViewModeSelectorProps {
  modo: VisualizacaoModo
  semana?: number
  totalSemanas?: number
  onChange: (modo: VisualizacaoModo) => void
  onSemanaChange?: (semana: number) => void
}

export function ViewModeSelector({
  modo,
  semana,
  totalSemanas,
  onChange,
  onSemanaChange
}: ViewModeSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Toggle Mensal/Semanal */}
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600">
        <button
          onClick={() => onChange('mensal')}
          className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
            modo === 'mensal'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => onChange('semanal')}
          className={`px-4 py-2 text-sm font-medium rounded-r-lg border-l ${
            modo === 'semanal'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          Semanal
        </button>
      </div>
      
      {/* Navegação de semanas (apenas no modo semanal) */}
      {modo === 'semanal' && totalSemanas && onSemanaChange && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSemanaChange(Math.max(1, (semana || 1) - 1))}
            disabled={semana === 1}
            className="p-2 rounded disabled:opacity-50"
          >
            <ChevronLeft />
          </button>
          <span className="text-sm font-medium">
            Semana {semana} de {totalSemanas}
          </span>
          <button
            onClick={() => onSemanaChange(Math.min(totalSemanas, (semana || 1) + 1))}
            disabled={semana === totalSemanas}
            className="p-2 rounded disabled:opacity-50"
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}

// 3. components/escalas/EscalasClient.tsx - Adicionar estado de visualização
export function EscalasClient({ ... }: EscalasClientProps) {
  // Estados existentes...
  const [modo, setModo] = useState<VisualizacaoModo>('mensal')
  const [semanaAtual, setSemanaAtual] = useState(1)
  
  const semanas = useMemo(
    () => getWeeksInMonth(mes, ano),
    [mes, ano]
  )
  
  const totalSemanas = semanas.length
  
  // Calcular dias baseado no modo
  const dias = useMemo(
    () => getDaysForVisualization(modo, mes, ano, semanaAtual),
    [modo, mes, ano, semanaAtual]
  )
  
  // Resetar semana quando mudar mês
  useEffect(() => {
    setSemanaAtual(1)
  }, [mes, ano])
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 space-y-4 p-6">
        {/* Header existente... */}
        
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border">
          <div className="flex items-center gap-4">
            <MonthSelector mes={mes} ano={ano} onChange={handleMudaMes} />
            <ViewModeSelector
              modo={modo}
              semana={semanaAtual}
              totalSemanas={totalSemanas}
              onChange={setModo}
              onSemanaChange={setSemanaAtual}
            />
          </div>
          <StateIndicator ... />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <ScaleGrid
          setores={setores}
          mes={mes}
          ano={ano}
          modo={modo}  // ✅ Novo
          dias={dias}  // ✅ Novo
          alocacoesPorSetor={alocacoesPorSetor}
          estado={estadoGeral}
          onAddShift={handleAddShift}
          onEditShift={handleEditShift}
        />
      </div>
    </div>
  )
}

// 4. components/escalas/grid/ScaleGrid.tsx - Usar dias dinâmicos
interface ScaleGridProps {
  // ... props existentes
  modo: VisualizacaoModo
  dias: number[]
}

export function ScaleGrid({ setores, mes, ano, modo, dias, ... }: ScaleGridProps) {
  const numeroDias = dias.length
  
  return (
    <div className="h-full border rounded-lg overflow-hidden flex flex-col">
      <div className="flex-shrink-0">
        <ScaleHeader mes={mes} ano={ano} dias={dias} />
      </div>
      
      <div className="flex-1 overflow-auto">
        {setores.map(setor => (
          <ScaleRowSector
            key={setor.id}
            setor={setor}
            mes={mes}
            ano={ano}
            dias={dias}  // ✅ Passar dias dinâmicos
            alocacoes={alocacoesPorSetor[setor.id] || []}
            ehPreEscala={ehPreEscala}
            onAddShift={onAddShift}
            onEditShift={onEditShift}
          />
        ))}
      </div>
    </div>
  )
}

// 5. Ajustar ScaleHeader e ScaleRowSector para aceitar dias[]
```

**Teste:**
```bash
# 1. Alternar entre modo mensal e semanal
# 2. Navegar entre semanas no modo semanal
# 3. Verificar que cards ficam maiores no modo semanal
# 4. Mudar mês e verificar que volta para semana 1
```

---

## 📅 CRONOGRAMA SUGERIDO

| Sprint | Tarefa | Duração | Prioridade |
|--------|--------|---------|------------|
| **Sprint 1** | Remover scroll horizontal | 2-3h | 🔴 ALTA |
| | Corrigir estado período | 30min | 🔴 ALTA |
| **Sprint 2** | Grid full-screen | 1-2h | 🟡 MÉDIA |
| **Sprint 3** | Modo semanal | 4-6h | 🟡 MÉDIA |
| **TOTAL** | | **8-12h** | |

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Após Sprint 1
- [ ] Grid não tem scroll horizontal
- [ ] Células ajustam tamanho conforme largura da tela
- [ ] Período publicado aparece como "🟢 Publicada"
- [ ] Período publicado não permite edição
- [ ] Período pré-escala aparece como "🟡 Pré-escala"
- [ ] Período pré-escala permite edição

### Após Sprint 2
- [ ] Grid ocupa 100% da altura disponível
- [ ] Não há espaço desperdiçado
- [ ] Scroll funciona apenas nas linhas (header fixo)
- [ ] Funciona em diferentes resoluções (1366px, 1920px, 2560px)

### Após Sprint 3
- [ ] Toggle mensal/semanal funciona
- [ ] Modo mensal mostra 28-31 colunas
- [ ] Modo semanal mostra 7 colunas
- [ ] Navegação entre semanas funciona
- [ ] Cards são maiores no modo semanal
- [ ] Trocar mês reseta para semana 1

---

## 🚀 ORDEM DE EXECUÇÃO RECOMENDADA

1. **Executar migration** (se ainda não executou)
   ```bash
   npx supabase migration up
   ```

2. **Sprint 1 - Correções críticas** (OBRIGATÓRIO antes de produção)
   - Implementar em 1 dia
   - Testar extensivamente
   - Validar com usuários

3. **Sprint 2 - Layout** (Recomendado)
   - Implementar em meio dia
   - Melhora significativa de UX

4. **Sprint 3 - Modo semanal** (Opcional, pode ser futuro)
   - Implementar quando Sprint 1 e 2 estiverem validados
   - Feature adicional, não crítica

---

## 📊 CONCLUSÃO

**Esforço Total:** 8-12 horas de desenvolvimento

**Impacto:**
- 🔴 Sprint 1: CRÍTICO (bugs e não-conformidades)
- 🟡 Sprint 2: ALTO (UX significativamente melhor)
- 🟢 Sprint 3: MÉDIO (feature adicional)

**Recomendação:**
- Implementar Sprint 1 e 2 antes de produção
- Sprint 3 pode ser implementado como enhancement futuro

**Com estes ajustes, a aplicação estará 100% conforme o modelo conceitual.**



