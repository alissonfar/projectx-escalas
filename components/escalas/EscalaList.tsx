'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { criarEscala, atualizarEscala, cancelarEscala, type ActionResult, type EscalaComRelacoes } from '@/lib/actions/escalas'
import { EscalaForm } from './EscalaForm'
import { format } from 'date-fns'

interface EscalaListProps {
  escalas: EscalaComRelacoes[]
}

export function EscalaList({ escalas }: EscalaListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingEscala, setEditingEscala] = useState<EscalaComRelacoes | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [escalaToCancel, setEscalaToCancel] = useState<EscalaComRelacoes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingEscala(null)
    setFormOpen(true)
  }

  const handleEdit = (escala: EscalaComRelacoes) => {
    setEditingEscala(escala)
    setFormOpen(true)
  }

  const handleCancel = (escala: EscalaComRelacoes) => {
    setEscalaToCancel(escala)
    setCancelDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      let result: ActionResult
      if (editingEscala) {
        result = await atualizarEscala(editingEscala.id, data)
      } else {
        result = await criarEscala(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingEscala(null)
        router.refresh()
        
        // Mostrar aviso se houver conflitos
        if (result.conflitos && result.conflitos.length > 0) {
          alert(`Escala salva com sucesso!\n\nAtenção: Foram detectados ${result.conflitos.length} conflito(s) de horário.`)
        }
      } else {
        setError(result.error || 'Erro ao salvar escala')
      }
    } catch (err) {
      setError('Erro ao salvar escala')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCancel = async () => {
    if (!escalaToCancel) return

    setLoading(true)
    setError(null)

    try {
      const result = await cancelarEscala(escalaToCancel.id)
      if (result.success) {
        setCancelDialogOpen(false)
        setEscalaToCancel(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao cancelar escala')
      }
    } catch (err) {
      setError('Erro ao cancelar escala')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<EscalaComRelacoes>[] = [
    {
      accessorKey: 'profissional',
      header: 'Profissional',
      sortable: true,
      cell: (row) => row.profissional?.nome || '-'
    },
    {
      accessorKey: 'setor',
      header: 'Setor',
      sortable: true,
      cell: (row) => `${row.setor?.nome || '-'} - ${row.setor?.hospital?.nome || '-'}`
    },
    {
      accessorKey: 'data_inicio',
      header: 'Início',
      sortable: true,
      cell: (row) => format(new Date(row.data_inicio), "dd/MM/yyyy 'às' HH:mm")
    },
    {
      accessorKey: 'data_fim',
      header: 'Fim',
      sortable: true,
      cell: (row) => format(new Date(row.data_fim), "dd/MM/yyyy 'às' HH:mm")
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true
    },
    {
      accessorKey: 'created_at',
      header: 'Criada em',
      sortable: true,
      cell: (row) => format(new Date(row.created_at), "dd/MM/yyyy")
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Escalas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie as escalas de plantão
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Escala
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        data={escalas}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(escala) => {
          if (escala.status === 'confirmado') {
            handleCancel(escala)
          }
        }}
        searchPlaceholder="Buscar por profissional ou setor..."
        searchKeys={['profissional.nome', 'setor.nome']}
        filters={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'confirmado', label: 'Confirmado' },
              { value: 'cancelado', label: 'Cancelado' }
            ]
          }
        ]}
      />

      {/* Form Modal */}
      <EscalaForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingEscala(null)
          setError(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingEscala ? {
          id: editingEscala.id,
          setor_id: editingEscala.setor_id,
          profissional_id: editingEscala.profissional_id,
          data_inicio: editingEscala.data_inicio,
          data_fim: editingEscala.data_fim,
          observacoes: editingEscala.observacoes || '',
          status: editingEscala.status
        } : undefined}
        loading={loading}
      />

      {/* Cancel Dialog */}
      <ConfirmDialog
        open={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false)
          setEscalaToCancel(null)
          setError(null)
        }}
        onConfirm={handleConfirmCancel}
        title="Cancelar Escala"
        message={
          escalaToCancel
            ? `Tem certeza que deseja cancelar a escala de "${escalaToCancel.profissional?.nome}" no setor "${escalaToCancel.setor?.nome}"?`
            : ''
        }
        confirmText="Cancelar Escala"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

