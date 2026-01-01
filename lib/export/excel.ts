import * as XLSX from 'xlsx'
import { EscalaComRelacoes } from '@/types/database'

export function exportEscalasToExcel(escalas: EscalaComRelacoes[], nomeArquivo: string = 'escalas') {
  // Preparar dados
  const dados = escalas.map((escala) => ({
    Profissional: escala.profissional.nome,
    Setor: escala.setor.nome,
    'Data/Hora Início': new Date(escala.data_inicio).toLocaleString('pt-BR'),
    'Data/Hora Fim': new Date(escala.data_fim).toLocaleString('pt-BR'),
    Observações: escala.observacoes || '',
    Status: escala.status,
  }))
  
  // Criar workbook
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(dados)
  
  // Ajustar largura das colunas
  const colWidths = [
    { wch: 25 }, // Profissional
    { wch: 20 }, // Setor
    { wch: 20 }, // Data/Hora Início
    { wch: 20 }, // Data/Hora Fim
    { wch: 30 }, // Observações
    { wch: 12 }, // Status
  ]
  ws['!cols'] = colWidths
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Escalas')
  
  // Salvar arquivo
  XLSX.writeFile(wb, `${nomeArquivo}-${new Date().toISOString().split('T')[0]}.xlsx`)
}



