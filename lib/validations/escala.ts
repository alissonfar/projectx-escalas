import { z } from 'zod'
import { verificarProfissionalSetorMesmaOrg } from '@/lib/supabase/queries'

/**
 * Schema base de validação para escalas (síncrono)
 * 
 * Use este schema para React Hook Form ou validações síncronas.
 * Este schema NÃO inclui a validação assíncrona de organização.
 * 
 * Para validação completa (incluindo organização), use:
 * - {@link validarEscala} - Função helper com validação assíncrona completa
 * - {@link escalaSchemaCompleto} - Schema com validação assíncrona (requer parseAsync)
 * 
 * @example
 * // Para React Hook Form
 * const form = useForm({
 *   resolver: zodResolver(escalaSchema)
 * })
 */
export const escalaSchema = z.object({
  setor_id: z.string().uuid('Setor é obrigatório'),
  profissional_id: z.string().uuid('Profissional é obrigatório'),
  data_inicio: z.string().datetime('Data/hora de início inválida'),
  data_fim: z.string().datetime('Data/hora de fim inválida'),
  observacoes: z.string().nullable().optional(),
  status: z.enum(['rascunho', 'publicado', 'cancelado']).default('rascunho'),
  turno: z.enum(['manha', 'tarde', 'noite', 'integral']).nullable().optional(),
}).refine((data) => {
  return new Date(data.data_fim) > new Date(data.data_inicio)
}, {
  message: 'Data de fim deve ser posterior à data de início',
  path: ['data_fim'],
}).refine((data) => {
  const duracao = new Date(data.data_fim).getTime() - new Date(data.data_inicio).getTime()
  const horas = duracao / (1000 * 60 * 60)
  return horas >= 1 && horas <= 24
}, {
  message: 'Escala deve ter entre 1 e 24 horas de duração',
  path: ['data_fim'],
})

/**
 * Schema completo de validação para escalas (com validação assíncrona)
 * 
 * ⚠️ IMPORTANTE: Este schema contém validação assíncrona.
 * SEMPRE use .parseAsync() ao invés de .parse()
 * 
 * @example
 * // ✅ CORRETO
 * const dados = await escalaSchemaCompleto.parseAsync(formData)
 * 
 * @example
 * // ❌ ERRADO - Validação assíncrona será ignorada
 * const dados = escalaSchemaCompleto.parse(formData)
 * 
 * @see {@link validarEscala} - Função helper recomendada para validação
 */
export const escalaSchemaCompleto = escalaSchema.superRefine(async (data, ctx) => {
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

