'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ScaleGrid } from './grid/ScaleGrid'
import { MonthSelector } from './filters/MonthSelector'
import { ViewModeSelector } from './filters/ViewModeSelector'
import { SectorSelector } from './filters/SectorSelector'
import { AddShiftModal, type ShiftFormData } from './forms/AddShiftModal'
import { 
  criarOuObterPeriodo,
  publicarPeriodo,
  despublicarPeriodo
} from '@/lib/actions/escala-periodos'
import {
  buscarAlocacoesPeriodo,
  criarAlocacao,
  atualizarAlocacao,
  removerAlocacao,
  buscarProfissionaisParaSelect
} from '@/lib/actions/escala-alocacoes'
import { getWeeksInMonth, getDaysForVisualization, getWeeksMatrix, type VisualizacaoModo } from '@/lib/utils/calendar'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface EscalasClientProps {
  setoresIniciais: Array<Setor & { hospital: Hospital }>
  mesInicial: number
  anoInicial: number
}

export function EscalasClient({ setoresIniciais, mesInicial, anoInicial }: EscalasClientProps) {
  const router = useRouter()
  
  // Estado do calendário
  const [mes, setMes] = useState(mesInicial)
  const [ano, setAno] = useState(anoInicial)
  const [setores] = useState(setoresIniciais)
  const [modo, setModo] = useState<VisualizacaoModo>('mensal')
  const [semanaAtual, setSemanaAtual] = useState(1)
  
  // Estado do filtro de setores
  // Por padrão, seleciona o primeiro setor (se existir)
  const [setoresSelecionados, setSetoresSelecionados] = useState<string[]>(() => {
    return setoresIniciais.length > 0 ? [setoresIniciais[0].id] : []
  })
  
  // Calcular semanas e dias baseado no modo
  const semanas = useMemo(
    () => getWeeksInMonth(mes, ano),
    [mes, ano]
  )
  
  const totalSemanas = semanas.length
  
  // Para modo mensal, usar matriz de semanas (calendário tradicional)
  // Para modo semanal, converter a semana em matriz (preenchendo com null se necessário)
  const semanasMatrix = useMemo(() => {
    if (modo === 'mensal') {
      return getWeeksMatrix(mes, ano)
    } else {
      // Modo semanal: pegar a semana selecionada e converter para formato de matriz
      const diasSemana = getDaysForVisualization(modo, mes, ano, semanaAtual)
      // Criar array de 7 elementos, preenchendo com null os dias que não existem
      const semanaArray: (number | null)[] = new Array(7).fill(null)
      diasSemana.forEach((dia, index) => {
        const data = new Date(ano, mes - 1, dia)
        const diaSemana = data.getDay() // 0-6 (Dom-Sáb)
        semanaArray[diaSemana] = dia
      })
      return [semanaArray]
    }
  }, [modo, mes, ano, semanaAtual])
  
  const dias = useMemo(
    () => getDaysForVisualization(modo, mes, ano, semanaAtual),
    [modo, mes, ano, semanaAtual]
  )
  
  // Estado dos dados
  const [periodosPorSetor, setPeriodosPorSetor] = useState<Record<string, { id: string; estado: EscalaPeriodoEstado }>>({})
  const [alocacoesPorSetor, setAlocacoesPorSetor] = useState<Record<string, EscalaAlocacaoCompleta[]>>({})
  const [profissionais, setProfissionais] = useState<Array<{ value: string; label: string }>>([])
  
  // Estado da UI
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalData, setModalData] = useState<{
    setorId: string
    dia?: number
    alocacao?: EscalaAlocacaoCompleta
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Filtrar setores baseado na seleção
  const setoresFiltrados = useMemo(() => {
    if (setoresSelecionados.length === 0) {
      return [] // Se nenhum setor selecionado, não mostrar nada
    }
    return setores.filter(setor => setoresSelecionados.includes(setor.id))
  }, [setores, setoresSelecionados])
  
  const carregarProfissionais = async () => {
    const profs = await buscarProfissionaisParaSelect()
    setProfissionais(profs)
  }
  
  const carregarDados = useCallback(async () => {
    // Se nenhum setor selecionado, limpar dados
    if (setoresSelecionados.length === 0) {
      setPeriodosPorSetor({})
      setAlocacoesPorSetor({})
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      // ✅ CRÍTICO: Limpar dados ANTES de carregar novos para evitar estado "fantasma"
      // Isso garante que setores não selecionados não mantenham estado antigo
      const periodos: Record<string, { id: string; estado: EscalaPeriodoEstado }> = {}
      const alocacoes: Record<string, EscalaAlocacaoCompleta[]> = {}
      
      // Para cada setor SELECIONADO, buscar ou criar período e suas alocações
      for (const setorId of setoresSelecionados) {
        const setor = setores.find(s => s.id === setorId)
        if (!setor) continue
        
        const periodoResult = await criarOuObterPeriodo(setor.id, mes, ano)
        
        if (periodoResult.success && periodoResult.periodoId) {
          const alocacoesDoSetor = await buscarAlocacoesPeriodo(periodoResult.periodoId)
          
          // ✅ Isolar estado por setor - cada setor tem seu próprio estado
          periodos[setor.id] = {
            id: periodoResult.periodoId,
            estado: periodoResult.estado || 'pre_escala'  // ✅ Estado real do banco para ESTE setor
          }
          alocacoes[setor.id] = alocacoesDoSetor
        }
      }
      
      // ✅ Substituir completamente os dados (não merge) para garantir isolamento
      setPeriodosPorSetor(periodos)
      setAlocacoesPorSetor(alocacoes)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados do período')
    } finally {
      setLoading(false)
    }
  }, [setoresSelecionados, mes, ano, setores])
  
  // Buscar dados quando mês/ano ou setores selecionados mudarem
  useEffect(() => {
    carregarDados()
  }, [carregarDados])
  
  // Buscar profissionais ao montar
  useEffect(() => {
    carregarProfissionais()
  }, [])
  
  // Resetar semana quando mudar mês
  useEffect(() => {
    setSemanaAtual(1)
  }, [mes, ano])
  
  const handleMudaMes = (novoMes: number, novoAno: number) => {
    setMes(novoMes)
    setAno(novoAno)
  }
  
  const handleAddShift = (setorId: string, dia: number) => {
    setModalData({ setorId, dia })
    setModalOpen(true)
  }
  
  const handleEditShift = (alocacao: EscalaAlocacaoCompleta) => {
    // Encontrar setor da alocação
    const setorId = Object.keys(alocacoesPorSetor).find(sid => 
      alocacoesPorSetor[sid].some(a => a.id === alocacao.id)
    )
    
    if (setorId) {
      setModalData({ setorId, alocacao })
      setModalOpen(true)
    }
  }
  
  const handleSubmitShift = async (data: ShiftFormData) => {
    if (!modalData) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const periodoId = periodosPorSetor[modalData.setorId]?.id
      if (!periodoId) {
        setError('Período não encontrado')
        return
      }
      
      const alocacaoData = {
        ...data,
        periodo_id: periodoId
      }
      
      let result
      if (modalData.alocacao) {
        // Editando
        result = await atualizarAlocacao(modalData.alocacao.id, alocacaoData)
      } else {
        // Criando
        result = await criarAlocacao(alocacaoData)
      }
      
      if (result.success) {
        setSuccess(result.message || 'Plantão salvo com sucesso')
        setModalOpen(false)
        setModalData(null)
        await carregarDados()
        
        if (result.conflitos && result.conflitos.length > 0) {
          setTimeout(() => {
            alert(`Atenção: ${result.conflitos!.length} conflito(s) de horário detectado(s)`)
          }, 100)
        }
      } else {
        setError(result.error || 'Erro ao salvar plantão')
      }
    } catch (err) {
      console.error('Erro ao salvar plantão:', err)
      setError('Erro ao salvar plantão')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteShift = async () => {
    if (!modalData?.alocacao) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await removerAlocacao(modalData.alocacao.id)
      
      if (result.success) {
        setSuccess(result.message || 'Plantão removido com sucesso')
        setModalOpen(false)
        setModalData(null)
        await carregarDados()
      } else {
        setError(result.error || 'Erro ao remover plantão')
      }
    } catch (err) {
      console.error('Erro ao remover plantão:', err)
      setError('Erro ao remover plantão')
    } finally {
      setLoading(false)
    }
  }
  
  // ✅ Funções de publicação individuais por setor
  const handlePublicarSetor = async (setorId: string) => {
    const periodo = periodosPorSetor[setorId]
    
    if (!periodo) {
      setError('Período não encontrado para este setor')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await publicarPeriodo(periodo.id)
      
      if (result.success) {
        const setor = setores.find(s => s.id === setorId)
        setSuccess(`Escala do setor "${setor?.nome}" publicada com sucesso!`)
        await carregarDados()
      } else {
        setError(result.error || 'Erro ao publicar escala')
      }
    } catch (err) {
      console.error('Erro ao publicar:', err)
      setError('Erro ao publicar escala')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDespublicarSetor = async (setorId: string) => {
    const periodo = periodosPorSetor[setorId]
    
    if (!periodo) {
      setError('Período não encontrado para este setor')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const result = await despublicarPeriodo(periodo.id)
      
      if (result.success) {
        const setor = setores.find(s => s.id === setorId)
        setSuccess(`Escala do setor "${setor?.nome}" despublicada. Agora você pode editar.`)
        await carregarDados()
      } else {
        setError(result.error || 'Erro ao despublicar escala')
      }
    } catch (err) {
      console.error('Erro ao despublicar:', err)
      setError('Erro ao despublicar escala')
    } finally {
      setLoading(false)
    }
  }
  
  // ✅ Criar objeto de estados por setor para passar ao ScaleGrid
  const estadosPorSetor = useMemo(() => {
    const estados: Record<string, EscalaPeriodoEstado> = {}
    setoresSelecionados.forEach(setorId => {
      const periodo = periodosPorSetor[setorId]
      estados[setorId] = periodo?.estado || 'pre_escala'
    })
    return estados
  }, [setoresSelecionados, periodosPorSetor])
  
  // Atualizar setores selecionados quando setores disponíveis mudarem
  useEffect(() => {
    // Se algum setor selecionado não existe mais, removê-lo
    const setoresValidos = setoresSelecionados.filter(id => 
      setores.some(s => s.id === id)
    )
    
    // Se algum setor foi removido, atualizar a seleção
    if (setoresValidos.length !== setoresSelecionados.length) {
      // Se ainda há setores válidos, manter apenas eles
      if (setoresValidos.length > 0) {
        setSetoresSelecionados(setoresValidos)
      } 
      // Se não há mais setores válidos mas há setores disponíveis, selecionar o primeiro
      else if (setores.length > 0) {
        setSetoresSelecionados([setores[0].id])
      }
      // Se não há setores disponíveis, limpar seleção
      else {
        setSetoresSelecionados([])
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setores])
  
  return (
    <div className="flex flex-col h-full">
      {/* Header fixo */}
      <div className="flex-shrink-0 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Escalas</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie as escalas de plantão por período
            </p>
          </div>
        </div>
        
        {/* Mensagens */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}
        
        {/* Controles */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 flex-wrap">
            <SectorSelector
              setores={setores}
              selectedSetores={setoresSelecionados}
              onChange={setSetoresSelecionados}
            />
            <MonthSelector mes={mes} ano={ano} onChange={handleMudaMes} />
            <ViewModeSelector
              modo={modo}
              semana={semanaAtual}
              totalSemanas={totalSemanas}
              onChange={setModo}
              onSemanaChange={setSemanaAtual}
            />
          </div>
        </div>
      </div>
      
      {/* Grid ocupa espaço restante (full-screen) */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {loading && Object.keys(alocacoesPorSetor).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        ) : (
          setoresFiltrados.length === 0 ? (
            <div className="flex items-center justify-center h-full border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
                  Nenhum setor selecionado
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">
                  Selecione um ou mais setores no filtro acima para visualizar as escalas
                </p>
              </div>
            </div>
          ) : (
            <ScaleGrid
              setores={setoresFiltrados}
              mes={mes}
              ano={ano}
              semanas={modo === 'mensal' ? semanasMatrix : semanasMatrix}
              alocacoesPorSetor={alocacoesPorSetor}
              estadosPorSetor={estadosPorSetor}
              onAddShift={handleAddShift}
              onEditShift={handleEditShift}
              onPublicar={handlePublicarSetor}
              onDespublicar={handleDespublicarSetor}
              loading={loading}
            />
          )
        )}
      </div>
      
      {/* Modal */}
      <AddShiftModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setModalData(null)
        }}
        onSubmit={handleSubmitShift}
        onDelete={modalData?.alocacao ? handleDeleteShift : undefined}
        profissionais={profissionais}
        initialData={modalData?.alocacao ? {
          profissional_id: modalData.alocacao.profissional_id,
          data_inicio: modalData.alocacao.data_inicio,
          data_fim: modalData.alocacao.data_fim,
          turno: modalData.alocacao.turno,
          observacoes: modalData.alocacao.observacoes || undefined
        } : undefined}
        diaInicial={modalData?.dia}
        mesAno={{ mes, ano }}
        loading={loading}
        editMode={!!modalData?.alocacao}
      />
    </div>
  )
}


