import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { EscalaComRelacoes } from '@/types/database'

export function exportEscalasToPDF(escalas: EscalaComRelacoes[], titulo: string = 'Escalas') {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(18)
  doc.text(titulo, 14, 22)
  
  // Data de geração
  doc.setFontSize(10)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30)
  
  // Preparar dados da tabela
  const tableData = escalas.map((escala) => [
    escala.profissional.nome,
    escala.setor.nome,
    new Date(escala.data_inicio).toLocaleString('pt-BR'),
    new Date(escala.data_fim).toLocaleString('pt-BR'),
    escala.observacoes || '-',
    escala.status,
  ])
  
  // Criar tabela
  autoTable(doc, {
    head: [['Profissional', 'Setor', 'Início', 'Fim', 'Observações', 'Status']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  })
  
  // Salvar PDF
  doc.save(`escalas-${new Date().toISOString().split('T')[0]}.pdf`)
}



