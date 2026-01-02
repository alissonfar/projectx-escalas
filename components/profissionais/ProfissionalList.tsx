'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { criarProfissional, atualizarProfissional, desativarProfissional, type ActionResult, type ProfissionalComGrupo } from '@/lib/actions/profissionais'
import { ProfissionalForm } from './ProfissionalForm'
import { format } from 'date-fns'

interface ProfissionalListProps {
  profissionais: ProfissionalComGrupo[]
}

export function ProfissionalList({ profissionais }: ProfissionalListProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingProfissional, setEditingProfissional] = useState<ProfissionalComGrupo | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [profissionalToDelete, setProfissionalToDelete] = useState<ProfissionalComGrupo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = () => {
    setEditingProfissional(null)
    setFormOpen(true)
  }

  const handleEdit = (profissional: ProfissionalComGrupo) => {
    setEditingProfissional(profissional)
    setFormOpen(true)
  }

  const handleDelete = (profissional: ProfissionalComGrupo) => {
    setProfissionalToDelete(profissional)
    setDeleteDialogOpen(true)
  }

  const handleSubmit = async (data: any) => {
    setLoading(true)
    setError(null)

    try {
      let result: ActionResult
      if (editingProfissional) {
        result = await atualizarProfissional(editingProfissional.id, data)
      } else {
        result = await criarProfissional(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingProfissional(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao salvar profissional')
      }
    } catch (err) {
      setError('Erro ao salvar profissional')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!profissionalToDelete) return

    setLoading(true)
    setError(null)

    try {
      const result = await desativarProfissional(profissionalToDelete.id)
      if (result.success) {
        setDeleteDialogOpen(false)
        setProfissionalToDelete(null)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao desativar profissional')
      }
    } catch (err) {
      setError('Erro ao desativar profissional')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<ProfissionalComGrupo>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      sortable: true
    },
    {
      accessorKey: 'email',
      header: 'Email',
      sortable: true
    },
    {
      accessorKey: 'telefone',
      header: 'Telefone',
      sortable: false,
      cell: (row) => row.telefone || '-'
    },
    {
      accessorKey: 'grupo',
      header: 'Grupo',
      sortable: true,
      cell: (row) => `${row.grupo?.nome || '-'} (${row.grupo?.tipo || '-'})`
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profissionais</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os profissionais da sua organização
          </p>
        </div>
        <Button onClick={handleCreate}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Profissional
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
        data={profissionais}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Buscar por nome ou email..."
        searchKeys={['nome', 'email']}
        filters={[
          {
            key: 'grupo_id',
            label: 'Grupo',
            type: 'select',
            options: Array.from(new Set(profissionais.map(p => p.grupo?.id).filter(Boolean))).map(id => {
              const profissional = profissionais.find(p => p.grupo?.id === id)
              return {
                value: id!,
                label: profissional?.grupo?.nome || ''
              }
            })
          }
        ]}
      />

      {/* Form Modal */}
      <ProfissionalForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingProfissional(null)
          setError(null)
        }}
        onSubmit={handleSubmit}
        initialData={editingProfissional ? {
          nome: editingProfissional.nome,
          email: editingProfissional.email,
          telefone: editingProfissional.telefone || '',
          telefone2: editingProfissional.telefone2 || '',
          data_nascimento: editingProfissional.data_nascimento || '',
          profissao: editingProfissional.profissao || '',
          crefito: editingProfissional.crefito || '',
          uf_crefito: editingProfissional.uf_crefito || '',
          grupo_id: editingProfissional.grupo_id
        } : undefined}
        loading={loading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setProfissionalToDelete(null)
          setError(null)
        }}
        onConfirm={handleConfirmDelete}
        title="Desativar Profissional"
        message={
          profissionalToDelete
            ? `Tem certeza que deseja desativar o profissional "${profissionalToDelete.nome}"? Esta ação pode ser revertida posteriormente.`
            : ''
        }
        confirmText="Desativar"
        variant="danger"
        loading={loading}
      />
    </div>
  )
}



