'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import type { Database } from '@/types/supabase'

type Organizacao = Database['public']['Tables']['organizacoes']['Row']

function SelecionarOrganizacaoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isNovo = searchParams.get('novo') === 'true'
  const confirmado = searchParams.get('confirmado') === 'true'

  const [organizacoes, setOrganizacoes] = useState<Organizacao[]>([])
  const [loading, setLoading] = useState(true)
  const [criandoOrg, setCriandoOrg] = useState(isNovo)
  const [nomeOrg, setNomeOrg] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [showConfirmacao, setShowConfirmacao] = useState(confirmado)

  const carregarOrganizacoes = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('organizacoes')
        .select('*')
        .eq('criado_por', user.id)
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (fetchError) {
        console.error('Erro ao carregar organizações:', fetchError)
        setError('Erro ao carregar organizações')
      } else {
        setOrganizacoes((data as Organizacao[]) || [])
      }
    } catch (err) {
      setError('Erro ao carregar organizações')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    carregarOrganizacoes()
  }, [carregarOrganizacoes])

  const criarOrganizacao = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nomeOrg.trim()) {
      setError('Por favor, informe o nome da organização')
      return
    }

    setSalvando(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Criar organização
      const { data: novaOrg, error: createError } = await supabase
        .from('organizacoes')
        .insert({
          nome: nomeOrg.trim(),
          criado_por: user.id,
          ativo: true,
        })
        .select()
        .single()

      if (createError) {
        setError('Erro ao criar organização')
        setSalvando(false)
        return
      }

      // Definir como organização ativa
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organizacao_ativa_id: (novaOrg as Organizacao).id })
        .eq('id', user.id)

      if (updateError) {
        setError('Erro ao definir organização ativa')
        setSalvando(false)
        return
      }

      // Sucesso - redirecionar para dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Erro ao criar organização')
      setSalvando(false)
    }
  }

  const selecionarOrganizacao = async (orgId: string) => {
    setSalvando(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Atualizar organização ativa
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ organizacao_ativa_id: orgId })
        .eq('id', user.id)

      if (updateError) {
        setError('Erro ao selecionar organização')
        setSalvando(false)
        return
      }

      // Sucesso - redirecionar para dashboard
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError('Erro ao selecionar organização')
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE]">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE] p-4">
      <div className="w-full max-w-2xl">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="w-[200px] sm:w-[220px] md:w-[250px]">
              <Logo variant="light" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {criandoOrg ? 'Criar Organização' : 'Selecionar Organização'}
          </h1>
          <p className="text-white/80 text-sm">
            {criandoOrg 
              ? 'Configure sua primeira organização para começar' 
              : 'Escolha a organização que deseja acessar'
            }
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          {showConfirmacao && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-medium mb-1">Email confirmado com sucesso! ✅</p>
                  <p className="text-sm text-green-700">
                    Sua conta está ativa. Agora você pode criar ou selecionar uma organização para começar.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmacao(false)}
                  className="text-green-600 hover:text-green-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 bg-red-50 border-red-200 text-red-800">
              {error}
            </Alert>
          )}

          {criandoOrg ? (
            // Formulário de criação
            <form onSubmit={criarOrganizacao} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nomeOrg" className="text-gray-700 font-medium">
                  Nome da Organização
                </Label>
                <Input
                  id="nomeOrg"
                  type="text"
                  value={nomeOrg}
                  onChange={(e) => setNomeOrg(e.target.value)}
                  placeholder="Ex: Hospital Central, Clínica São José..."
                  required
                  className="h-11 border-gray-300 focus:border-[#1E73BE] focus:ring-[#1E73BE]"
                  disabled={salvando}
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Este será o nome da sua organização no sistema
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#1E73BE] hover:bg-[#1557A0] text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={salvando}
              >
                {salvando ? 'Criando...' : 'Criar e Acessar'}
              </Button>

              {!isNovo && organizacoes.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setCriandoOrg(false)}
                  disabled={salvando}
                >
                  Voltar para seleção
                </Button>
              )}
            </form>
          ) : (
            // Lista de organizações
            <div className="space-y-4">
              {organizacoes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Você ainda não possui nenhuma organização
                  </p>
                  <Button
                    onClick={() => setCriandoOrg(true)}
                    className="bg-[#1E73BE] hover:bg-[#1557A0] text-white"
                  >
                    Criar Primeira Organização
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {organizacoes.map((org) => (
                      <Card
                        key={org.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-[#1E73BE]"
                        onClick={() => selecionarOrganizacao(org.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#1E73BE]/10 flex items-center justify-center">
                              <svg 
                                className="w-5 h-5 text-[#1E73BE]" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                                />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                {org.nome}
                              </h3>
                              <p className="text-xs text-gray-500">
                                Criada em {org.created_at ? new Date(org.created_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                              </p>
                            </div>
                          </div>
                          <svg 
                            className="w-5 h-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M9 5l7 7-7 7" 
                            />
                          </svg>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={() => setCriandoOrg(true)}
                    variant="outline"
                    className="w-full h-11 border-[#1E73BE] text-[#1E73BE] hover:bg-[#1E73BE]/5"
                  >
                    + Criar Nova Organização
                  </Button>
                </>
              )}
            </div>
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

export default function SelecionarOrganizacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E73BE] via-[#2589D4] to-[#1E73BE]">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    }>
      <SelecionarOrganizacaoContent />
    </Suspense>
  )
}



