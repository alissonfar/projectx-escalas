'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError('Email ou senha incorretos')
        setLoading(false)
        return
      }

      // Verificar se usuário tem organização ativa
      const { data: profile } = await supabase
        .from('profiles')
        .select('organizacao_ativa_id')
        .eq('id', data.user.id)
        .single()

      if (!(profile as any)?.organizacao_ativa_id) {
        // Redirecionar para seleção de organização
        router.push('/selecionar-organizacao')
      } else {
        // Ir direto para dashboard
        router.push('/dashboard')
      }
      
      router.refresh()
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.')
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
              {error}
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
              {loading ? 'Entrando...' : 'Entrar'}
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

