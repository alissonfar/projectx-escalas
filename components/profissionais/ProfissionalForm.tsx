'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profissionalSchema, type ProfissionalFormData } from '@/lib/validations/profissional'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { FormModal } from '@/components/crud/FormModal'
import { useState, useEffect } from 'react'
import { buscarGruposParaSelect } from '@/lib/actions/profissionais'

interface ProfissionalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ProfissionalFormData) => Promise<void>
  initialData?: ProfissionalFormData
  loading?: boolean
}

export function ProfissionalForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: ProfissionalFormProps) {
  const [grupoOptions, setGrupoOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (open) {
      buscarGruposParaSelect().then(setGrupoOptions)
    }
  }, [open])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<ProfissionalFormData>({
    resolver: zodResolver(profissionalSchema),
    defaultValues: initialData || {
      nome: '',
      email: '',
      telefone: '',
      grupo_id: ''
    }
  })

  const grupoId = watch('grupo_id')

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (!initialData) {
      reset()
    }
  })

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Profissional' : 'Novo Profissional'}
      onSubmit={handleFormSubmit}
      submitLabel={initialData ? 'Atualizar' : 'Criar'}
      loading={loading}
      size="lg"
    >
      <div>
        <Label htmlFor="nome" className="required">
          Nome Completo
        </Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: João Silva"
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
        <Label htmlFor="email" className="required">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="joao@exemplo.com"
          className={errors.email ? 'border-red-500' : ''}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="telefone">
          Telefone
        </Label>
        <Input
          id="telefone"
          type="tel"
          {...register('telefone')}
          placeholder="(00) 00000-0000"
          className={errors.telefone ? 'border-red-500' : ''}
          disabled={loading}
        />
        {errors.telefone && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.telefone.message}
          </p>
        )}
      </div>

      <div>
        <Select
          label="Grupo"
          required
          options={grupoOptions}
          value={grupoId || ''}
          onChange={(value) => setValue('grupo_id', value)}
          error={errors.grupo_id?.message}
          disabled={loading}
        />
      </div>
    </FormModal>
  )
}



