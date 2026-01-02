'use client'

import { formatBrasiliaDateTime } from '@/lib/utils/datetime'
import type { EscalaAlocacaoCompleta } from '@/types/database'

interface ShiftCardProps {
  alocacao: EscalaAlocacaoCompleta
  ehPreEscala: boolean
  onClick?: () => void
  modoCompacto?: boolean
}

const TURNO_COLORS = {
  manha: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
  tarde: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  noite: 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700',
  integral: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
}

export function ShiftCard({ alocacao, ehPreEscala, onClick, modoCompacto = false }: ShiftCardProps) {
  // Formatar horários em timezone de Brasília
  const horaInicio = formatBrasiliaDateTime(alocacao.data_inicio, 'HH:mm')
  const horaFim = formatBrasiliaDateTime(alocacao.data_fim, 'HH:mm')
  const corTurno = TURNO_COLORS[alocacao.turno] || TURNO_COLORS.integral
  
  return (
    <div
      className={`
        ${corTurno}
        border rounded cursor-pointer
        hover:shadow-md transition-shadow
        ${ehPreEscala ? 'hover:border-blue-500' : ''}
        ${modoCompacto ? 'p-1 text-[10px]' : 'p-1.5 text-xs'}
      `}
      onClick={onClick}
      title={ehPreEscala ? 'Clique para editar' : 'Somente leitura (publicado)'}
    >
      <div className="font-semibold text-gray-900 dark:text-white truncate">
        {alocacao.profissional.nome}
      </div>
      <div className={`text-gray-600 dark:text-gray-300 flex items-center justify-between ${modoCompacto ? 'mt-0.5' : 'mt-1'}`}>
        <span>{horaInicio} - {horaFim}</span>
        <span className={`uppercase font-medium ${modoCompacto ? 'text-[9px]' : 'text-[10px]'}`}>
          {alocacao.turno}
        </span>
      </div>
      {alocacao.observacoes && !modoCompacto && (
        <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-1 truncate" title={alocacao.observacoes}>
          {alocacao.observacoes}
        </div>
      )}
    </div>
  )
}




