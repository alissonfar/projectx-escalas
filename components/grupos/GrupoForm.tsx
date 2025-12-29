'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { grupoSchema, type GrupoFormData } from '@/lib/validations/grupo'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { FormModal } from '@/components/crud/FormModal'
import { TIPOS_GRUPO_PERMITIDOS } from '@/lib/constants'

interface GrupoFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: GrupoFormData) => Promise<void>
  initialData?: GrupoFormData
  loading?: boolean
}

const tipoOptions = TIPOS_GRUPO_PERMITIDOS.map(tipo => ({
  value: tipo,
  label: tipo
}))

export function GrupoForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: GrupoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    watch,
    trigger
  } = useForm<GrupoFormData>({
    resolver: zodResolver(grupoSchema),
    mode: 'onChange', // Validação em tempo real
    defaultValues: initialData || {
      nome: '',
      tipo: '' as any,
      organizacao_id: ''
    }
  })

  const tipo = watch('tipo')

  const handleFormSubmit = handleSubmit(
    async (data) => {
      try {
        await onSubmit(data)
        if (!initialData) {
          reset()
        }
      } catch (error) {
        console.error('Erro ao submeter formulário:', error)
        // Erro será tratado pelo componente pai
      }
    },
    (errors) => {
      // Validação falhou - erros já são exibidos automaticamente pelo react-hook-form
      console.error('Erros de validação:', errors)
    }
  )

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Grupo' : 'Novo Grupo'}
      onSubmit={handleFormSubmit}
      submitLabel={initialData ? 'Atualizar' : 'Criar'}
      loading={loading}
    >
      <div>
        <Label htmlFor="nome" className="required">
          Nome do Grupo
        </Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Médicos Plantonistas"
          className={errors.nome ? 'border-red-500' : ''}
          disabled={loading}
        />
        {errors.nome && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.nome.message}
          </p>
        )}
      </div>

      <div>
        <Select
          label="Tipo"
          required
          options={tipoOptions}
          value={tipo || ''}
          onChange={(value) => {
            setValue('tipo', value as any, { shouldValidate: true })
            trigger('tipo')
          }}
          error={errors.tipo?.message}
          disabled={loading}
        />
        {errors.tipo && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.tipo.message}
          </p>
        )}
      </div>
    </FormModal>
  )
}

