import { z } from 'zod'
import { TIPOS_GRUPO_PERMITIDOS } from '@/lib/constants'

export const grupoSchema = z.object({
  nome: z.string().min(1, 'Nome do grupo é obrigatório'),
  tipo: z.enum(TIPOS_GRUPO_PERMITIDOS, {
    errorMap: () => ({ message: 'Tipo inválido. Selecione um tipo válido.' })
  }),
  organizacao_id: z.string().uuid('Organização é obrigatória'),
})

export type GrupoFormData = z.infer<typeof grupoSchema>

