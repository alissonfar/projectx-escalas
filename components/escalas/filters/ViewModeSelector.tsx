'use client'

import { Button } from '@/components/ui/button'
import type { VisualizacaoModo } from '@/lib/utils/calendar'

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
      <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
        <button
          onClick={() => onChange('mensal')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            modo === 'mensal'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => onChange('semanal')}
          className={`px-4 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition-colors ${
            modo === 'semanal'
              ? 'bg-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Semanal
        </button>
      </div>
      
      {/* Navegação de semanas (apenas no modo semanal) */}
      {modo === 'semanal' && totalSemanas && onSemanaChange && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSemanaChange(Math.max(1, (semana || 1) - 1))}
            disabled={semana === 1}
            title="Semana anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            Semana {semana} de {totalSemanas}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSemanaChange(Math.min(totalSemanas, (semana || 1) + 1))}
            disabled={semana === totalSemanas}
            title="Próxima semana"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}
    </div>
  )
}


