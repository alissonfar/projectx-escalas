'use client'

import { useState, useRef, useEffect } from 'react'
import type { Setor, Hospital } from '@/types/database'

interface SectorSelectorProps {
  setores: Array<Setor & { hospital: Hospital }>
  selectedSetores: string[]
  onChange: (setorIds: string[]) => void
}

export function SectorSelector({
  setores,
  selectedSetores,
  onChange
}: SectorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filtrar setores por busca
  const filteredSetores = setores.filter(setor => {
    const searchLower = searchTerm.toLowerCase()
    return (
      setor.nome.toLowerCase().includes(searchLower) ||
      setor.hospital.nome.toLowerCase().includes(searchLower)
    )
  })

  const handleToggleSetor = (setorId: string) => {
    if (selectedSetores.includes(setorId)) {
      // Remover se já está selecionado
      onChange(selectedSetores.filter(id => id !== setorId))
    } else {
      // Adicionar se não está selecionado
      onChange([...selectedSetores, setorId])
    }
  }

  const handleSelectAll = () => {
    if (selectedSetores.length === filteredSetores.length) {
      // Desmarcar todos
      onChange([])
    } else {
      // Marcar todos os filtrados
      onChange(filteredSetores.map(s => s.id))
    }
  }

  const getDisplayText = () => {
    if (selectedSetores.length === 0) {
      return 'Selecione os setores'
    }
    if (selectedSetores.length === 1) {
      const setor = setores.find(s => s.id === selectedSetores[0])
      return setor ? setor.nome : '1 setor selecionado'
    }
    return `${selectedSetores.length} setores selecionados`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 h-10 px-4 rounded-lg border
          bg-white dark:bg-gray-800
          border-gray-300 dark:border-gray-600
          hover:border-gray-400 dark:hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
          transition-colors min-w-[200px] text-left
        `}
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {getDisplayText()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          {/* Busca */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              placeholder="Buscar setor ou hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
              autoFocus
            />
          </div>

          {/* Opção "Selecionar todos" */}
          {filteredSetores.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 py-1 -mx-2">
                <input
                  type="checkbox"
                  checked={selectedSetores.length === filteredSetores.length && filteredSetores.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Selecionar todos ({filteredSetores.length})
                </span>
              </label>
            </div>
          )}

          {/* Lista de setores */}
          <div className="overflow-y-auto flex-1">
            {filteredSetores.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Nenhum setor encontrado' : 'Nenhum setor disponível'}
              </div>
            ) : (
              <div className="p-2">
                {filteredSetores.map((setor) => {
                  const isSelected = selectedSetores.includes(setor.id)
                  return (
                    <label
                      key={setor.id}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSetor(setor.id)}
                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {setor.nome}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {setor.hospital.nome}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer com contador */}
          {selectedSetores.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {selectedSetores.length} {selectedSetores.length === 1 ? 'setor selecionado' : 'setores selecionados'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


