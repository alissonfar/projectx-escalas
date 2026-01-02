/**
 * Configuração extensível de profissões
 * 
 * Cada profissão pode ter campos adicionais específicos.
 * A estrutura permite adicionar novas profissões sem modificar lógica existente.
 */

export type CampoProfissional = {
  id: string
  label: string
  placeholder?: string
  tipo: 'text' | 'number' | 'select'
  obrigatorio: boolean
  validacao?: (valor: string) => string | null // Retorna mensagem de erro ou null
  opcoes?: { value: string; label: string }[] // Para tipo 'select'
  mascara?: (valor: string) => string // Função de máscara
  ajuda?: string // Texto de ajuda
}

export type ConfiguracaoProfissao = {
  id: string
  nome: string
  campos: CampoProfissional[]
}

/**
 * Configurações de profissões disponíveis
 */
export const PROFISSOES: Record<string, ConfiguracaoProfissao> = {
  fisioterapeuta: {
    id: 'fisioterapeuta',
    nome: 'Fisioterapeuta',
    campos: [
      {
        id: 'crefito',
        label: 'Número do CREFITO',
        placeholder: 'Ex: 123456-F',
        tipo: 'text',
        obrigatorio: true,
        validacao: (valor) => {
          // Formato: 6 dígitos + hífen + letra (ex: 123456-F)
          const regex = /^\d{6}-[A-Z]$/i
          if (!regex.test(valor)) {
            return 'Formato inválido. Use: 123456-F (6 dígitos, hífen, 1 letra)'
          }
          return null
        },
        mascara: (valor) => {
          // Remove tudo que não é dígito ou letra
          const limpo = valor.replace(/[^\dA-Za-z]/g, '')
          // Limita a 6 dígitos + 1 letra
          if (limpo.length <= 6) {
            return limpo
          }
          // Formata: 123456-F
          return `${limpo.slice(0, 6)}-${limpo.slice(6, 7).toUpperCase()}`
        },
        ajuda: 'Digite o número do CREFITO no formato: 123456-F'
      },
      {
        id: 'uf_crefito',
        label: 'UF do CREFITO',
        placeholder: 'Selecione a UF',
        tipo: 'select',
        obrigatorio: true,
        opcoes: [
          { value: 'AC', label: 'Acre' },
          { value: 'AL', label: 'Alagoas' },
          { value: 'AP', label: 'Amapá' },
          { value: 'AM', label: 'Amazonas' },
          { value: 'BA', label: 'Bahia' },
          { value: 'CE', label: 'Ceará' },
          { value: 'DF', label: 'Distrito Federal' },
          { value: 'ES', label: 'Espírito Santo' },
          { value: 'GO', label: 'Goiás' },
          { value: 'MA', label: 'Maranhão' },
          { value: 'MT', label: 'Mato Grosso' },
          { value: 'MS', label: 'Mato Grosso do Sul' },
          { value: 'MG', label: 'Minas Gerais' },
          { value: 'PA', label: 'Pará' },
          { value: 'PB', label: 'Paraíba' },
          { value: 'PR', label: 'Paraná' },
          { value: 'PE', label: 'Pernambuco' },
          { value: 'PI', label: 'Piauí' },
          { value: 'RJ', label: 'Rio de Janeiro' },
          { value: 'RN', label: 'Rio Grande do Norte' },
          { value: 'RS', label: 'Rio Grande do Sul' },
          { value: 'RO', label: 'Rondônia' },
          { value: 'RR', label: 'Roraima' },
          { value: 'SC', label: 'Santa Catarina' },
          { value: 'SP', label: 'São Paulo' },
          { value: 'SE', label: 'Sergipe' },
          { value: 'TO', label: 'Tocantins' }
        ]
      }
    ]
  }
  // Futuras profissões podem ser adicionadas aqui:
  // enfermeiro: { ... },
  // medico: { ... },
  // etc.
}

/**
 * Obter configuração de uma profissão
 */
export function obterConfiguracaoProfissao(profissaoId: string): ConfiguracaoProfissao | null {
  return PROFISSOES[profissaoId] || null
}

/**
 * Obter lista de profissões para select
 */
export function obterProfissoesParaSelect(): { value: string; label: string }[] {
  return Object.values(PROFISSOES).map(prof => ({
    value: prof.id,
    label: prof.nome
  }))
}

/**
 * Obter campos adicionais de uma profissão
 */
export function obterCamposProfissao(profissaoId: string): CampoProfissional[] {
  const config = obterConfiguracaoProfissao(profissaoId)
  return config?.campos || []
}

