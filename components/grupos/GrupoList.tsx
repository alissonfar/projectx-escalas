'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { criarGrupo, atualizarGrupo, desativarGrupo, type ActionResult } from '@/lib/actions/grupos'
import { GrupoForm } from './GrupoForm'
import type { Grupo } from '@/types/database'
import { format } from 'date-fns'

interface GrupoListProps {
  grupos: Grupo[]
}

export function GrupoList({ grupos }: GrupoListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingGrupo(null)
    setFormOpen(true)
  }

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo)
    setFormOpen(true)
  }

  const handleDelete = (grupo: Grupo) => {
    setGrupoToDelete(grupo)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      let result: ActionResult
      if (editingGrupo) {
        result = await atualizarGrupo(editingGrupo.id, data)
      } else {
        result = await criarGrupo(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingGrupo(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao salvar grupo')
      }
    } catch (err) {
      setError('Erro ao salvar grupo')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!grupoToDelete) return

    setLoading(true)
    setError(null)

    try {
      const result = await desativarGrupo(grupoToDelete.id)
      if (result.success) {
        setDeleteDialogOpen(false)
        setGrupoToDelete(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao desativar grupo')
      }
    } catch (err) {
      setError('Erro ao desativar grupo')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<Grupo>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      sortable: true
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo',
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Grupos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os grupos de profissionais
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Grupo
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
        data={grupos}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar por nome..."
        searchKeys={['nome', 'tipo']}
        filters={[
          {
            key: 'tipo',
            label: 'Tipo',
            type: 'select',
            options: Array.from(new Set(grupos.map(g => g.tipo))).map(tipo => ({
              value: tipo,
              label: tipo
            }))
          }
        ]}
      />

      {/* Form Modal */}
      <GrupoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingGrupo(null)
          setError(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingGrupo ? { nome: editingGrupo.nome, tipo: editingGrupo.tipo as any, organizacao_id: '' } : undefined}
        loading={loading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setGrupoToDelete(null)
          setError(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Desativar Grupo"
        message={
          grupoToDelete
            ? `Tem certeza que deseja desativar o grupo "${grupoToDelete.nome}"? Esta ação pode ser revertida posteriormente.`
            : ''
        }
        confirmText="Desativar"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}



