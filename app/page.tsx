import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Se está logado, redireciona para dashboard
  if (user) {
    redirect('/dashboard')
  }
  
  // Se não está logado, redireciona para login
  redirect('/login')
}

