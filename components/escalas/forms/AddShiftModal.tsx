'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { format, setHours, setMinutes, setSeconds } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { EscalaAlocacaoCompleta } from '@/types/database'
import { datetimeLocalToISO, isoToDateTimeLocal, createBrasiliaDateTime } from '@/lib/utils/datetime'

interface AddShiftModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: ShiftFormData) => Promise<void>
  onDelete?: () => Promise<void>
  profissionais: Array<{ value: string; label: string }>
  initialData?: {
    profissional_id?: string
    data_inicio?: string
    data_fim?: string
    turno?: string
    observacoes?: string
  }
  diaInicial?: number
  mesAno: { mes: number; ano: number }
  loading?: boolean
  editMode?: boolean
}

export interface ShiftFormData {
  profissional_id: string
  data_inicio: string
  data_fim: string
  turno?: string
  observacoes?: string
}

export function AddShiftModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  profissionais,
  initialData,
  diaInicial,
  mesAno,
  loading,
  editMode
}: AddShiftModalProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ShiftFormData>({
    defaultValues: initialData || {}
  })
  
  const [internalLoading, setInternalLoading] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)
  
  // Se não está editando e tem dia inicial, configurar datas padrão
  useEffect(() => {
    if (!editMode && diaInicial && mesAno && !initialData) {
      // Criar datas em horário de Brasília (8h e 16h)
      // Usar formato datetime-local diretamente (já está em Brasília)
      const inicioISO = createBrasiliaDateTime(mesAno.ano, mesAno.mes, diaInicial, 8, 0)
      const fimISO = createBrasiliaDateTime(mesAno.ano, mesAno.mes, diaInicial, 16, 0)
      
      // Converter ISO para datetime-local para exibição no input
      const inicioLocal = isoToDateTimeLocal(inicioISO)
      const fimLocal = isoToDateTimeLocal(fimISO)
      
      setValue('data_inicio', inicioLocal)
      setValue('data_fim', fimLocal)
    }
  }, [diaInicial, mesAno, editMode, initialData, setValue])
  
  // Preencher dados iniciais se estiver editando
  useEffect(() => {
    if (editMode && initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'data_inicio' || key === 'data_fim') {
            // Converter ISO para datetime-local (horário de Brasília)
            try {
              const datetimeLocal = isoToDateTimeLocal(value)
              setValue(key as any, datetimeLocal)
            } catch (error) {
              console.error(`Erro ao converter ${key}:`, error)
              // Fallback: tentar formatar diretamente
              setValue(key as any, format(new Date(value), "yyyy-MM-dd'T'HH:mm"))
            }
          } else {
            setValue(key as any, value)
          }
        }
      })
    }
  }, [editMode, initialData, setValue])
  
  const handleFormSubmit = async (data: ShiftFormData) => {
    setInternalLoading(true)
    setConversionError(null)
    
    try {
      // Converter datetime-local para ISO com timezone de Brasília
      // O input datetime-local retorna formato YYYY-MM-DDTHH:mm (sem timezone)
      // Precisamos converter para ISO 8601 com timezone de Brasília para o zod aceitar
      let dataConvertida: ShiftFormData
      
      try {
        // Validar que os campos não estão vazios
        if (!data.data_inicio || !data.data_fim) {
          throw new Error('Data/hora de início e fim são obrigatórias')
        }
        
        dataConvertida = {
          ...data,
          data_inicio: datetimeLocalToISO(data.data_inicio),
          data_fim: datetimeLocalToISO(data.data_fim),
          // ✅ Converter string vazia de turno para null (schema aceita null/undefined, mas não string vazia)
          turno: data.turno === '' || data.turno === undefined ? undefined : data.turno
        }
      } catch (conversionError: any) {
        // Se já estiver em formato ISO (pode acontecer em alguns casos), usar diretamente
        // Mas validar que é um formato ISO válido
        const isISOFormat = (str: string) => {
          return str.includes('T') && (str.includes('Z') || str.includes('+') || (str.match(/-/g) || []).length >= 3)
        }
        
        if (isISOFormat(data.data_inicio) && isISOFormat(data.data_fim)) {
          // Parece ser ISO, usar diretamente
          dataConvertida = data
        } else {
          // Erro real na conversão
          const errorMessage = conversionError.message || 'Formato de data/hora inválido. Por favor, verifique os campos.'
          setConversionError(errorMessage)
          return // Não enviar se houver erro de conversão
        }
      }
      
      await onSubmit(dataConvertida)
    } catch (error: any) {
      console.error('Erro ao processar formulário:', error)
      // O erro será tratado pelo componente pai através do estado de error
      // Mas também podemos exibir aqui se necessário
      setConversionError(error.message || 'Erro ao processar formulário')
    } finally {
      setInternalLoading(false)
    }
  }
  
  const handleDelete = async () => {
    if (!onDelete) return
    
    const confirmado = confirm('Tem certeza que deseja remover este plantão?')
    if (!confirmado) return
    
    setInternalLoading(true)
    try {
      await onDelete()
    } finally {
      setInternalLoading(false)
    }
  }
  
  const isLoading = loading || internalLoading
  
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  {editMode ? 'Editar Plantão' : 'Adicionar Plantão'}
                </Dialog.Title>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  {/* Erro de conversão */}
                  {conversionError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                      <p className="text-sm text-red-800 dark:text-red-400">{conversionError}</p>
                    </div>
                  )}
                  
                  {/* Profissional */}
                  <div>
                    <Label htmlFor="profissional_id">Profissional *</Label>
                    <select
                      id="profissional_id"
                      {...register('profissional_id', { required: 'Profissional é obrigatório' })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value="">Selecione um profissional</option>
                      {profissionais.map((prof) => (
                        <option key={prof.value} value={prof.value}>
                          {prof.label}
                        </option>
                      ))}
                    </select>
                    {errors.profissional_id && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.profissional_id.message}</p>
                    )}
                  </div>

                  {/* Data/Hora Início */}
                  <div>
                    <Label htmlFor="data_inicio">Data/Hora Início *</Label>
                    <Input
                      id="data_inicio"
                      type="datetime-local"
                      {...register('data_inicio', { required: 'Data/hora de início é obrigatória' })}
                      disabled={isLoading}
                    />
                    {errors.data_inicio && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data_inicio.message}</p>
                    )}
                  </div>

                  {/* Data/Hora Fim */}
                  <div>
                    <Label htmlFor="data_fim">Data/Hora Fim *</Label>
                    <Input
                      id="data_fim"
                      type="datetime-local"
                      {...register('data_fim', { required: 'Data/hora de fim é obrigatória' })}
                      disabled={isLoading}
                    />
                    {errors.data_fim && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.data_fim.message}</p>
                    )}
                  </div>

                  {/* Turno (opcional, será inferido se não fornecido) */}
                  <div>
                    <Label htmlFor="turno">Turno</Label>
                    <select
                      id="turno"
                      {...register('turno')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                    >
                      <option value="">Inferir automaticamente</option>
                      <option value="manha">Manhã</option>
                      <option value="tarde">Tarde</option>
                      <option value="noite">Noite</option>
                      <option value="integral">Integral</option>
                    </select>
                  </div>

                  {/* Observações */}
                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <textarea
                      id="observacoes"
                      {...register('observacoes')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={isLoading}
                      placeholder="Observações sobre o plantão..."
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
                    <div>
                      {editMode && onDelete && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDelete}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Salvando...' : editMode ? 'Salvar' : 'Adicionar'}
                      </Button>
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




