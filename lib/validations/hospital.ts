import { z } from 'zod'

export const hospitalSchema = z.object({
  nome: z.string().min(1, 'Nome do hospital é obrigatório'),
  // organizacao_id é preenchido automaticamente no servidor, então é opcional no frontend
  organizacao_id: z.union([z.string(), z.literal('')]).optional(),
})

export type HospitalFormData = z.infer<typeof hospitalSchema>

