/**
 * Utilitários de máscara para campos de formulário
 */

/**
 * Aplica máscara de telefone brasileiro: (00) 00000-0000 ou (00) 0000-0000
 */
export function maskTelefone(valor: string): string {
  // Remove tudo que não é dígito
  const limpo = valor.replace(/\D/g, '')
  
  // Limita a 11 dígitos (com DDD)
  const limitado = limpo.slice(0, 11)
  
  // Aplica máscara baseado no tamanho
  if (limitado.length <= 2) {
    return limitado ? `(${limitado}` : ''
  } else if (limitado.length <= 6) {
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2)}`
  } else if (limitado.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 6)}-${limitado.slice(6)}`
  } else {
    // Celular: (00) 00000-0000
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(7, 11)}`
  }
}

/**
 * Remove máscara de telefone, retornando apenas dígitos
 */
export function unmaskTelefone(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Valida formato de telefone brasileiro
 */
export function validarTelefone(telefone: string): boolean {
  const limpo = unmaskTelefone(telefone)
  // Aceita 10 ou 11 dígitos (fixo ou celular)
  return limpo.length === 10 || limpo.length === 11
}

/**
 * Aplica máscara de data: DD/MM/AAAA
 */
export function maskData(valor: string): string {
  // Remove tudo que não é dígito
  const limpo = valor.replace(/\D/g, '')
  
  // Limita a 8 dígitos
  const limitado = limpo.slice(0, 8)
  
  // Aplica máscara
  if (limitado.length <= 2) {
    return limitado
  } else if (limitado.length <= 4) {
    return `${limitado.slice(0, 2)}/${limitado.slice(2)}`
  } else {
    return `${limitado.slice(0, 2)}/${limitado.slice(2, 4)}/${limitado.slice(4, 8)}`
  }
}

/**
 * Remove máscara de data, retornando apenas dígitos
 */
export function unmaskData(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Converte data formatada (DD/MM/AAAA) para ISO (AAAA-MM-DD)
 */
export function dataFormatadaParaISO(dataFormatada: string): string | null {
  const limpo = unmaskData(dataFormatada)
  
  if (limpo.length !== 8) {
    return null
  }
  
  const dia = limpo.slice(0, 2)
  const mes = limpo.slice(2, 4)
  const ano = limpo.slice(4, 8)
  
  // Validação básica
  const diaNum = parseInt(dia, 10)
  const mesNum = parseInt(mes, 10)
  const anoNum = parseInt(ano, 10)
  
  if (diaNum < 1 || diaNum > 31 || mesNum < 1 || mesNum > 12 || anoNum < 1900) {
    return null
  }
  
  return `${ano}-${mes}-${dia}`
}

/**
 * Converte data ISO (AAAA-MM-DD) para formato brasileiro (DD/MM/AAAA)
 */
export function dataISOParaFormatada(dataISO: string): string {
  if (!dataISO) return ''
  
  const partes = dataISO.split('T')[0].split('-')
  if (partes.length !== 3) return ''
  
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

/**
 * Valida data nos formatos DD/MM/AAAA ou AAAA-MM-DD
 */
export function validarData(data: string): { valida: boolean; mensagem?: string } {
  if (!data || data.trim() === '') {
    return { valida: false, mensagem: 'Data é obrigatória' }
  }

  let dia: number, mes: number, ano: number

  // Detectar formato: ISO (AAAA-MM-DD) ou brasileiro (DD/MM/AAAA)
  // Formato ISO pode vir como AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss...
  if (data.includes('-') && !data.includes('/')) {
    // Formato ISO: AAAA-MM-DD ou AAAA-MM-DDTHH:mm:ss...
    const dataParte = data.split('T')[0] // Remove parte de hora se existir
    const partes = dataParte.split('-')
    if (partes.length !== 3) {
      return { valida: false, mensagem: 'Formato de data inválido' }
    }
    ano = parseInt(partes[0], 10)
    mes = parseInt(partes[1], 10)
    dia = parseInt(partes[2], 10)
  } else if (data.includes('/')) {
    // Formato brasileiro: DD/MM/AAAA
    const limpo = unmaskData(data)
    if (limpo.length !== 8) {
      return { valida: false, mensagem: 'Data incompleta' }
    }
    dia = parseInt(limpo.slice(0, 2), 10)
    mes = parseInt(limpo.slice(2, 4), 10)
    ano = parseInt(limpo.slice(4, 8), 10)
  } else {
    // Tentar como formato brasileiro sem barras
    const limpo = unmaskData(data)
    if (limpo.length !== 8) {
      return { valida: false, mensagem: 'Data incompleta' }
    }
    dia = parseInt(limpo.slice(0, 2), 10)
    mes = parseInt(limpo.slice(2, 4), 10)
    ano = parseInt(limpo.slice(4, 8), 10)
  }

  // Validação de ranges
  if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
    return { valida: false, mensagem: 'Data inválida' }
  }

  if (dia < 1 || dia > 31) {
    return { valida: false, mensagem: 'Dia inválido' }
  }

  if (mes < 1 || mes > 12) {
    return { valida: false, mensagem: 'Mês inválido' }
  }

  if (ano < 1900 || ano > new Date().getFullYear()) {
    return { valida: false, mensagem: 'Ano inválido' }
  }

  // Validação de data real (ex: 31/02 não existe)
  const dataObj = new Date(ano, mes - 1, dia)
  if (
    dataObj.getDate() !== dia ||
    dataObj.getMonth() !== mes - 1 ||
    dataObj.getFullYear() !== ano
  ) {
    return { valida: false, mensagem: 'Data inválida' }
  }

  // Não permitir datas futuras
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  if (dataObj > hoje) {
    return { valida: false, mensagem: 'Data não pode ser futura' }
  }

  return { valida: true }
}

