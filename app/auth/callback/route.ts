import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/selecionar-organizacao'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Verificar se email foi confirmado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user?.email_confirmed_at) {
        // Email confirmado - redirecionar para seleção de organização ou dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('organizacao_ativa_id')
          .eq('id', user.id)
          .single()

        if (profile?.organizacao_ativa_id) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } else {
          return NextResponse.redirect(new URL('/selecionar-organizacao?novo=true&confirmado=true', request.url))
        }
      } else {
        // Email ainda não confirmado (não deveria acontecer, mas trata)
        return NextResponse.redirect(new URL('/confirmar-email?email=' + encodeURIComponent(user?.email || ''), request.url))
      }
    }
  }

  // Se houver erro ou não houver code, redirecionar para login
  return NextResponse.redirect(new URL('/login', request.url))
}

