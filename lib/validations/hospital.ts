import { z } from 'zod'

export const hospitalSchema = z.object({
  nome: z.string().min(1, 'Nome do hospital é obrigatório'),
  organizacao_id: z.string().uuid('Organização é obrigatória'),
})

export type HospitalFormData = z.infer<typeof hospitalSchema>

