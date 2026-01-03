import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Validação de variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Aplicar configurações de segurança para produção
            const isProduction = process.env.NODE_ENV === 'production'
            const secureOptions: {
              secure?: boolean
              sameSite?: 'lax' | 'strict' | 'none'
              path?: string
              httpOnly?: boolean
              maxAge?: number
            } = {
              ...options,
              secure: isProduction, // Apenas HTTPS em produção
              sameSite: 'lax', // Proteção CSRF
              path: '/',
              // HttpOnly será aplicado pelo Supabase quando necessário
            }
            
            request.cookies.set(name, value)
            
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Tratamento de erro de autenticação
  // Se houver erro de token (JWT expirado/inválido), tentar refresh
  if (userError) {
    // Log do erro para monitoramento (sem dados sensíveis)
    console.error('[Middleware] Auth error:', userError.message)
    
    // Se for erro de JWT, o Supabase SSR já tentou refresh automaticamente
    // Se ainda assim falhou, verificar se é rota pública
    const publicRoutes = ['/login', '/cadastro', '/auth', '/confirmar-email']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    // Se não é rota pública e não há usuário, redirecionar para login
    if (!isPublicRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/login', '/cadastro', '/auth', '/confirmar-email']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Se não tem usuário e não é rota pública, redireciona para login
  // (já tratado acima se houver erro, mas manter para casos sem erro)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se tem usuário e está em rota de auth, verifica organização
  if (user && !isPublicRoute) {
    // Permitir acesso à seleção de organização sempre
    if (request.nextUrl.pathname.startsWith('/selecionar-organizacao')) {
      return supabaseResponse
    }

    // Para outras rotas protegidas, verificar se tem organização ativa
    const { data: profile } = await supabase
      .from('profiles')
      .select('organizacao_ativa_id')
      .eq('id', user.id)
      .single()

    if (!profile?.organizacao_ativa_id) {
      const url = request.nextUrl.clone()
      url.pathname = '/selecionar-organizacao'
      return NextResponse.redirect(url)
    }
  }

  // Se está logado e tenta acessar login/cadastro, redireciona para dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/cadastro')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}

