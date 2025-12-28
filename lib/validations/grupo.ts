import { z } from 'zod'

export const grupoSchema = z.object({
  nome: z.string().min(1, 'Nome do grupo é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  organizacao_id: z.string().uuid('Organização é obrigatória'),
})

export type GrupoFormData = z.infer<typeof grupoSchema>

