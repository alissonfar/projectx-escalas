'use client'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface ScaleHeaderProps {
  mes: number
  ano: number
  semanas: (number | null)[][]
}

export function ScaleHeader({ mes, ano, semanas }: ScaleHeaderProps) {
  return (
    <div 
      className="grid border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10"
      style={{
        gridTemplateColumns: '200px repeat(7, 1fr)'
      }}
    >
      {/* Coluna fixa de "Setor" */}
      <div className="border-r border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900">
        Setor
      </div>
      
      {/* Header fixo com dias da semana (Dom-Sáb) */}
      {DIAS_SEMANA.map((diaSemana, index) => {
        const ehFimDeSemana = index === 0 || index === 6
        const ehUltimaColuna = index === DIAS_SEMANA.length - 1
        
        return (
          <div
            key={index}
            className={`
              p-2 border-r border-gray-200 dark:border-gray-700 text-center min-w-0
              ${ehUltimaColuna ? 'border-r-0' : ''}
              ${ehFimDeSemana ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
            `}
          >
            <div className={`text-xs font-semibold ${ehFimDeSemana ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {diaSemana}
            </div>
          </div>
        )
      })}
    </div>
  )
}


