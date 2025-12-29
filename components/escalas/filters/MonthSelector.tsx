'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Button } from '@/components/ui/button'

interface MonthSelectorProps {
  mes: number
  ano: number
  onChange: (mes: number, ano: number) => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function MonthSelector({ mes, ano, onChange }: MonthSelectorProps) {
  const handlePrevMonth = () => {
    if (mes === 1) {
      onChange(12, ano - 1)
    } else {
      onChange(mes - 1, ano)
    }
  }
  
  const handleNextMonth = () => {
    if (mes === 12) {
      onChange(1, ano + 1)
    } else {
      onChange(mes + 1, ano)
    }
  }
  
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevMonth}
        title="Mês anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </Button>
      
      <div className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
        {MESES[mes - 1]} {ano}
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleNextMonth}
        title="Próximo mês"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  )
}


