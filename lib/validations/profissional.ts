import { z } from 'zod'

export const profissionalSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().nullable().optional(),
  grupo_id: z.string().uuid('Grupo é obrigatório'),
})

export type ProfissionalFormData = z.infer<typeof profissionalSchema>

