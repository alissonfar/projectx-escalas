'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './StatusBadge'
import { SearchInput } from './SearchInput'
import { cn } from '@/lib/utils'

export interface ColumnDef<T> {
  accessorKey: keyof T | string
  header: string
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
}

export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'text'
  options?: { value: string; label: string }[]
}

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onToggleActive?: (row: T) => void
  filters?: FilterConfig[]
  searchPlaceholder?: string
  pagination?: boolean
  loading?: boolean
  searchable?: boolean
  searchKeys?: (keyof T)[]
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onEdit,
  onDelete,
  onToggleActive,
  filters = [],
  searchPlaceholder = 'Buscar...',
  pagination = true,
  loading = false,
  searchable = true,
  searchKeys = []
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof T | string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({})
  const itemsPerPage = 10

  // Filtrar dados
  const filteredData = useMemo(() => {
    let result = [...data]

    // Busca global
    if (search && searchable) {
      const searchLower = search.toLowerCase()
      result = result.filter((row) => {
        if (searchKeys.length > 0) {
          return searchKeys.some((key) => {
            const value = row[key]
            return value?.toString().toLowerCase().includes(searchLower)
          })
        }
        // Buscar em todas as colunas se não especificado
        return columns.some((col) => {
          const value = row[col.accessorKey as keyof T]
          return value?.toString().toLowerCase().includes(searchLower)
        })
      })
    }

    // Filtros específicos
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => {
          const rowValue = row[key]
          return rowValue?.toString() === value
        })
      }
    })

    // Ordenação
    if (sortColumn) {
      result.sort((a, b) => {
        const aValue = a[sortColumn as keyof T]
        const bValue = b[sortColumn as keyof T]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }

    return result
  }, [data, search, activeFilters, sortColumn, sortDirection, searchKeys, columns, searchable])

  // Paginação
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, pagination])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const handleSort = (column: keyof T | string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const getStatusBadge = (row: T) => {
    if ('ativo' in row) {
      return <StatusBadge status={row.ativo ? 'ativo' : 'inativo'} />
    }
    if ('status' in row) {
      const status = row.status as string
      if (status === 'confirmado') return <StatusBadge status="confirmado" />
      if (status === 'cancelado') return <StatusBadge status="cancelado" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Busca e Filtros */}
      {(searchable || filters.length > 0) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {searchable && (
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {filters.map((filter) => (
            <div key={filter.key} className="w-full sm:w-48">
              {filter.type === 'select' && filter.options && (
                <select
                  value={activeFilters[filter.key] || ''}
                  onChange={(e) =>
                    setActiveFilters({ ...activeFilters, [filter.key]: e.target.value })
                  }
                  className="w-full h-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                >
                  <option value="">Todos {filter.label}</option>
                  {filter.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.accessorKey)}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                  onClick={() => column.sortable && handleSort(column.accessorKey)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortColumn === column.accessorKey && (
                      <svg
                        className={cn(
                          'w-4 h-4',
                          sortDirection === 'asc' ? 'rotate-180' : ''
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onToggleActive) && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete || onToggleActive ? 1 : 0)}
                  className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  {columns.map((column) => (
                    <td key={String(column.accessorKey)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {column.cell
                        ? column.cell(row)
                        : column.accessorKey === 'ativo' || column.accessorKey === 'status'
                        ? getStatusBadge(row)
                        : String(row[column.accessorKey as keyof T] ?? '')}
                    </td>
                  ))}
                  {(onEdit || onDelete || onToggleActive) && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(row)}
                            className="h-8 w-8 p-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                        )}
                        {onToggleActive && 'ativo' in row && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onToggleActive(row)}
                            className="h-8 w-8 p-0"
                          >
                            {row.ativo ? (
                              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(row)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredData.length)} de {filteredData.length} registros
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}




