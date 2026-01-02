/**
 * Utilitários para manipulação de datas com timezone de Brasília (America/Sao_Paulo)
 * 
 * Padrão da aplicação: Todas as datas devem ser tratadas como horário de Brasília
 */

/**
 * Converte uma string datetime-local (formato YYYY-MM-DDTHH:mm) para ISO 8601
 * assumindo que o horário está em timezone de Brasília (America/Sao_Paulo)
 * 
 * @param datetimeLocal - String no formato YYYY-MM-DDTHH:mm (sem timezone)
 * @returns String ISO 8601 com timezone de Brasília (ex: 2024-01-15T08:00:00-03:00)
 */
export function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal || !datetimeLocal.trim()) {
    throw new Error('Data/hora não fornecida')
  }

  // Parse da string datetime-local (YYYY-MM-DDTHH:mm)
  // Assumimos que está em horário de Brasília
  const [datePart, timePart] = datetimeLocal.trim().split('T')
  if (!datePart || !timePart) {
    throw new Error('Formato de data/hora inválido. Esperado: YYYY-MM-DDTHH:mm')
  }

  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)

  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
    throw new Error('Data/hora contém valores inválidos')
  }

  // Validar valores
  if (month < 1 || month > 12) {
    throw new Error('Mês inválido (deve ser entre 1 e 12)')
  }
  if (day < 1 || day > 31) {
    throw new Error('Dia inválido')
  }
  if (hours < 0 || hours > 23) {
    throw new Error('Hora inválida (deve ser entre 0 e 23)')
  }
  if (minutes < 0 || minutes > 59) {
    throw new Error('Minutos inválidos (devem ser entre 0 e 59)')
  }

  // Criar data assumindo que está em horário de Brasília (UTC-3)
  // Precisamos converter para UTC para o zod aceitar (formato com Z)
  // Mas mantendo o horário visual correto
  
  // Criar string ISO com offset de Brasília primeiro
  const isoStringBrasilia = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-03:00`
  
  // Criar objeto Date (isso converte automaticamente para UTC internamente)
  const date = new Date(isoStringBrasilia)
  if (isNaN(date.getTime())) {
    throw new Error('Data/hora inválida')
  }

  // Converter para ISO string com Z (UTC) - formato aceito pelo zod
  // O horário será ajustado automaticamente: 08:00 em Brasília (UTC-3) = 11:00 UTC
  // Mas o PostgreSQL TIMESTAMPTZ vai armazenar corretamente e retornar em Brasília
  return date.toISOString()
}

/**
 * Converte uma string ISO 8601 para formato datetime-local (YYYY-MM-DDTHH:mm)
 * convertendo para horário de Brasília
 * 
 * @param isoString - String ISO 8601 (ex: 2024-01-15T08:00:00-03:00 ou 2024-01-15T08:00:00Z)
 * @returns String no formato YYYY-MM-DDTHH:mm para uso em input datetime-local
 */
export function isoToDateTimeLocal(isoString: string): string {
  if (!isoString || !isoString.trim()) {
    return ''
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    throw new Error('Data/hora ISO inválida')
  }

  // Converter para horário de Brasília usando Intl.DateTimeFormat
  // Isso garante que o horário seja exibido corretamente em Brasília
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const hours = parts.find(p => p.type === 'hour')?.value
  const minutes = parts.find(p => p.type === 'minute')?.value

  if (!year || !month || !day || !hours || !minutes) {
    throw new Error('Erro ao converter data para formato datetime-local')
  }

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Cria uma data em timezone de Brasília a partir de componentes
 * 
 * @param year - Ano
 * @param month - Mês (1-12)
 * @param day - Dia (1-31)
 * @param hours - Horas (0-23)
 * @param minutes - Minutos (0-59)
 * @returns String ISO 8601 com timezone de Brasília
 */
export function createBrasiliaDateTime(
  year: number,
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0
): string {
  // Criar data assumindo horário de Brasília (UTC-3)
  const isoStringBrasilia = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00-03:00`
  
  const date = new Date(isoStringBrasilia)
  if (isNaN(date.getTime())) {
    throw new Error('Data/hora inválida')
  }

  // Retornar em formato UTC (Z) para compatibilidade com zod
  return date.toISOString()
}

/**
 * Valida se uma string é um datetime ISO válido
 * 
 * @param datetime - String para validar
 * @returns true se válido, false caso contrário
 */
export function isValidISODatetime(datetime: string): boolean {
  if (!datetime) return false
  
  try {
    const date = new Date(datetime)
    return !isNaN(date.getTime()) && datetime.includes('T')
  } catch {
    return false
  }
}

/**
 * Formata uma data ISO para exibição em horário de Brasília
 * 
 * @param isoString - String ISO 8601
 * @param format - Formato desejado ('HH:mm' para hora, 'dd/MM/yyyy HH:mm' para completo, etc)
 * @returns String formatada em horário de Brasília
 */
export function formatBrasiliaDateTime(isoString: string, format: 'HH:mm' | 'dd/MM/yyyy HH:mm' | 'dd/MM/yyyy' = 'HH:mm'): string {
  if (!isoString) return ''
  
  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return ''
  }

  // Converter para horário de Brasília
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...(format === 'HH:mm' ? {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    } : format === 'dd/MM/yyyy' ? {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    } : {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  })

  return formatter.format(date)
}

