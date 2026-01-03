'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert } from "@/components/ui/alert"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export interface EmailConfirmationCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  email: string
  onResend?: () => Promise<void>
  resendCooldown?: number // em segundos
}

const EmailConfirmationCard = React.forwardRef<HTMLDivElement, EmailConfirmationCardProps>(
  ({ className, email, onResend, resendCooldown = 60, ...props }, ref) => {
    const [isResending, setIsResending] = React.useState(false)
    const [resendSuccess, setResendSuccess] = React.useState(false)
    const [resendError, setResendError] = React.useState<string | null>(null)
    const [cooldown, setCooldown] = React.useState(0)

    React.useEffect(() => {
      if (cooldown > 0) {
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
        return () => clearInterval(timer)
      }
    }, [cooldown])

    const handleResend = async () => {
      if (cooldown > 0 || isResending || !onResend) return

      setIsResending(true)
      setResendError(null)
      setResendSuccess(false)

      try {
        await onResend()
        setResendSuccess(true)
        setCooldown(resendCooldown)
      } catch (error) {
        setResendError(
          error instanceof Error
            ? error.message
            : "Não foi possível reenviar o email. Tente novamente."
        )
      } finally {
        setIsResending(false)
      }
    }

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }

    return (
      <Card
        ref={ref}
        className={cn("p-8", className)}
        {...props}
      >
        <div className="space-y-6">
          {/* Ícone e Título */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
              <svg
                className="w-10 h-10 text-[#1E73BE]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Verifique seu email
            </h2>
            <p className="text-gray-600">
              Enviamos um link de confirmação para
            </p>
            <p className="text-[#1E73BE] font-medium mt-1">{email}</p>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <p className="font-medium text-gray-800 mb-2">
              Siga estes passos:
            </p>
            <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Abra sua caixa de entrada</li>
              <li>Procure por um email de <strong>"Plantão Flow"</strong></li>
              <li>Clique no botão <strong>"Confirmar email"</strong> dentro do email</li>
              <li>Você será redirecionado automaticamente</li>
            </ol>
          </div>

          {/* Tempo esperado */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              ⏱️ O email pode levar até 2 minutos para chegar
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Verifique também sua pasta de spam ou lixo eletrônico
            </p>
          </div>

          {/* Mensagens de feedback */}
          {resendSuccess && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Email reenviado com sucesso! Verifique sua caixa de entrada.</span>
              </div>
            </Alert>
          )}

          {resendError && (
            <Alert className="bg-red-50 border-red-200 text-red-800">
              {resendError}
            </Alert>
          )}

          {/* Botão de reenvio */}
          {onResend && (
            <div className="space-y-2">
              <Button
                onClick={handleResend}
                disabled={isResending || cooldown > 0}
                variant="outline"
                className="w-full border-[#1E73BE] text-[#1E73BE] hover:bg-[#1E73BE]/5"
              >
                {isResending ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Reenviando...</span>
                  </div>
                ) : cooldown > 0 ? (
                  `Reenviar em ${formatTime(cooldown)}`
                ) : (
                  "Não recebeu o email? Reenviar"
                )}
              </Button>
              {cooldown > 0 && (
                <p className="text-xs text-center text-gray-500">
                  Aguarde antes de solicitar um novo envio
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }
)
EmailConfirmationCard.displayName = "EmailConfirmationCard"

export { EmailConfirmationCard }

