import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { EscalaComRelacoes } from '@/lib/actions/escalas'

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
    escala.profissional?.nome || '',
    escala.setor?.nome || '',
    // Propriedades removidas temporariamente: data_inicio, data_fim, observacoes, status
    // não existem mais no tipo Escala após refatoração do modelo
  ])
  
  // Criar tabela
  autoTable(doc, {
    head: [['Profissional', 'Setor']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  })
  
  // Salvar PDF
  doc.save(`escalas-${new Date().toISOString().split('T')[0]}.pdf`)
}



