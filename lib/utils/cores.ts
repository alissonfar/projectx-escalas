/**
 * Gera cores únicas para profissionais no calendário
 */

const CORES_PALETA = [
  '#3B82F6', // azul
  '#10B981', // verde
  '#F59E0B', // amarelo
  '#EF4444', // vermelho
  '#8B5CF6', // roxo
  '#EC4899', // rosa
  '#06B6D4', // ciano
  '#84CC16', // lima
  '#F97316', // laranja
  '#6366F1', // índigo
]

const coresAtribuidas = new Map<string, string>()

export function getCorProfissional(profissionalId: string): string {
  if (coresAtribuidas.has(profissionalId)) {
    return coresAtribuidas.get(profissionalId)!
  }

  // Atribuir próxima cor disponível
  const indice = coresAtribuidas.size % CORES_PALETA.length
  const cor = CORES_PALETA[indice]
  coresAtribuidas.set(profissionalId, cor)
  
  return cor
}

export function resetCores() {
  coresAtribuidas.clear()
}




