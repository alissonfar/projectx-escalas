import { z } from 'zod'

/**
 * Schema de validação para Período de Escala
 */
export const escalaPeriodoSchema = z.object({
  escala_id: z.string().uuid('ID da escala inválido'),
  mes: z.number().int().min(1, 'Mês deve ser entre 1 e 12').max(12, 'Mês deve ser entre 1 e 12'),
  ano: z.number().int().min(2020, 'Ano inválido').max(2100, 'Ano inválido'),
  versao: z.number().int().min(1).default(1),
  estado: z.enum(['pre_escala', 'publicada']).default('pre_escala'),
})

export type EscalaPeriodoFormData = z.infer<typeof escalaPeriodoSchema>

/**
 * Schema completo incluindo validações assíncronas
 */
export const escalaPeriodoSchemaCompleto = escalaPeriodoSchema





