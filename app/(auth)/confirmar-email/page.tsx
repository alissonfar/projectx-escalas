'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { EmailConfirmationCard } from '@/components/auth/email-confirmation-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

function ConfirmarEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Verificar se email já foi confirmado
  useEffect(() => {
    const checkEmailVerification = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        setIsVerified(true)
        // Redirecionar após 2 segundos
        setTimeout(() => {
          router.push('/selecionar-organizacao?novo=true&confirmado=true')
        }, 2000)
      }
    }

    if (email) {
      checkEmailVerification()
      // Verificar periodicamente (a cada 3 segundos)
      const interval = setInterval(checkEmailVerification, 3000)
      return () => clearInterval(interval)
    }
  }, [email, router])

  const handleResendEmail = async () => {
    if (!email) {
      throw new Error('Email não informado')
    }

    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('rate limit')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
      }
      throw new Error('Não foi possível reenviar o email. Tente novamente.')
    }
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Email confirmado!
            </h2>
            <p className="text-gray-600 mb-4">
              Sua conta foi ativada com sucesso. Redirecionando...
            </p>
            <LoadingSpinner size="md" />
          </div>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-slide-up">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Email não informado
            </h2>
            <p className="text-gray-600 mb-6">
              Não foi possível identificar o email para confirmação.
            </p>
            <Link
              href="/cadastro"
              className="inline-block px-6 py-3 bg-[#1E73BE] hover:bg-[#1557A0] text-white font-medium rounded-lg transition-colors"
            >
              Voltar para cadastro
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 shadow-lg">
            <svg 
              className="w-8 h-8 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            ESCALA FISIO
          </h1>
        </div>

        {/* Card de Confirmação */}
        <EmailConfirmationCard
          email={email}
          onResend={handleResendEmail}
          resendCooldown={60}
          className="animate-slide-up"
        />

        {/* Link para voltar */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-white/80 hover:text-white text-sm underline transition-colors"
          >
            Voltar para login
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          © 2025 EscalaFisio. Todos os direitos reservados.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  )
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE]">
        <LoadingSpinner size="lg" text="Carregando..." />
      </div>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  )
}

