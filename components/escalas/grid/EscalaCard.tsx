'use client'

import { ScaleHeader } from './ScaleHeader'
import { ScaleRowSector } from './ScaleRowSector'
import { StateIndicator } from '../filters/StateIndicator'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface EscalaCardProps {
  setor: Setor & { hospital: Hospital }
  mes: number
  ano: number
  semanas: (number | null)[][]
  alocacoes: EscalaAlocacaoCompleta[]
  estado: EscalaPeriodoEstado
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
  onPublicar: (setorId: string) => void
  onDespublicar: (setorId: string) => void
  loading?: boolean
  modoCompacto?: boolean
}

export function EscalaCard({
  setor,
  mes,
  ano,
  semanas,
  alocacoes,
  estado,
  onAddShift,
  onEditShift,
  onPublicar,
  onDespublicar,
  loading = false,
  modoCompacto = false
}: EscalaCardProps) {
  const ehPreEscala = estado === 'pre_escala'

  return (
    <div className={`
      bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden flex flex-col
      ${modoCompacto ? 'mb-3' : 'mb-6'}
    `}>
      {/* Cabeçalho da escala com informações do setor e botão de publicação */}
      <div className={`
        bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600
        ${modoCompacto ? 'px-3 py-2' : 'px-4 py-3'}
      `}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className={`
              font-bold text-gray-900 dark:text-white truncate
              ${modoCompacto ? 'text-base' : 'text-lg'}
            `}>
              {setor.nome}
            </h3>
            {!modoCompacto && (
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {setor.hospital.nome}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <StateIndicator
              estado={estado}
              onPublicar={() => onPublicar(setor.id)}
              onDespublicar={() => onDespublicar(setor.id)}
              loading={loading}
              modoCompacto={modoCompacto}
            />
          </div>
        </div>
      </div>

      {/* Grid da escala */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header com dias da semana - fixo (sem coluna de setor) */}
        <div className="flex-shrink-0">
          <ScaleHeader mes={mes} ano={ano} semanas={semanas} mostrarColunaSetor={false} modoCompacto={modoCompacto} />
        </div>
        
        {/* Linha do setor - scrollável verticalmente */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <ScaleRowSector
            setor={setor}
            mes={mes}
            ano={ano}
            semanas={semanas}
            alocacoes={alocacoes}
            ehPreEscala={ehPreEscala}
            onAddShift={onAddShift}
            onEditShift={onEditShift}
            mostrarColunaSetor={false}
            modoCompacto={modoCompacto}
          />
        </div>
      </div>
    </div>
  )
}

