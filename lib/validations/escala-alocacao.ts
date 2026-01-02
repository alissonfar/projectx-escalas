import { z } from 'zod'

/**
 * Schema de validação para Alocação de Profissional em Escala
 */
export const escalaAlocacaoSchema = z.object({
  periodo_id: z.string().uuid('ID do período inválido'),
  profissional_id: z.string().uuid('Profissional é obrigatório'),
  data_inicio: z.string().datetime('Data/hora de início inválida'),
  data_fim: z.string().datetime('Data/hora de fim inválida'),
  // Turno é opcional: aceita string vazia como null/undefined
  turno: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : val),
    z.enum(['manha', 'tarde', 'noite', 'integral']).nullable().optional()
  ),
  observacoes: z.string().nullable().optional(),
}).refine(
  (data) => {
    const inicio = new Date(data.data_inicio)
    const fim = new Date(data.data_fim)
    return fim > inicio
  },
  {
    message: 'Data/hora de fim deve ser posterior à data/hora de início',
    path: ['data_fim']
  }
)

export type EscalaAlocacaoFormData = z.infer<typeof escalaAlocacaoSchema>

/**
 * Schema completo incluindo validações assíncronas
 */
export const escalaAlocacaoSchemaCompleto = escalaAlocacaoSchema




