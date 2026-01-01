import { Escala } from '@/types/database'

/**
 * Verifica se há conflito de horário entre escalas
 * Retorna true se há sobreposição de horários
 */
export function verificarConflitoEscala(
  novaEscala: { data_inicio: string; data_fim: string; profissional_id: string },
  escalasExistentes: Escala[]
): Escala | null {
  const novaInicio = new Date(novaEscala.data_inicio)
  const novaFim = new Date(novaEscala.data_fim)

  return escalasExistentes.find((escala) => {
    // Só verifica escalas do mesmo profissional e que não estejam canceladas
    if (
      escala.profissional_id !== novaEscala.profissional_id ||
      escala.status === 'cancelado'
    ) {
      return false
    }

    const existenteInicio = new Date(escala.data_inicio)
    const existenteFim = new Date(escala.data_fim)

    // Verifica sobreposição: nova escala começa antes do fim da existente
    // e termina depois do início da existente
    return novaInicio < existenteFim && novaFim > existenteInicio
  }) || null
}



