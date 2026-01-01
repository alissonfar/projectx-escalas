import { getDaysInMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'

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
 * Obter semanas do mês como matriz de calendário (7 colunas fixas)
 * Retorna array de semanas, cada semana com 7 elementos (null para dias fora do mês)
 * Garante que a primeira semana começa no domingo e a última termina no sábado
 */
export function getWeeksMatrix(mes: number, ano: number): (number | null)[][] {
  const primeiroDiaMes = startOfMonth(new Date(ano, mes - 1))
  const ultimoDiaMes = endOfMonth(new Date(ano, mes - 1))
  
  // Iniciar na semana que contém o primeiro dia do mês (domingo)
  const inicioSemana = startOfWeek(primeiroDiaMes, { weekStartsOn: 0 })
  // Terminar na semana que contém o último dia do mês (sábado)
  const fimSemana = endOfWeek(ultimoDiaMes, { weekStartsOn: 0 })
  
  // Obter todos os dias do intervalo (incluindo dias do mês anterior/posterior)
  const todosDias = eachDayOfInterval({ start: inicioSemana, end: fimSemana })
  
  // Agrupar em semanas de 7 dias
  const semanas: (number | null)[][] = []
  for (let i = 0; i < todosDias.length; i += 7) {
    const semana = todosDias.slice(i, i + 7).map(data => {
      // Se o dia pertence ao mês atual, retorna o número do dia, senão null
      if (data.getMonth() === mes - 1 && data.getFullYear() === ano) {
        return data.getDate()
      }
      return null
    })
    semanas.push(semana)
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




