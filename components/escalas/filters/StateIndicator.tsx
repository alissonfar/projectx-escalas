'use client'

import type { EscalaPeriodoEstado } from '@/types/database'

interface StateIndicatorProps {
  estado: EscalaPeriodoEstado
  onPublicar?: () => void
  onDespublicar?: () => void
  loading?: boolean
}

export function StateIndicator({ estado, onPublicar, onDespublicar, loading }: StateIndicatorProps) {
  const ehPreEscala = estado === 'pre_escala'
  
  return (
    <div className="flex items-center gap-3">
      {ehPreEscala ? (
        <>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Pré-escala (editável)
            </span>
          </div>
          {onPublicar && (
            <button
              onClick={onPublicar}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md"
            >
              {loading ? 'Publicando...' : 'Publicar Escala'}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Publicada (somente leitura)
            </span>
          </div>
          {onDespublicar && (
            <button
              onClick={onDespublicar}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md"
            >
              {loading ? 'Despublicando...' : 'Despublicar para Editar'}
            </button>
          )}
        </>
      )}
    </div>
  )
}




