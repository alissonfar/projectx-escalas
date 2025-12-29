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
}

export function ScaleDayCell({ 
  alocacoes, 
  ehPreEscala, 
  onAddShift, 
  onEditShift,
  ehFimDeSemana 
}: ScaleDayCellProps) {
  return (
    <div 
      className={`
        min-w-0 p-2 border-r border-gray-200 dark:border-gray-700 
        min-h-[100px] max-h-[200px] overflow-y-auto
        ${ehFimDeSemana ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-white dark:bg-gray-800'}
      `}
    >
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
  )
}


