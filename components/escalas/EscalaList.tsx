'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DataTable, type ColumnDef } from '@/components/crud/DataTable'
import { ConfirmDialog } from '@/components/crud/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { 
  criarEscala, 
  atualizarEscala, 
  cancelarEscala,
  salvarRascunhoEscala,
  atualizarRascunhoEscala,
  publicarEscala,
  publicarMultiplasEscalas,
  despublicarEscala,
  type ActionResult, 
  type EscalaComRelacoes 
} from '@/lib/actions/escalas'
import { EscalaForm } from './EscalaForm'
import { StatusBadge } from '@/components/crud/StatusBadge'
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
  const [publicarDialogOpen, setPublicarDialogOpen] = useState(false)
  const [escalaToPublicar, setEscalaToPublicar] = useState<EscalaComRelacoes | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
    setSuccess(null)

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
        setSuccess(result.message || 'Escala salva com sucesso')
        router.refresh()
        
        // Mostrar aviso se houver conflitos
        if (result.conflitos && result.conflitos.length > 0) {
          setTimeout(() => {
            alert(`Escala salva com sucesso!\n\nAtenção: Foram detectados ${result.conflitos!.length} conflito(s) de horário.`)
          }, 100)
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

  const handleSalvarRascunho = async (data: any) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let result: ActionResult
      if (editingEscala) {
        result = await atualizarRascunhoEscala(editingEscala.id, data)
      } else {
        result = await salvarRascunhoEscala(data)
      }

      if (result.success) {
        setFormOpen(false)
        setEditingEscala(null)
        setSuccess(result.message || 'Rascunho salvo com sucesso')
        router.refresh()
        
        if (result.conflitos && result.conflitos.length > 0) {
          setTimeout(() => {
            alert(`Rascunho salvo com sucesso!\n\nAtenção: Foram detectados ${result.conflitos!.length} conflito(s) de horário com escalas publicadas.`)
          }, 100)
        }
      } else {
        setError(result.error || 'Erro ao salvar rascunho')
      }
    } catch (err) {
      setError('Erro ao salvar rascunho')
    } finally {
      setLoading(false)
    }
  }

  const handlePublicar = async (data: any) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Se está editando, primeiro atualiza e depois publica
      if (editingEscala) {
        // Atualizar primeiro
        const updateResult = await atualizarRascunhoEscala(editingEscala.id, data)
        if (!updateResult.success) {
          setError(updateResult.error || 'Erro ao atualizar escala')
          return
        }
        
        // Depois publicar
        const publishResult = await publicarEscala(editingEscala.id)
        if (publishResult.success) {
          setFormOpen(false)
          setEditingEscala(null)
          setSuccess(publishResult.message || 'Escala publicada com sucesso')
          router.refresh()
          
          if (publishResult.conflitos && publishResult.conflitos.length > 0) {
            setTimeout(() => {
              alert(`Escala publicada com sucesso!\n\nAtenção: Foram detectados ${publishResult.conflitos!.length} conflito(s) de horário.`)
            }, 100)
          }
        } else {
          setError(publishResult.error || 'Erro ao publicar escala')
        }
      } else {
        // Nova escala: criar como rascunho primeiro
        const createResult = await salvarRascunhoEscala(data)
        if (!createResult.success) {
          setError(createResult.error || 'Erro ao criar rascunho')
          return
        }

        // Verificar conflitos antes de publicar
        if (createResult.conflitos && createResult.conflitos.length > 0) {
          const shouldContinue = confirm(
            `Rascunho criado com sucesso!\n\nAtenção: Foram detectados ${createResult.conflitos.length} conflito(s) de horário com escalas publicadas.\n\nDeseja publicar mesmo assim?`
          )
          if (!shouldContinue) {
            setFormOpen(false)
            setEditingEscala(null)
            setSuccess('Rascunho salvo com sucesso. Você pode publicá-lo depois.')
            router.refresh()
            return
          }
        }
        
        // Publicar imediatamente se tiver ID
        if (createResult.id) {
          const publishResult = await publicarEscala(createResult.id)
          if (publishResult.success) {
            setFormOpen(false)
            setEditingEscala(null)
            setSuccess(publishResult.message || 'Escala criada e publicada com sucesso')
            router.refresh()
            
            if (publishResult.conflitos && publishResult.conflitos.length > 0) {
              setTimeout(() => {
                alert(`Escala publicada com sucesso!\n\nAtenção: Foram detectados ${publishResult.conflitos!.length} conflito(s) de horário.`)
              }, 100)
            }
          } else {
            setError(publishResult.error || 'Erro ao publicar escala')
          }
        } else {
          // Fallback: recarregar e avisar
          setFormOpen(false)
          setEditingEscala(null)
          setSuccess('Rascunho criado com sucesso! Use o botão "Publicar" na lista para publicá-lo.')
          router.refresh()
        }
      }
    } catch (err) {
      setError('Erro ao publicar escala')
    } finally {
      setLoading(false)
    }
  }

  const handlePublicarEscala = async (escala: EscalaComRelacoes) => {
    setEscalaToPublicar(escala)
    setPublicarDialogOpen(true)
  }

  const handleConfirmPublicar = async () => {
    if (!escalaToPublicar) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await publicarEscala(escalaToPublicar.id)
      if (result.success) {
        setPublicarDialogOpen(false)
        setEscalaToPublicar(null)
        setSuccess(result.message || 'Escala publicada com sucesso')
        router.refresh()
        
        if (result.conflitos && result.conflitos.length > 0) {
          setTimeout(() => {
            alert(`Escala publicada com sucesso!\n\nAtenção: Foram detectados ${result.conflitos!.length} conflito(s) de horário.`)
          }, 100)
        }
      } else {
        setError(result.error || 'Erro ao publicar escala')
      }
    } catch (err) {
      setError('Erro ao publicar escala')
    } finally {
      setLoading(false)
    }
  }

  const handleDespublicarEscala = async (escala: EscalaComRelacoes) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await despublicarEscala(escala.id)
      if (result.success) {
        setSuccess(result.message || 'Escala despublicada com sucesso')
        router.refresh()
      } else {
        setError(result.error || 'Erro ao despublicar escala')
      }
    } catch (err) {
      setError('Erro ao despublicar escala')
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
      cell: (row) => {
        const formatted = formatBrasiliaDateTime(row.data_inicio, 'dd/MM/yyyy HH:mm')
        return formatted.replace(' ', ' às ')
      }
    },
    {
      accessorKey: 'data_fim',
      header: 'Fim',
      sortable: true,
      cell: (row) => {
        const formatted = formatBrasiliaDateTime(row.data_fim, 'dd/MM/yyyy HH:mm')
        return formatted.replace(' ', ' às ')
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      sortable: true,
      cell: (row) => {
        const status = row.status as 'rascunho' | 'publicado' | 'cancelado'
        return <StatusBadge status={status} />
      }
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

      {/* Mensagens */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Tabela */}
      <DataTable
        data={escalas}
        columns={[
          ...columns,
          {
            accessorKey: 'acoes',
            header: 'Ações',
            sortable: false,
            cell: (row) => (
              <div className="flex items-center gap-2">
                {row.status === 'rascunho' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePublicarEscala(row)}
                    disabled={loading}
                    className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    title="Publicar escala"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </Button>
                )}
                {row.status === 'publicado' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDespublicarEscala(row)}
                    disabled={loading}
                    className="h-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                    title="Despublicar escala (voltar para rascunho)"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                )}
                {(row.status === 'publicado' || row.status === 'rascunho') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancel(row)}
                    disabled={loading}
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Cancelar escala"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
            )
          }
        ]}
        onEdit={handleEdit}
        onDelete={(escala) => {
          if (escala.status === 'publicado' || escala.status === 'rascunho') {
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
              { value: 'rascunho', label: 'Rascunho' },
              { value: 'publicado', label: 'Publicado' },
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
          setSuccess(null)
        }}
        onSubmit={handleSubmit}
        onSalvarRascunho={handleSalvarRascunho}
        onPublicar={handlePublicar}
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
          setSuccess(null)
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

      {/* Publicar Dialog */}
      <ConfirmDialog
        open={publicarDialogOpen}
        onClose={() => {
          setPublicarDialogOpen(false)
          setEscalaToPublicar(null)
          setError(null)
          setSuccess(null)
        }}
        onConfirm={handleConfirmPublicar}
        title="Publicar Escala"
        message={
          escalaToPublicar
            ? `Tem certeza que deseja publicar a escala de "${escalaToPublicar.profissional?.nome}" no setor "${escalaToPublicar.setor?.nome}"?\n\nA escala ficará visível para os profissionais após a publicação.`
            : ''
        }
        confirmText="Publicar"
        variant="default"
        loading={loading}
      />
    </div>
  )
}

