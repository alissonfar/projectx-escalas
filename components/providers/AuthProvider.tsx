'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * Provider de autenticação que monitora mudanças no estado de auth
 * e sincroniza entre cliente e servidor
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const supabase = createClient()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Logout: garantir redirecionamento e limpeza
        if (event === 'SIGNED_OUT') {
          // Se não estiver em rota pública, redirecionar para login
          const publicRoutes = ['/login', '/cadastro', '/auth', '/confirmar-email']
          const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route))
          
          if (!isPublicRoute) {
            router.push('/login')
          }
          // Forçar refresh do servidor para limpar cookies
          router.refresh()
          return
        }

        // Login ou refresh de token: sincronizar estado
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Forçar refresh do servidor para sincronizar cookies
          router.refresh()
        }

        // Sessão atualizada: sincronizar
        if (event === 'USER_UPDATED') {
          router.refresh()
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname])

  return <>{children}</>
}

