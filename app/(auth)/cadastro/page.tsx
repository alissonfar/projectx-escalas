'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export default function CadastroPage() {
  const router = useRouter()
  const [nomeCompleto, setNomeCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validações
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    if (!nomeCompleto.trim()) {
      setError('Por favor, informe seu nome completo')
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
          data: {
            nome_completo: nomeCompleto.trim(),
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Este email já está cadastrado')
        } else {
          setError('Erro ao criar conta. Tente novamente.')
        }
        setLoading(false)
        return
      }

      // Sucesso - redirecionar para criar organização
      router.push('/selecionar-organizacao?novo=true')
      router.refresh()
    } catch (err) {
      setError('Erro ao criar conta. Tente novamente.')
      setLoading(false)
    }
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
            PEGA PLANTÃO
          </h1>
          <p className="text-white/80 text-sm">
            Crie sua conta gratuitamente
          </p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Criar nova conta
          </h2>

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              {error}
            </Alert>
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
              {loading ? 'Criando conta...' : 'Criar conta'}
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
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-xs mt-6">
          © 2025 Pega Plantão. Todos os direitos reservados.
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

