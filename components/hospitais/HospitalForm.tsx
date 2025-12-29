'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { hospitalSchema, type HospitalFormData } from '@/lib/validations/hospital'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormModal } from '@/components/crud/FormModal'

interface HospitalFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: HospitalFormData) => Promise<void>
  initialData?: HospitalFormData
  loading?: boolean
}

export function HospitalForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: HospitalFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<HospitalFormData>({
    resolver: zodResolver(hospitalSchema),
    defaultValues: initialData || {
      nome: '',
      organizacao_id: '' // Será preenchido automaticamente no servidor
    }
  })

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
      title={initialData ? 'Editar Hospital' : 'Novo Hospital'}
      onSubmit={handleFormSubmit}
      submitLabel={initialData ? 'Atualizar' : 'Criar'}
      loading={loading}
    >
      <div>
        <Label htmlFor="nome" className="required">
          Nome do Hospital
        </Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: Hospital Central"
          className={errors.nome ? 'border-red-500' : ''}
          disabled={loading}
        />
        {errors.nome && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.nome.message}
          </p>
        )}
      </div>
    </FormModal>
  )
}

