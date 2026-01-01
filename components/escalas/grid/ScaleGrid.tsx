'use client'

import { ScaleHeader } from './ScaleHeader'
import { ScaleRowSector } from './ScaleRowSector'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface ScaleGridProps {
  setores: Array<Setor & { hospital: Hospital }>
  mes: number
  ano: number
  semanas: (number | null)[][]
  alocacoesPorSetor: Record<string, EscalaAlocacaoCompleta[]>
  estado: EscalaPeriodoEstado
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
}

export function ScaleGrid({
  setores,
  mes,
  ano,
  semanas,
  alocacoesPorSetor,
  estado,
  onAddShift,
  onEditShift
}: ScaleGridProps) {
  const ehPreEscala = estado === 'pre_escala'
  
  return (
    <div className="h-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
      {/* Header com dias da semana - fixo */}
      <div className="flex-shrink-0">
        <ScaleHeader mes={mes} ano={ano} semanas={semanas} />
      </div>
      
      {/* Linhas de setores - scrolláveis verticalmente */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {setores.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">Nenhum setor encontrado</p>
          </div>
        ) : (
          <div className="min-h-full">
            {setores.map((setor) => (
              <ScaleRowSector
                key={setor.id}
                setor={setor}
                mes={mes}
                ano={ano}
                semanas={semanas}
                alocacoes={alocacoesPorSetor[setor.id] || []}
                ehPreEscala={ehPreEscala}
                onAddShift={onAddShift}
                onEditShift={onEditShift}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


