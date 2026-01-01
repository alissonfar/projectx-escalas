'use client'

import { ShiftCard } from './ShiftCard'
import { AddShiftButton } from './AddShiftButton'
import type { EscalaAlocacaoCompleta } from '@/types/database'

interface ScaleDayCellProps {
  alocacoes: EscalaAlocacaoCompleta[]
  ehPreEscala: boolean
  onAddShift: () => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
  ehFimDeSemana?: boolean
  ehDiaForaMes?: boolean
  dia?: number | null
}

export function ScaleDayCell({ 
  alocacoes, 
  ehPreEscala, 
  onAddShift, 
  onEditShift,
  ehFimDeSemana,
  ehDiaForaMes = false,
  dia
}: ScaleDayCellProps) {
  if (ehDiaForaMes) {
    return (
      <div 
        className={`
          min-w-0 p-2 border-r border-gray-200 dark:border-gray-700 
          bg-gray-50 dark:bg-gray-900/50
        `}
      />
    )
  }
  
  return (
    <div 
      className={`
        min-w-0 p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0
        min-h-[120px] h-full flex flex-col
        ${ehFimDeSemana ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}
      `}
    >
      {/* Número do dia no topo */}
      {dia !== null && dia !== undefined && (
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 flex-shrink-0">
          {dia}
        </div>
      )}
      
      {/* Container scrollável para alocações */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {/* Alocações existentes */}
        {alocacoes.map((alocacao) => (
          <ShiftCard
            key={alocacao.id}
            alocacao={alocacao}
            ehPreEscala={ehPreEscala}
            onClick={() => ehPreEscala && onEditShift(alocacao)}
          />
        ))}
        
        {/* Botão para adicionar (apenas se pré-escala) */}
        {ehPreEscala && (
          <AddShiftButton onClick={onAddShift} />
        )}
      </div>
    </div>
  )
}


