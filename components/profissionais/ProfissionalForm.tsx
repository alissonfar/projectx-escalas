'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { criarSchemaProfissional, type ProfissionalFormData } from '@/lib/validations/profissional'
import { obterProfissoesParaSelect, obterCamposProfissao } from '@/lib/config/profissoes'
import { maskTelefone, maskData, dataFormatadaParaISO, dataISOParaFormatada } from '@/lib/utils/masks'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/crud/Select'
import { FormModal } from '@/components/crud/FormModal'
import { useState, useEffect, useMemo } from 'react'
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
  const profissaoOptions = obterProfissoesParaSelect()
  
  // Preparar dados iniciais
  const dadosIniciais = useMemo(() => {
    if (!initialData) {
      return {
        nome: '',
        email: '',
        telefone: '',
        telefone2: '',
        data_nascimento: '',
        profissao: '',
        grupo_id: ''
      }
    }
    
    return {
      ...initialData,
      data_nascimento: initialData.data_nascimento 
        ? dataISOParaFormatada(initialData.data_nascimento)
        : '',
      telefone2: initialData.telefone2 || ''
    }
  }, [initialData])

  const profissaoSelecionada = useMemo(() => {
    return dadosIniciais.profissao || ''
  }, [dadosIniciais.profissao])

  // Obter schema dinâmico baseado na profissão
  const schemaProfissional = useMemo(() => {
    if (profissaoSelecionada) {
      return criarSchemaProfissional(profissaoSelecionada)
    }
    return criarSchemaProfissional('fisioterapeuta') // Default para validação inicial
  }, [profissaoSelecionada])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
    control
  } = useForm<ProfissionalFormData>({
    resolver: zodResolver(schemaProfissional),
    defaultValues: dadosIniciais
  })

  const profissaoAtual = watch('profissao')
  const camposProfissao = useMemo(() => {
    return profissaoAtual ? obterCamposProfissao(profissaoAtual) : []
  }, [profissaoAtual])

  useEffect(() => {
    if (open) {
      buscarGruposParaSelect().then(setGrupoOptions)
      reset(dadosIniciais)
    }
  }, [open, dadosIniciais, reset])

  // Limpar campos da profissão anterior quando mudar profissão
  useEffect(() => {
    if (profissaoAtual && camposProfissao.length > 0) {
      camposProfissao.forEach(campo => {
        const valorAtual = watch(campo.id as keyof ProfissionalFormData)
        if (valorAtual && !initialData) {
          // Só limpa se não for edição
          setValue(campo.id as keyof ProfissionalFormData, '' as any)
        }
      })
    }
  }, [profissaoAtual, camposProfissao, setValue, watch, initialData])

  const handleFormSubmit = handleSubmit(async (data) => {
    // Converter data formatada para ISO (se não estiver já em ISO)
    let dataNascimentoISO = data.data_nascimento
    
    // Se a data está no formato brasileiro (DD/MM/AAAA), converter para ISO
    if (data.data_nascimento && data.data_nascimento.includes('/')) {
      dataNascimentoISO = dataFormatadaParaISO(data.data_nascimento) || data.data_nascimento
    }
    // Se já está em ISO (AAAA-MM-DD), manter como está
    
    const dataFormatada = {
      ...data,
      data_nascimento: dataNascimentoISO
    }
    
    await onSubmit(dataFormatada as ProfissionalFormData)
    if (!initialData) {
      reset()
    }
  })

  const grupoId = watch('grupo_id')

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
      <div className="space-y-4">
        {/* Nome Completo */}
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

        {/* Email */}
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

        {/* Telefone 1 */}
        <div>
          <Label htmlFor="telefone" className="required">
            Telefone 1
          </Label>
          <Controller
            name="telefone"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="telefone"
                  type="tel"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const valorMascarado = maskTelefone(e.target.value)
                    field.onChange(valorMascarado)
                  }}
                  placeholder="(00) 00000-0000"
                  className={errors.telefone ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.telefone.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {/* Telefone 2 (Opcional) */}
        <div>
          <Label htmlFor="telefone2">
            Telefone 2 <span className="text-gray-500 text-xs">(opcional)</span>
          </Label>
          <Controller
            name="telefone2"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="telefone2"
                  type="tel"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const valorMascarado = maskTelefone(e.target.value)
                    field.onChange(valorMascarado)
                  }}
                  placeholder="(00) 00000-0000"
                  className={errors.telefone2 ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.telefone2 && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.telefone2.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {/* Data de Nascimento */}
        <div>
          <Label htmlFor="data_nascimento" className="required">
            Data de Nascimento
          </Label>
          <Controller
            name="data_nascimento"
            control={control}
            render={({ field }) => (
              <>
                <Input
                  id="data_nascimento"
                  type="text"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const valorMascarado = maskData(e.target.value)
                    field.onChange(valorMascarado)
                  }}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  className={errors.data_nascimento ? 'border-red-500' : ''}
                  disabled={loading}
                />
                {errors.data_nascimento && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {errors.data_nascimento.message}
                  </p>
                )}
              </>
            )}
          />
        </div>

        {/* Profissão */}
        <div>
          <Select
            label="Profissão"
            required
            options={profissaoOptions}
            value={profissaoAtual || ''}
            onChange={(value) => setValue('profissao', value)}
            error={errors.profissao?.message}
            disabled={loading}
          />
        </div>

        {/* Campos dinâmicos baseados na profissão */}
        {profissaoAtual && camposProfissao.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Dados Profissionais
            </h3>
            <div className="space-y-4">
              {camposProfissao.map((campo) => {
                const campoId = campo.id as keyof ProfissionalFormData
                const valorAtual = watch(campoId)
                const erro = errors[campoId]

                if (campo.tipo === 'select') {
                  return (
                    <div key={campo.id}>
                      <Select
                        label={campo.label}
                        required={campo.obrigatorio}
                        options={campo.opcoes || []}
                        value={valorAtual as string || ''}
                        onChange={(value) => setValue(campoId, value as any)}
                        error={erro?.message}
                        disabled={loading}
                      />
                      {campo.ajuda && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {campo.ajuda}
                        </p>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={campo.id}>
                    <Label htmlFor={campo.id} className={campo.obrigatorio ? 'required' : ''}>
                      {campo.label}
                      {!campo.obrigatorio && (
                        <span className="text-gray-500 text-xs ml-1">(opcional)</span>
                      )}
                    </Label>
                    <Controller
                      name={campoId}
                      control={control}
                      render={({ field: controllerField }) => (
                        <>
                          <Input
                            id={campo.id}
                            type={campo.tipo}
                            {...controllerField}
                            value={controllerField.value as string || ''}
                            onChange={(e) => {
                              let valor = e.target.value
                              // Aplicar máscara se existir
                              if (campo.mascara) {
                                valor = campo.mascara(valor)
                              }
                              controllerField.onChange(valor)
                            }}
                            placeholder={campo.placeholder}
                            className={erro ? 'border-red-500' : ''}
                            disabled={loading}
                          />
                          {erro && (
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                              {erro.message}
                            </p>
                          )}
                          {campo.ajuda && !erro && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {campo.ajuda}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Grupo */}
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
      </div>
    </FormModal>
  )
}
