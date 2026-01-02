'use client'

import { EscalaCard } from './EscalaCard'
import type { Setor, Hospital, EscalaAlocacaoCompleta, EscalaPeriodoEstado } from '@/types/database'

interface ScaleGridProps {
  setores: Array<Setor & { hospital: Hospital }>
  mes: number
  ano: number
  semanas: (number | null)[][]
  alocacoesPorSetor: Record<string, EscalaAlocacaoCompleta[]>
  estadosPorSetor: Record<string, EscalaPeriodoEstado>
  onAddShift: (setorId: string, dia: number) => void
  onEditShift: (alocacao: EscalaAlocacaoCompleta) => void
  onPublicar: (setorId: string) => void
  onDespublicar: (setorId: string) => void
  loading?: boolean
}

export function ScaleGrid({
  setores,
  mes,
  ano,
  semanas,
  alocacoesPorSetor,
  estadosPorSetor,
  onAddShift,
  onEditShift,
  onPublicar,
  onDespublicar,
  loading = false
}: ScaleGridProps) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      {setores.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 dark:text-gray-400">Nenhum setor encontrado</p>
        </div>
      ) : (
        <div className="py-4">
          {setores.map((setor) => (
            <EscalaCard
              key={setor.id}
              setor={setor}
              mes={mes}
              ano={ano}
              semanas={semanas}
              alocacoes={alocacoesPorSetor[setor.id] || []}
              estado={estadosPorSetor[setor.id] || 'pre_escala'}
              onAddShift={onAddShift}
              onEditShift={onEditShift}
              onPublicar={onPublicar}
              onDespublicar={onDespublicar}
              loading={loading}
            />
          ))}
        </div>
      )}
    </div>
  )
}


