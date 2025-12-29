'use client'

import { getDay } from 'date-fns'

interface ScaleHeaderProps {
  mes: number
  ano: number
  dias: number[]
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ScaleHeader({ mes, ano, dias }: ScaleHeaderProps) {
  const numeroDias = dias.length
  
  // Obter dia da semana para cada dia do mês
  const obterDiaSemana = (dia: number) => {
    const data = new Date(ano, mes - 1, dia)
    return getDay(data)
  }
  
  return (
    <div 
      className="grid border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10"
      style={{
        gridTemplateColumns: `200px repeat(${numeroDias}, minmax(${numeroDias <= 7 ? '140px' : '80px'}, 1fr))`
      }}
    >
      {/* Coluna fixa de "Setor" */}
      <div className="border-r border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-900 dark:text-white">
        Setor
      </div>
      
      {/* Colunas de dias (sem scroll horizontal) */}
      {dias.map((dia) => {
        const diaSemana = obterDiaSemana(dia)
        const ehFimDeSemana = diaSemana === 0 || diaSemana === 6
        
        return (
          <div
            key={dia}
            className={`
              p-2 border-r border-gray-200 dark:border-gray-700 text-center min-w-0
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
  )
}


