import { create } from 'zustand'
import { Organizacao } from '@/types/database'

interface OrganizacaoState {
  organizacaoAtiva: Organizacao | null
  setOrganizacaoAtiva: (org: Organizacao | null) => void
}

export const useOrganizacaoStore = create<OrganizacaoState>((set) => ({
  organizacaoAtiva: null,
  setOrganizacaoAtiva: (org) => set({ organizacaoAtiva: org }),
}))

