'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { SuccessMessage } from '@/components/ui/success-message'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Logo } from '@/components/ui/logo'

type ErrorType = 
  | 'senhas_nao_coincidem'
  | 'senha_fraca'
  | 'nome_vazio'
  | 'email_existente'
  | 'erro_rede'
  | 'erro_generico'

export default function CadastroPage() {
  const router = useRouter()
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<ErrorType | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const getErrorMessage = (type: ErrorType): string => {
    switch (type) {
      case 'senhas_nao_coincidem':
        return 'As senhas não coincidem'
      case 'senha_fraca':
        return 'A senha deve ter no mínimo 6 caracteres'
      case 'nome_vazio':
        return 'Por favor, informe seu nome completo'
      case 'email_existente':
        return 'Este email já está cadastrado'
      case 'erro_rede':
        return 'Não foi possível conectar. Verifique sua internet e tente novamente'
      case 'erro_generico':
      default:
        return 'Algo deu errado. Por favor, tente novamente em alguns instantes'
    }
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setErrorType(null)
    setSuccess(false)

    // Validações
    if (password !== confirmPassword) {
      setErrorType('senhas_nao_coincidem')
      setError(getErrorMessage('senhas_nao_coincidem'))
      return
    }

    if (password.length < 6) {
      setErrorType('senha_fraca')
      setError(getErrorMessage('senha_fraca'))
      return
    }

    if (!nomeCompleto.trim()) {
      setErrorType('nome_vazio')
      setError(getErrorMessage('nome_vazio'))
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      
      // Criar usuário com metadados
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nome_completo: nomeCompleto.trim(),
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('already exists')) {
          setErrorType('email_existente')
          setError(getErrorMessage('email_existente'))
        } else if (signUpError.message.includes('network') || 
                   signUpError.message.includes('fetch')) {
          setErrorType('erro_rede')
          setError(getErrorMessage('erro_rede'))
        } else {
          setErrorType('erro_generico')
          setError(getErrorMessage('erro_generico'))
        }
        setLoading(false)
        return
      }

      // Sucesso - mostrar mensagem e redirecionar
      setSuccess(true)
      setLoading(false)
      
      // Redirecionar após 3 segundos para página de confirmação
      setTimeout(() => {
        router.push(`/confirmar-email?email=${encodeURIComponent(email)}`)
      }, 3000)
    } catch (err) {
      setErrorType('erro_generico')
      setError(getErrorMessage('erro_generico'))
      setLoading(false)
    }
  }

  const handleGoToLogin = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-[200px] sm:w-[220px] md:w-[250px]">
              <Logo variant="light" />
            </div>
          </div>
          <p className="text-white/80 text-sm">
            Crie sua conta gratuitamente
          </p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Criar nova conta
          </h2>

          {success ? (
            <SuccessMessage
              title="Conta criada com sucesso! ✅"
              description={`Enviamos um email de confirmação para ${email}. Por favor, verifique sua caixa de entrada e clique no link para ativar sua conta.`}
              actionLabel="Entendi, continuar"
              onAction={() => router.push(`/confirmar-email?email=${encodeURIComponent(email)}`)}
            />
          ) : (
            <>
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
                      {errorType === 'email_existente' && (
                        <div className="mt-2">
                          <Link
                            href="/login"
                            className="text-sm text-[#1E73BE] hover:underline font-medium"
                          >
                            Fazer login →
                          </Link>
                        </div>
                      )}
                      {errorType === 'senhas_nao_coincidem' && (
                        <p className="text-sm text-red-700 mt-1">
                          Verifique se as duas senhas são iguais.
                        </p>
                      )}
                    </div>
                  </div>
                </Alert>
              )}

              {loading && (
                <div className="mb-6 flex items-center justify-center gap-3 py-4">
                  <LoadingSpinner size="md" />
                  <span className="text-gray-600">Aguarde, estamos criando sua conta...</span>
                </div>
              )}

              <form onSubmit={handleCadastro} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nomeCompleto" className="text-gray-700 font-medium">
                Nome Completo
              </Label>
              <Input
                id="nomeCompleto"
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                placeholder="João Silva"
                required
                className="h-11 border-gray-300 focus:border-[#1E73BE] focus:ring-[#1E73BE]"
                disabled={loading}
              />
            </div>

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
                minLength={6}
                className="h-11 border-gray-300 focus:border-[#1E73BE] focus:ring-[#1E73BE]"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Mínimo de 6 caracteres</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                Confirmar Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                      <span>Criando sua conta...</span>
                    </div>
                  ) : (
                    'Criar conta'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Já tem uma conta?{' '}
                  <Link
                    href="/login"
                    className="text-[#1E73BE] hover:text-[#1557A0] font-medium hover:underline transition-colors"
                  >
                    Faça login
                  </Link>
                </p>
              </div>
            </>
          )}
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



