import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EscalasClient } from '@/components/escalas/EscalasClient'
import { buscarSetoresOrganizacao } from '@/lib/actions/escala-periodos'

export default async function EscalasPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('organizacao_ativa_id')
    .eq('id', user.id)
    .single()
  
  if (!profile?.organizacao_ativa_id) {
    redirect('/selecionar-organizacao')
  }

  // Buscar setores da organização
  const setores = await buscarSetoresOrganizacao()
  
  // Mês e ano atuais
  const hoje = new Date()
  const mesAtual = hoje.getMonth() + 1 // 1-12
  const anoAtual = hoje.getFullYear()

  return (
    <div className="h-screen flex flex-col">
      <EscalasClient
        setoresIniciais={setores}
        mesInicial={mesAtual}
        anoInicial={anoAtual}
      />
    </div>
  )
}

