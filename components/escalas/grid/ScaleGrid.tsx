'use client'

import { ScaleHeader } from './ScaleHeader'
import { ScaleRowSector } from './ScaleRowSector'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface ScaleGridProps {
  setores: Array<Setor & { hospital: Hospital }>
  mes: number
  ano: number
  alocacoesPorSetor: Record<string, EscalaAlocacaoCompleta[]>
  estado: EscalaPeriodoEstado
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
}

export function ScaleGrid({
  setores,
  mes,
  ano,
  alocacoesPorSetor,
  estado,
  onAddShift,
  onEditShift
}: ScaleGridProps) {
  const ehPreEscala = estado === 'pre_escala'
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header com datas */}
      <ScaleHeader mes={mes} ano={ano} />
      
      {/* Linhas de setores */}
      <div className="max-h-[600px] overflow-y-auto">
        {setores.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Nenhum setor encontrado
          </div>
        ) : (
          setores.map((setor) => (
            <ScaleRowSector
              key={setor.id}
              setor={setor}
              mes={mes}
              ano={ano}
              alocacoes={alocacoesPorSetor[setor.id] || []}
              ehPreEscala={ehPreEscala}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
            />
          ))
        )}
      </div>
    </div>
  )
}


