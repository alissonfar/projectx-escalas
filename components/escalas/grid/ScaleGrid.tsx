'use client'

import { ScaleHeader } from './ScaleHeader'
import { ScaleRowSector } from './ScaleRowSector'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface ScaleGridProps {
  setores: Array<Setor & { hospital: Hospital }>
  mes: number
  ano: number
  dias: number[]
  alocacoesPorSetor: Record<string, EscalaAlocacaoCompleta[]>
  estado: EscalaPeriodoEstado
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
}

export function ScaleGrid({
  setores,
  mes,
  ano,
  dias,
  alocacoesPorSetor,
  estado,
  onAddShift,
  onEditShift
}: ScaleGridProps) {
  const ehPreEscala = estado === 'pre_escala'
  const numeroDias = dias.length
  
  return (
    <div className="h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Header com datas - fixo */}
      <div className="flex-shrink-0">
        <ScaleHeader mes={mes} ano={ano} dias={dias} />
      </div>
      
      {/* Linhas de setores - scrolláveis */}
      <div className="flex-1 overflow-auto">
        {setores.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Nenhum setor encontrado</p>
          </div>
        ) : (
          setores.map((setor) => (
            <ScaleRowSector
              key={setor.id}
              setor={setor}
              mes={mes}
              ano={ano}
              dias={dias}
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


