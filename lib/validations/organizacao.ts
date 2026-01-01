import { z } from 'zod'

export const organizacaoSchema = z.object({
  nome: z.string().min(1, 'Nome da organização é obrigatório'),
})

export type OrganizacaoFormData = z.infer<typeof organizacaoSchema>



