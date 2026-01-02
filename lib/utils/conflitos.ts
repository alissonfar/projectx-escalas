import { Escala } from '@/types/database'

/**
 * Verifica se há conflito de horário entre escalas
 * Retorna true se há sobreposição de horários
 */
// Função removida temporariamente: propriedades profissional_id, data_inicio, data_fim, status
// não existem mais no tipo Escala após refatoração do modelo.
// Verificação de conflitos agora deve ser feita através de EscalaAlocacao
export function verificarConflitoEscala(
  novaEscala: { data_inicio: string; data_fim: string; profissional_id: string },
  escalasExistentes: Escala[]
): Escala | null {
  // Implementação removida: modelo refatorado
  return null
}



