'use client'

import { useState, useEffect, Fragment } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, Transition } from '@headlessui/react'
import { escalaSchema, type EscalaFormData } from '@/lib/validations/escala'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { DateTimePicker } from '@/components/crud/DateTimePicker'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { buscarSetoresParaSelect, buscarProfissionaisParaSelect, verificarConflitos } from '@/lib/actions/escalas'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatBrasiliaDateTime } from '@/lib/utils/datetime'
import type { Escala } from '@/types/database'

interface EscalaFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: EscalaFormData) => Promise<void>
  onSalvarRascunho?: (data: EscalaFormData) => Promise<void>
  onPublicar?: (data: EscalaFormData) => Promise<void>
  initialData?: EscalaFormData & { id?: string; status?: 'rascunho' | 'publicado' | 'cancelado' }
  loading?: boolean
}

export function EscalaForm({
  open,
  onClose,
  onSubmit,
  onSalvarRascunho,
  onPublicar,
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
      status: 'rascunho'
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

  const handleSalvarRascunho = handleSubmit(async (data) => {
    if (onSalvarRascunho) {
      await onSalvarRascunho(data)
      if (!initialData) {
        reset()
        setConflitos([])
      }
    } else {
      // Fallback para onSubmit se onSalvarRascunho não for fornecido
      await onSubmit(data)
    }
  })

  const handlePublicar = handleSubmit(async (data) => {
    if (onPublicar) {
      await onPublicar(data)
      if (!initialData) {
        reset()
        setConflitos([])
      }
    } else {
      // Fallback para onSubmit se onPublicar não for fornecido
      await onSubmit(data)
    }
  })

  const isRascunho = initialData?.status === 'rascunho'
  const isPublicado = initialData?.status === 'publicado'
  const podePublicar = isRascunho || !initialData // Pode publicar se for rascunho ou nova escala

  return (
    <Transition show={open} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={(value) => {
          if (!loading && value) {
            onClose()
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all',
                  'max-w-2xl'
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <form 
                  onSubmit={(e) => {
                    e.stopPropagation()
                    const result = handleFormSubmit(e)
                    if (result instanceof Promise) {
                      result.catch((error) => {
                        console.error('Erro no onSubmit:', error)
                      })
                    }
                  }} 
                  noValidate
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {initialData ? 'Editar Escala' : 'Nova Escala'}
                    </Dialog.Title>
                    
                    <div className="space-y-4">
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
                  {formatBrasiliaDateTime(c.data_inicio, 'dd/MM/yyyy HH:mm').replace(' ', ' às ')} até{' '}
                  {formatBrasiliaDateTime(c.data_fim, 'dd/MM/yyyy HH:mm').replace(' ', ' às ')}
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

                      {/* Status não é editável no formulário - será gerenciado via ações de publicação */}
                      {/* Novas escalas começam como 'rascunho' por padrão */}
                      {isPublicado && (
                        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                          <p className="text-sm text-blue-800 dark:text-blue-400">
                            ℹ️ Esta escala está publicada. Para editá-la, você precisará despublicá-la primeiro.
                          </p>
                        </Alert>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                      {/* Botão Salvar Rascunho - sempre visível */}
                      {onSalvarRascunho && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSalvarRascunho}
                          disabled={loading || isPublicado}
                          className="min-w-[140px]"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Salvando...
                            </span>
                          ) : (
                            '💾 Salvar Rascunho'
                          )}
                        </Button>
                      )}
                      
                      {/* Botão Publicar - visível apenas para rascunhos ou novas escalas */}
                      {onPublicar && podePublicar && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={handlePublicar}
                          disabled={loading}
                          className="min-w-[140px] bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm hover:shadow-md transition-shadow"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Publicando...
                            </span>
                          ) : (
                            '📢 Publicar'
                          )}
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="min-w-[100px]"
                      >
                        Cancelar
                      </Button>
                      {/* Botão padrão de submit - usado quando não há callbacks específicos */}
                      {(!onSalvarRascunho && !onPublicar) && (
                        <Button
                          type="submit"
                          variant="default"
                          disabled={loading}
                          className="min-w-[100px] font-semibold shadow-sm hover:shadow-md transition-shadow"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Salvando...
                            </span>
                          ) : (
                            initialData ? 'Atualizar' : 'Criar'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

