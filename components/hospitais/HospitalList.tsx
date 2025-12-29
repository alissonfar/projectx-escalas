'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { criarHospital, atualizarHospital, desativarHospital, type ActionResult } from '@/lib/actions/hospitais'
import { HospitalForm } from './HospitalForm'
import type { Hospital } from '@/types/database'
import { format } from 'date-fns'

interface HospitalListProps {
  hospitais: Hospital[]
}

export function HospitalList({ hospitais }: HospitalListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [hospitalToDelete, setHospitalToDelete] = useState<Hospital | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingHospital(null)
    setFormOpen(true)
  }

  const handleEdit = (hospital: Hospital) => {
    setEditingHospital(hospital)
    setFormOpen(true)
  }

  const handleDelete = (hospital: Hospital) => {
    setHospitalToDelete(hospital)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      let result: ActionResult
      if (editingHospital) {
        result = await atualizarHospital(editingHospital.id, data)
      } else {
        result = await criarHospital(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingHospital(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao salvar hospital')
      }
    } catch (err) {
      setError('Erro ao salvar hospital')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!hospitalToDelete) return

    setLoading(true)
    setError(null)

    try {
      const result = await desativarHospital(hospitalToDelete.id)
      if (result.success) {
        setDeleteDialogOpen(false)
        setHospitalToDelete(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao desativar hospital')
      }
    } catch (err) {
      setError('Erro ao desativar hospital')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<Hospital>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      sortable: true
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Hospitais</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os hospitais da sua organização
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Hospital
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
        data={hospitais}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar por nome..."
        searchKeys={['nome']}
      />

      {/* Form Modal */}
      <HospitalForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingHospital(null)
          setError(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingHospital ? { nome: editingHospital.nome, organizacao_id: '' } : undefined}
        loading={loading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setHospitalToDelete(null)
          setError(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Desativar Hospital"
        message={
          hospitalToDelete
            ? `Tem certeza que deseja desativar o hospital "${hospitalToDelete.nome}"? Esta ação pode ser revertida posteriormente.`
            : ''
        }
        confirmText="Desativar"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}

