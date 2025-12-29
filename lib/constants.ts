/**
 * Constantes do sistema
 */

/**
 * Tipos de grupo permitidos
 * Usado para validação e seleção no formulário de grupos
 */
export const TIPOS_GRUPO_PERMITIDOS = [
  'Médico',
  'Enfermeiro',
  'Fisioterapeuta',
  'Técnico de Enfermagem',
  'Outro'
] as const

export type TipoGrupo = typeof TIPOS_GRUPO_PERMITIDOS[number]

/**
 * Status de escalas permitidos
 */
export const STATUS_ESCALA = {
  CONFIRMADO: 'confirmado',
  CANCELADO: 'cancelado'
} as const

export type StatusEscala = typeof STATUS_ESCALA[keyof typeof STATUS_ESCALA]

/**
 * Status de ativação de entidades
 */
export const STATUS_ATIVO = {
  ATIVO: true,
  INATIVO: false
} as const
