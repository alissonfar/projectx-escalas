'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { escalaSchema, type EscalaFormData } from '@/lib/validations/escala'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { DateTimePicker } from '@/components/crud/DateTimePicker'
import { FormModal } from '@/components/crud/FormModal'
import { Alert } from '@/components/ui/alert'
import { buscarSetoresParaSelect, buscarProfissionaisParaSelect, verificarConflitos } from '@/lib/actions/escalas'
import { format } from 'date-fns'
import type { Escala } from '@/types/database'

interface EscalaFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EscalaFormData) => Promise<void>
  initialData?: EscalaFormData & { id?: string }
  loading?: boolean
}

export function EscalaForm({
  open,
  onClose,
  onSubmit,
  initialData,
  loading = false
}: EscalaFormProps) {
  const [setorOptions, setSetorOptions] = useState<{ value: string; label: string }[]>([])
  const [profissionalOptions, setProfissionalOptions] = useState<{ value: string; label: string }[]>([])
  const [conflitos, setConflitos] = useState<Escala[]>([])
  const [verificandoConflitos, setVerificandoConflitos] = useState(false)

  useEffect(() => {
    if (open) {
      Promise.all([
        buscarSetoresParaSelect(),
        buscarProfissionaisParaSelect()
      ]).then(([setores, profissionais]) => {
        setSetorOptions(setores)
        setProfissionalOptions(profissionais)
      })
    }
  }, [open])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<EscalaFormData>({
    resolver: zodResolver(escalaSchema),
    defaultValues: initialData || {
      setor_id: '',
      profissional_id: '',
      data_inicio: '',
      data_fim: '',
      observacoes: '',
      status: 'confirmado'
    }
  })

  const setorId = watch('setor_id')
  const profissionalId = watch('profissional_id')
  const dataInicio = watch('data_inicio')
  const dataFim = watch('data_fim')

  // Verificar conflitos quando campos mudarem
  useEffect(() => {
    if (profissionalId && dataInicio && dataFim) {
      setVerificandoConflitos(true)
      verificarConflitos(profissionalId, dataInicio, dataFim, initialData?.id)
        .then(setConflitos)
        .finally(() => setVerificandoConflitos(false))
    } else {
      setConflitos([])
    }
  }, [profissionalId, dataInicio, dataFim, initialData?.id])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
    if (!initialData) {
      reset()
      setConflitos([])
    }
  })

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={initialData ? 'Editar Escala' : 'Nova Escala'}
      onSubmit={handleFormSubmit}
      submitLabel={initialData ? 'Atualizar' : 'Criar'}
      loading={loading}
      size="lg"
    >
      {/* Alerta de Conflitos */}
      {conflitos.length > 0 && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="space-y-2">
            <p className="font-semibold text-yellow-800 dark:text-yellow-400">
              ⚠️ Conflito de horário detectado
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Este profissional já possui {conflitos.length} escala(s) confirmada(s) no mesmo período:
            </p>
            <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              {conflitos.map((c) => (
                <li key={c.id}>
                  {format(new Date(c.data_inicio), "dd/MM/yyyy 'às' HH:mm")} até{' '}
                  {format(new Date(c.data_fim), "dd/MM/yyyy 'às' HH:mm")}
                </li>
              ))}
            </ul>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
              Você pode salvar mesmo assim se desejar.
            </p>
          </div>
        </Alert>
      )}

      <div>
        <Select
          label="Setor"
          required
          options={setorOptions}
          value={setorId || ''}
          onChange={(value) => setValue('setor_id', value)}
          error={errors.setor_id?.message}
          disabled={loading}
        />
      </div>

      <div>
        <Select
          label="Profissional"
          required
          options={profissionalOptions}
          value={profissionalId || ''}
          onChange={(value) => setValue('profissional_id', value)}
          error={errors.profissional_id?.message}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <DateTimePicker
            label="Data/Hora Início"
            required
            value={dataInicio ? new Date(dataInicio) : null}
            onChange={(date) => setValue('data_inicio', date ? date.toISOString() : '')}
            error={errors.data_inicio?.message}
            disabled={loading}
            showTime
          />
        </div>
        <div>
          <DateTimePicker
            label="Data/Hora Fim"
            required
            value={dataFim ? new Date(dataFim) : null}
            onChange={(date) => setValue('data_fim', date ? date.toISOString() : '')}
            error={errors.data_fim?.message}
            disabled={loading}
            showTime
            min={dataInicio ? new Date(dataInicio) : undefined}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          {...register('observacoes')}
          placeholder="Observações adicionais (opcional)"
          className="w-full min-h-[100px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50 resize-y"
          disabled={loading}
        />
        {errors.observacoes && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            {errors.observacoes.message}
          </p>
        )}
      </div>

      <div>
        <Select
          label="Status"
          required
          options={[
            { value: 'confirmado', label: 'Confirmado' },
            { value: 'cancelado', label: 'Cancelado' }
          ]}
          value={watch('status') || 'confirmado'}
          onChange={(value) => setValue('status', value as 'confirmado' | 'cancelado')}
          disabled={loading}
        />
      </div>
    </FormModal>
  )
}

