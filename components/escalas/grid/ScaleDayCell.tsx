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
  ehColunaPar?: boolean
}

export function ScaleDayCell({ 
  alocacoes, 
  ehPreEscala, 
  onAddShift, 
  onEditShift,
  ehFimDeSemana,
  ehDiaForaMes = false,
  dia,
  ehColunaPar = true
}: ScaleDayCellProps) {
  if (ehDiaForaMes) {
    return (
      <div 
        className={`
          min-w-0 p-2 border-r-2 border-gray-300 dark:border-gray-600 
          bg-gray-100 dark:bg-gray-900/50
        `}
      />
    )
  }
  
  // Determinar cor de fundo baseado no zebrado e fim de semana
  let bgColor = ''
  if (ehFimDeSemana) {
    // Fins de semana: cores mais saturadas
    bgColor = ehColunaPar 
      ? 'bg-blue-100 dark:bg-blue-900/20' 
      : 'bg-blue-50 dark:bg-blue-900/30'
  } else {
    // Dias úteis: zebrado suave
    bgColor = ehColunaPar 
      ? 'bg-white dark:bg-gray-800' 
      : 'bg-gray-50 dark:bg-gray-800/80'
  }
  
  return (
    <div 
      className={`
        min-w-0 p-2 border-r-2 border-gray-300 dark:border-gray-600 last:border-r-0
        min-h-[120px] h-full flex flex-col
        ${bgColor}
      `}
    >
      {/* Número do dia no topo - destacado */}
      {dia !== null && dia !== undefined && (
        <div className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex-shrink-0">
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


