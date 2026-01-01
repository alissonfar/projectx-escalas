'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { setorSchema, type SetorFormData } from '@/lib/validations/setor'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { FormModal } from '@/components/crud/FormModal'
import { useState, useEffect } from 'react'
import { buscarHospitaisParaSelect } from '@/lib/actions/setores'

interface SetorFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SetorFormData) => Promise<void>
  initialData?: SetorFormData
  loading?: boolean
}

export function SetorForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: SetorFormProps) {
  const [hospitalOptions, setHospitalOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (open) {
      buscarHospitaisParaSelect().then(setHospitalOptions)
    }
  }, [open])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<SetorFormData>({
    resolver: zodResolver(setorSchema),
    defaultValues: initialData || {
      nome: '',
      hospital_id: ''
    }
  })

  const hospitalId = watch('hospital_id')

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
      title={initialData ? 'Editar Setor' : 'Novo Setor'}
      onSubmit={handleFormSubmit}
      submitLabel={initialData ? 'Atualizar' : 'Criar'}
      loading={loading}
    >
      <div>
        <Label htmlFor="nome" className="required">
          Nome do Setor
        </Label>
        <Input
          id="nome"
          {...register('nome')}
          placeholder="Ex: UTI 1, Emergência"
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
          label="Hospital"
          required
          options={hospitalOptions}
          value={hospitalId || ''}
          onChange={(value) => setValue('hospital_id', value)}
          error={errors.hospital_id?.message}
          disabled={loading}
        />
      </div>
    </FormModal>
  )
}



