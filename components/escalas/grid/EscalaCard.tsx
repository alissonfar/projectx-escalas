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
  loading = false
}: EscalaCardProps) {
  const ehPreEscala = estado === 'pre_escala'

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg mb-6 overflow-hidden flex flex-col">
      {/* Cabeçalho da escala com informações do setor e botão de publicação */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-300 dark:border-gray-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {setor.nome}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {setor.hospital.nome}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <StateIndicator
              estado={estado}
              onPublicar={() => onPublicar(setor.id)}
              onDespublicar={() => onDespublicar(setor.id)}
              loading={loading}
            />
          </div>
        </div>
      </div>

      {/* Grid da escala */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header com dias da semana - fixo (sem coluna de setor) */}
        <div className="flex-shrink-0">
          <ScaleHeader mes={mes} ano={ano} semanas={semanas} mostrarColunaSetor={false} />
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
          />
        </div>
      </div>
    </div>
  )
}

