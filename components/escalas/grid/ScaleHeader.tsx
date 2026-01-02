'use client'

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

interface ScaleHeaderProps {
  mes: number
  ano: number
  semanas: (number | null)[][]
  mostrarColunaSetor?: boolean
  modoCompacto?: boolean
}

export function ScaleHeader({ mes, ano, semanas, mostrarColunaSetor = true, modoCompacto = false }: ScaleHeaderProps) {
  return (
    <div 
      className={`
        grid border-b-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900 sticky top-0 z-10
        ${modoCompacto ? 'border-b' : 'border-b-2'}
      `}
      style={{
        gridTemplateColumns: mostrarColunaSetor ? '200px repeat(7, 1fr)' : 'repeat(7, 1fr)'
      }}
    >
      {/* Coluna fixa de "Setor" - apenas se solicitado */}
      {mostrarColunaSetor && (
        <div className={`
          border-r-2 border-gray-300 dark:border-gray-600 font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800
          ${modoCompacto ? 'p-1.5 text-sm' : 'p-2 text-base'}
        `}>
          Setor
        </div>
      )}
      
      {/* Header fixo com dias da semana (Dom-Sáb) */}
      {DIAS_SEMANA.map((diaSemana, index) => {
        const ehFimDeSemana = index === 0 || index === 6
        const ehUltimaColuna = index === DIAS_SEMANA.length - 1
        
        return (
          <div
            key={index}
            className={`
              border-r-2 border-gray-300 dark:border-gray-600 text-center min-w-0
              ${ehUltimaColuna ? 'border-r-0' : ''}
              ${ehFimDeSemana ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-900'}
              ${modoCompacto ? 'p-1.5' : 'p-2'}
            `}
          >
            <div className={`
              font-bold
              ${modoCompacto ? 'text-sm' : 'text-base'}
              ${ehFimDeSemana ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}
            `}>
              {diaSemana}
            </div>
          </div>
        )
      })}
    </div>
  )
}


