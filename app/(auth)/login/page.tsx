'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Logo } from '@/components/ui/logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'email_nao_confirmado' | 'credenciais_invalidas' | 'erro_generico' | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorType(null)
    setResendSuccess(false)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        // Verificar se o erro é por email não confirmado
        if (signInError.message.includes('email not confirmed') || 
            signInError.message.includes('Email not confirmed')) {
          setErrorType('email_nao_confirmado')
          setError('Por favor, confirme seu email antes de fazer login')
        } else if (signInError.message.includes('Invalid login credentials') ||
                   signInError.message.includes('invalid')) {
          setErrorType('credenciais_invalidas')
          setError('Email ou senha incorretos')
        } else {
          // Erro de rede ou outro erro
          setErrorType('erro_generico')
          setError('Erro ao fazer login. Verifique sua conexão e tente novamente.')
        }
        setLoading(false)
        return
      }

      // Verificar se email foi confirmado
      if (data.user && !data.user.email_confirmed_at) {
        setErrorType('email_nao_confirmado')
        setError('Por favor, confirme seu email antes de fazer login')
        setLoading(false)
        return
      }

      // VERIFICAÇÃO CRÍTICA: Aguardar sincronização da sessão
      // Verificar se a sessão foi realmente criada e persistida
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        setErrorType('erro_generico')
        setError('Erro ao criar sessão. Tente novamente.')
        setLoading(false)
        return
      }

      // Aguardar um tick para garantir que cookies foram sincronizados
      // Isso é importante para evitar race conditions com o middleware
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verificar se usuário tem organização ativa
      const { data: profile, error: profileError } = await supabase
        .from('profiles' as any)
        .select('organizacao_ativa_id')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Erro ao buscar perfil:', profileError)
        setErrorType('erro_generico')
        setError('Erro ao carregar dados do usuário. Tente novamente.')
        setLoading(false)
        return
      }

      // Usar window.location.href ao invés de router.push() para garantir
      // que a navegação aconteça com cookies sincronizados
      // O middleware vai lidar com a verificação de sessão
      if (!(profile as any)?.organizacao_ativa_id) {
        window.location.href = '/selecionar-organizacao'
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err) {
      console.error('Erro inesperado no login:', err)
      setErrorType('erro_generico')
      setError('Erro ao fazer login. Tente novamente.')
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Por favor, informe seu email primeiro')
      return
    }

    setResendingEmail(true)
    setResendSuccess(false)
    setError(null)

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (resendError) {
        if (resendError.message.includes('rate limit')) {
          setError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.')
        } else {
          setError('Não foi possível reenviar o email. Tente novamente.')
        }
      } else {
        setResendSuccess(true)
      }
    } catch (err) {
      setError('Erro ao reenviar email. Tente novamente.')
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px]">
              <Logo variant="dark" />
            </div>
          </div>
          <p className="text-white/80 text-sm">
            Sistema de Gerenciamento de Escalas
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Entrar na sua conta
          </h2>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium mb-1">{error}</p>
                  {errorType === 'email_nao_confirmado' && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-red-700">
                        Verifique sua caixa de entrada e pasta de spam.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendConfirmation}
                        disabled={resendingEmail}
                        className="w-full border-[#1E73BE] text-[#1E73BE] hover:bg-[#1E73BE]/5 text-sm"
                      >
                        {resendingEmail ? (
                          <div className="flex items-center gap-2">
                            <LoadingSpinner size="sm" />
                            <span>Reenviando...</span>
                          </div>
                        ) : (
                          'Reenviar email de confirmação'
                        )}
                      </Button>
                      <Link
                        href={`/confirmar-email?email=${encodeURIComponent(email)}`}
                        className="block text-center text-sm text-[#1E73BE] hover:underline"
                      >
                        Ir para página de confirmação →
                      </Link>
                    </div>
                  )}
                  {errorType === 'credenciais_invalidas' && (
                    <p className="text-sm text-red-700 mt-1">
                      Verifique se digitou corretamente. Se esqueceu sua senha, você pode{' '}
                      <Link href="#" className="text-[#1E73BE] hover:underline font-medium">
                        redefini-la
                      </Link>
                      .
                    </p>
                  )}
                </div>
              </div>
            </Alert>
          )}

          {resendSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
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

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className="h-11 border-gray-300 focus:border-[#1E73BE] focus:ring-[#1E73BE]"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11 border-gray-300 focus:border-[#1E73BE] focus:ring-[#1E73BE]"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#1E73BE] hover:bg-[#1557A0] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" variant="white" />
                  <span>Entrando...</span>
                </div>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link
                href="/cadastro"
                className="text-[#1E73BE] hover:text-[#1557A0] font-medium hover:underline transition-colors"
              >
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          © 2025 Plantão Flow. Todos os direitos reservados.
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

