import { z } from 'zod'

export const setorSchema = z.object({
  nome: z.string().min(1, 'Nome do setor é obrigatório'),
  hospital_id: z.string().uuid('Hospital é obrigatório'),
})

export type SetorFormData = z.infer<typeof setorSchema>




