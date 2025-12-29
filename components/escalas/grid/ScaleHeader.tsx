'use client'

import { format, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ScaleHeaderProps {
  mes: number
  ano: number
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ScaleHeader({ mes, ano }: ScaleHeaderProps) {
  const numeroDias = getDaysInMonth(new Date(ano, mes - 1))
  const dias = Array.from({ length: numeroDias }, (_, i) => i + 1)
  
  // Obter dia da semana para cada dia do mês
  const obterDiaSemana = (dia: number) => {
    const data = new Date(ano, mes - 1, dia)
    return getDay(data)
  }
  
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
      {/* Coluna fixa de setores */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-900 dark:text-white">
        Setor
      </div>
      
      {/* Colunas de dias */}
      <div className="flex-1 flex overflow-x-auto">
        {dias.map((dia) => {
          const diaSemana = obterDiaSemana(dia)
          const ehFimDeSemana = diaSemana === 0 || diaSemana === 6
          
          return (
            <div
              key={dia}
              className={`
                min-w-[120px] flex-shrink-0 p-2 border-r border-gray-200 dark:border-gray-700 text-center
                ${ehFimDeSemana ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
              `}
            >
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {dia.toString().padStart(2, '0')}
              </div>
              <div className={`text-xs ${ehFimDeSemana ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                {DIAS_SEMANA[diaSemana]}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


