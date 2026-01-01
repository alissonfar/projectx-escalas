'use client'

import { getDay } from 'date-fns'
import { ScaleDayCell } from './ScaleDayCell'
import type { Setor, Hospital, EscalaAlocacaoCompleta } from '@/types/database'

interface ScaleRowSectorProps {
  setor: Setor & { hospital: Hospital }
  mes: number
  ano: number
  semanas: (number | null)[][]
  alocacoes: EscalaAlocacaoCompleta[]
  ehPreEscala: boolean
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
}

export function ScaleRowSector({
  setor,
  mes,
  ano,
  semanas,
  alocacoes,
  ehPreEscala,
  onAddShift,
  onEditShift
}: ScaleRowSectorProps) {
  // Agrupar alocações por dia
  const alocacoesPorDia = semanas.flat().reduce((acc, dia) => {
    if (dia === null) return acc
    
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
  
  const obterDiaSemana = (dia: number | null) => {
    if (dia === null) return null
    const data = new Date(ano, mes - 1, dia)
    return getDay(data)
  }
  
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 relative">
      {/* Coluna fixa do setor - posicionada de forma absoluta */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-[200px] border-r border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-900 z-10"
      >
        <div className="font-semibold text-gray-900 dark:text-white">
          {setor.nome}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {setor.hospital.nome}
        </div>
      </div>
      
      {/* Semanas com margem para a coluna do setor */}
      <div className="ml-[200px]">
        {semanas.map((semana, semanaIndex) => (
          <div 
            key={semanaIndex}
            className="grid border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            style={{
              gridTemplateColumns: 'repeat(7, 1fr)'
            }}
          >
            {/* Células de dias da semana (7 colunas fixas) */}
            {semana.map((dia, diaIndex) => {
              const diaSemana = obterDiaSemana(dia)
              const ehFimDeSemana = diaSemana === 0 || diaSemana === 6
              const ehDiaForaMes = dia === null
              const ehUltimaColuna = diaIndex === semana.length - 1
              
              return (
                <ScaleDayCell
                  key={`${semanaIndex}-${diaIndex}`}
                  alocacoes={dia !== null ? (alocacoesPorDia[dia] || []) : []}
                  ehPreEscala={ehPreEscala}
                  onAddShift={() => dia !== null && onAddShift(setor.id, dia)}
                  onEditShift={onEditShift}
                  ehFimDeSemana={ehFimDeSemana}
                  ehDiaForaMes={ehDiaForaMes}
                  dia={dia}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}


