'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ScaleGrid } from './grid/ScaleGrid'
import { MonthSelector } from './filters/MonthSelector'
import { StateIndicator } from './filters/StateIndicator'
import { ViewModeSelector } from './filters/ViewModeSelector'
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
import { getWeeksInMonth, getDaysForVisualization, type VisualizacaoModo } from '@/lib/utils/calendar'
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
  
  // Calcular semanas e dias baseado no modo
  const semanas = useMemo(
    () => getWeeksInMonth(mes, ano),
    [mes, ano]
  )
  
  const totalSemanas = semanas.length
  
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
  
  // Buscar dados quando mês/ano mudar
  useEffect(() => {
    carregarDados()
  }, [mes, ano])
  
  // Buscar profissionais ao montar
  useEffect(() => {
    carregarProfissionais()
  }, [])
  
  // Resetar semana quando mudar mês
  useEffect(() => {
    setSemanaAtual(1)
  }, [mes, ano])
  
  const carregarProfissionais = async () => {
    const profs = await buscarProfissionaisParaSelect()
    setProfissionais(profs)
  }
  
  const carregarDados = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const periodos: Record<string, { id: string; estado: EscalaPeriodoEstado }> = {}
      const alocacoes: Record<string, EscalaAlocacaoCompleta[]> = {}
      
      // Para cada setor, buscar ou criar período e suas alocações
      for (const setor of setores) {
        const periodoResult = await criarOuObterPeriodo(setor.id, mes, ano)
        
        if (periodoResult.success && periodoResult.periodoId) {
          const alocacoesDoSetor = await buscarAlocacoesPeriodo(periodoResult.periodoId)
          
          periodos[setor.id] = {
            id: periodoResult.periodoId,
            estado: periodoResult.estado || 'pre_escala'  // ✅ Usar estado real do banco
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
  
  const handlePublicar = async () => {
    // Publicar todos os períodos do mês
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const results = await Promise.all(
        Object.values(periodosPorSetor).map(p => publicarPeriodo(p.id))
      )
      
      const erros = results.filter(r => !r.success)
      if (erros.length > 0) {
        setError(`Erro ao publicar alguns períodos: ${erros[0].error}`)
      } else {
        setSuccess('Mês publicado com sucesso!')
        await carregarDados()
      }
    } catch (err) {
      console.error('Erro ao publicar:', err)
      setError('Erro ao publicar mês')
    } finally {
      setLoading(false)
    }
  }
  
  const handleDespublicar = async () => {
    // Despublicar todos os períodos do mês
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const results = await Promise.all(
        Object.values(periodosPorSetor).map(p => despublicarPeriodo(p.id))
      )
      
      const erros = results.filter(r => !r.success)
      if (erros.length > 0) {
        setError(`Erro ao despublicar alguns períodos: ${erros[0].error}`)
      } else {
        setSuccess('Mês despublicado com sucesso! Agora você pode editar.')
        await carregarDados()
      }
    } catch (err) {
      console.error('Erro ao despublicar:', err)
      setError('Erro ao despublicar mês')
    } finally {
      setLoading(false)
    }
  }
  
  // Determinar estado geral (se algum está publicado, considera publicado)
  const estadoGeral: EscalaPeriodoEstado = Object.values(periodosPorSetor).some(p => p.estado === 'publicada')
    ? 'publicada'
    : 'pre_escala'
  
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
          <StateIndicator
            estado={estadoGeral}
            onPublicar={handlePublicar}
            onDespublicar={handleDespublicar}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Grid ocupa espaço restante (full-screen) */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        {loading && Object.keys(alocacoesPorSetor).length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Carregando...</p>
          </div>
        ) : (
          <ScaleGrid
            setores={setores}
            mes={mes}
            ano={ano}
            dias={dias}
            alocacoesPorSetor={alocacoesPorSetor}
            estado={estadoGeral}
            onAddShift={handleAddShift}
            onEditShift={handleEditShift}
          />
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


