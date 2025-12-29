'use client'

import { getDaysInMonth, getDay } from 'date-fns'
import { ScaleDayCell } from './ScaleDayCell'
import type { Setor, Hospital, EscalaAlocacaoCompleta } from '@/types/database'

interface ScaleRowSectorProps {
  setor: Setor & { hospital: Hospital }
  mes: number
  ano: number
  alocacoes: EscalaAlocacaoCompleta[]
  ehPreEscala: boolean
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
}

export function ScaleRowSector({
  setor,
  mes,
  ano,
  alocacoes,
  ehPreEscala,
  onAddShift,
  onEditShift
}: ScaleRowSectorProps) {
  const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
  const dias = Array.from({ length: numeroDias }, (_, i) => i + 1)
  
  // Agrupar alocações por dia
  const alocacoesPorDia = dias.reduce((acc, dia) => {
    const dataInicio = new Date(ano, mes - 1, dia, 0, 0, 0)
    const dataFim = new Date(ano, mes - 1, dia, 23, 59, 59)
    
    const alocacoesDoDia = alocacoes.filter(a => {
      const alocInicio = new Date(a.data_inicio)
      const alocFim = new Date(a.data_fim)
      
      // Considera a alocação se ela está ativa em algum momento do dia
      return (
        (alocInicio >= dataInicio && alocInicio <= dataFim) ||
        (alocFim >= dataInicio && alocFim <= dataFim) ||
        (alocInicio <= dataInicio && alocFim >= dataFim)
      )
    })
    
    acc[dia] = alocacoesDoDia
    return acc
  }, {} as Record<number, EscalaAlocacaoCompleta[]>)
  
  const obterDiaSemana = (dia: number) => {
    const data = new Date(ano, mes - 1, dia)
    return getDay(data)
  }
  
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {/* Coluna fixa com nome do setor */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900">
        <div className="font-semibold text-gray-900 dark:text-white">
          {setor.nome}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {setor.hospital.nome}
        </div>
      </div>
      
      {/* Células de dias */}
      <div className="flex-1 flex overflow-x-auto">
        {dias.map((dia) => {
          const diaSemana = obterDiaSemana(dia)
          const ehFimDeSemana = diaSemana === 0 || diaSemana === 6
          
          return (
            <ScaleDayCell
              key={dia}
              alocacoes={alocacoesPorDia[dia] || []}
              ehPreEscala={ehPreEscala}
              onAddShift={() => onAddShift(setor.id, dia)}
              onEditShift={onEditShift}
              ehFimDeSemana={ehFimDeSemana}
            />
          )
        })}
      </div>
    </div>
  )
}


