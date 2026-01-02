import { z } from 'zod'
import { obterCamposProfissao } from '@/lib/config/profissoes'
import { validarTelefone, validarData } from '@/lib/utils/masks'

/**
 * Schema base para profissional
 */
const profissionalBaseSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo (máximo 200 caracteres)')
    .refine(
      (val) => val.trim().length >= 3,
      'Nome não pode conter apenas espaços'
    ),
  
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .max(255, 'Email muito longo'),
  
  telefone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .refine(
      (val) => validarTelefone(val),
      'Telefone inválido. Use o formato: (00) 00000-0000'
    ),
  
  telefone2: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.trim() === '' || validarTelefone(val),
      'Telefone 2 inválido. Use o formato: (00) 00000-0000'
    )
    .nullable(),
  
  data_nascimento: z
    .string()
    .min(1, 'Data de nascimento é obrigatória')
    .refine(
      (val) => {
        const validacao = validarData(val)
        return validacao.valida
      },
      (val) => {
        const validacao = validarData(val)
        return { message: validacao.mensagem || 'Data inválida' }
      }
    ),
  
  profissao: z
    .string()
    .min(1, 'Profissão é obrigatória'),
  
  grupo_id: z
    .string()
    .uuid('Grupo é obrigatório'),
})

/**
 * Schema padrão (usado quando profissão ainda não foi selecionada)
 */
export const profissionalSchema = profissionalBaseSchema.passthrough()

/**
 * Função para criar schema dinâmico baseado na profissão
 */
export function criarSchemaProfissional(profissaoId: string) {
  const camposProfissao = obterCamposProfissao(profissaoId)
  const camposExtras: Record<string, z.ZodTypeAny> = {}
  
  camposProfissao.forEach((campo) => {
    if (campo.obrigatorio) {
      camposExtras[campo.id] = z.string().min(1, `${campo.label} é obrigatório`)
    } else {
      camposExtras[campo.id] = z.string().optional().nullable()
    }
    
    // Aplicar validação customizada se existir
    if (campo.validacao) {
      const campoAtual = camposExtras[campo.id]
      camposExtras[campo.id] = campoAtual.refine(
        (val) => {
          if (!val || val.trim() === '') {
            return !campo.obrigatorio // Se não é obrigatório, vazio é válido
          }
          const erro = campo.validacao!(val)
          return erro === null
        },
        (val) => {
          if (!val || val.trim() === '') {
            return { message: `${campo.label} é obrigatório` }
          }
          const erro = campo.validacao!(val)
          return { message: erro || 'Valor inválido' }
        }
      )
    }
  })
  
  return profissionalBaseSchema.extend(camposExtras)
}

export type ProfissionalFormData = z.infer<typeof profissionalSchema> & {
  crefito?: string
  uf_crefito?: string
}



