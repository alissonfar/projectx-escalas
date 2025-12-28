import { z } from 'zod'
import { verificarProfissionalSetorMesmaOrg } from '@/lib/supabase/queries'

export const escalaSchema = z.object({
  setor_id: z.string().uuid('Setor é obrigatório'),
  profissional_id: z.string().uuid('Profissional é obrigatório'),
  data_inicio: z.string().datetime('Data/hora de início inválida'),
  data_fim: z.string().datetime('Data/hora de fim inválida'),
  observacoes: z.string().nullable().optional(),
  status: z.enum(['confirmado', 'cancelado']).default('confirmado'),
}).refine((data) => {
  return new Date(data.data_fim) > new Date(data.data_inicio)
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['data_fim'],
}).superRefine(async (data, ctx) => {
  // Validação assíncrona: verificar se profissional e setor pertencem à mesma organização
  const resultado = await verificarProfissionalSetorMesmaOrg(
    data.profissional_id,
    data.setor_id
  )
  
  if (!resultado.valido) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: resultado.erro || 'Profissional e setor devem pertencer à mesma organização',
      path: ['profissional_id'],
    })
  }
})

export type EscalaFormData = z.infer<typeof escalaSchema>

