'use client'

import type { EscalaPeriodoEstado } from '@/types/database'

interface StateIndicatorProps {
  estado: EscalaPeriodoEstado
  onPublicar?: () => void
  onDespublicar?: () => void
  loading?: boolean
  modoCompacto?: boolean
}

export function StateIndicator({ estado, onPublicar, onDespublicar, loading, modoCompacto = false }: StateIndicatorProps) {
  const ehPreEscala = estado === 'pre_escala'
  
  return (
    <div className={`flex items-center ${modoCompacto ? 'gap-1.5' : 'gap-2'}`}>
      {ehPreEscala ? (
        <>
          {!modoCompacto && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                Pré-escala
              </span>
            </div>
          )}
          {onPublicar && (
            <button
              onClick={onPublicar}
              disabled={loading}
              className={`
                bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md
                ${modoCompacto ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
              `}
            >
              {loading ? '...' : modoCompacto ? 'Publicar' : 'Publicar Escala'}
            </button>
          )}
        </>
      ) : (
        <>
          {!modoCompacto && (
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                Publicada
              </span>
            </div>
          )}
          {onDespublicar && (
            <button
              onClick={onDespublicar}
              disabled={loading}
              className={`
                bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md
                ${modoCompacto ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
              `}
            >
              {loading ? '...' : modoCompacto ? 'Editar' : 'Despublicar'}
            </button>
          )}
        </>
      )}
    </div>
  )
}




