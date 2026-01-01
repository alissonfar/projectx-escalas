import { getDaysInMonth } from 'date-fns'

export type VisualizacaoModo = 'mensal' | 'semanal'

/**
 * Obter semanas do mês
 * Retorna array de arrays com os dias de cada semana
 */
export function getWeeksInMonth(mes: number, ano: number): number[][] {
  const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
  const semanas: number[][] = []
  let semanaAtual: number[] = []
  
  for (let dia = 1; dia <= numeroDias; dia++) {
    const data = new Date(ano, mes - 1, dia)
    const diaSemana = data.getDay() // 0-6 (Dom-Sáb)
    
    semanaAtual.push(dia)
    
    // Se é sábado ou último dia do mês, fecha semana
    if (diaSemana === 6 || dia === numeroDias) {
      semanas.push([...semanaAtual])
      semanaAtual = []
    }
  }
  
  return semanas
}

/**
 * Obter dias para visualização conforme modo
 */
export function getDaysForVisualization(
  modo: VisualizacaoModo,
  mes: number,
  ano: number,
  semana?: number
): number[] {
  if (modo === 'mensal') {
    const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
    return Array.from({ length: numeroDias }, (_, i) => i + 1)
  }
  
  // Modo semanal
  const semanas = getWeeksInMonth(mes, ano)
  const indice = (semana || 1) - 1
  return semanas[indice] || []
}




