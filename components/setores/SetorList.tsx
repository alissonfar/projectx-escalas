'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { criarSetor, atualizarSetor, desativarSetor, type ActionResult, type SetorComHospital } from '@/lib/actions/setores'
import { SetorForm } from './SetorForm'
import { format } from 'date-fns'

interface SetorListProps {
  setores: SetorComHospital[]
}

export function SetorList({ setores }: SetorListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSetor, setEditingSetor] = useState<SetorComHospital | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [setorToDelete, setSetorToDelete] = useState<SetorComHospital | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingSetor(null)
    setFormOpen(true)
  }

  const handleEdit = (setor: SetorComHospital) => {
    setEditingSetor(setor)
    setFormOpen(true)
  }

  const handleDelete = (setor: SetorComHospital) => {
    setSetorToDelete(setor)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      let result: ActionResult
      if (editingSetor) {
        result = await atualizarSetor(editingSetor.id, data)
      } else {
        result = await criarSetor(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingSetor(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao salvar setor')
      }
    } catch (err) {
      setError('Erro ao salvar setor')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!setorToDelete) return

    setLoading(true)
    setError(null)

    try {
      const result = await desativarSetor(setorToDelete.id)
      if (result.success) {
        setDeleteDialogOpen(false)
        setSetorToDelete(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao desativar setor')
      }
    } catch (err) {
      setError('Erro ao desativar setor')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<SetorComHospital>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      sortable: true
    },
    {
      accessorKey: 'hospital',
      header: 'Hospital',
      sortable: true,
      cell: (row) => row.hospital?.nome || '-'
    },
    {
      accessorKey: 'ativo',
      header: 'Status',
      sortable: true
    },
    {
      accessorKey: 'created_at',
      header: 'Criado em',
      sortable: true,
      cell: (row) => format(new Date(row.created_at), "dd/MM/yyyy 'às' HH:mm")
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Setores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os setores dos hospitais
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Setor
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
        data={setores}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar por nome..."
        searchKeys={['nome']}
        filters={[
          {
            key: 'hospital_id',
            label: 'Hospital',
            type: 'select',
            options: Array.from(new Set(setores.map(s => s.hospital?.id).filter(Boolean))).map(id => {
              const setor = setores.find(s => s.hospital?.id === id)
              return {
                value: id!,
                label: setor?.hospital?.nome || ''
              }
            })
          }
        ]}
      />

      {/* Form Modal */}
      <SetorForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingSetor(null)
          setError(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingSetor ? { nome: editingSetor.nome, hospital_id: editingSetor.hospital_id } : undefined}
        loading={loading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setSetorToDelete(null)
          setError(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Desativar Setor"
        message={
          setorToDelete
            ? `Tem certeza que deseja desativar o setor "${setorToDelete.nome}"? Esta ação pode ser revertida posteriormente.`
            : ''
        }
        confirmText="Desativar"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

