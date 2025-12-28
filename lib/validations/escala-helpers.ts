import { z } from 'zod'
import { escalaSchemaCompleto } from './escala'
import { EscalaFormData } from './escala'

/**
 * Valida dados de escala usando o schema completo com validação assíncrona
 * 
 * Esta função garante que a validação assíncrona seja executada corretamente.
 * Use esta função para validação completa antes de salvar no banco.
 * 
 * Para validação em formulários (React Hook Form), use o schema síncrono:
 * - Use `escalaSchema` com `zodResolver` no formulário
 * - Chame esta função no `onSubmit` antes de salvar
 * 
 * @param data - Dados a serem validados
 * @returns Promise com os dados validados
 * @throws {ZodError} Se a validação falhar
 * 
 * @example
 * ```typescript
 * // No onSubmit do formulário
 * const onSubmit = async (data: EscalaFormData) => {
 *   try {
 *     // Validação completa (incluindo organização)
 *     const dadosValidados = await validarEscala(data)
 *     // Dados são válidos, pode salvar no banco
 *     await salvarEscala(dadosValidados)
 *   } catch (error) {
 *     // Tratar erros de validação
 *     if (error instanceof z.ZodError) {
 *       // Mostrar erros ao usuário
 *     }
 *   }
 * }
 * ```
 */
export async function validarEscala(data: unknown): Promise<EscalaFormData> {
  return await escalaSchemaCompleto.parseAsync(data)
}

