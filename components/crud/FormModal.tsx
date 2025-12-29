'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FormModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void | Promise<void>
  submitLabel?: string
  cancelLabel?: string
  loading?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}

export function FormModal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  loading = false,
  size = 'md'
}: FormModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={(value) => {
          // Não fechar durante loading
          if (!loading && value) {
            onClose()
          }
        }}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all',
                  sizeClasses[size]
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <form 
                  onSubmit={(e) => {
                    e.stopPropagation()
                    const result = onSubmit(e)
                    if (result instanceof Promise) {
                      result.catch((error) => {
                        console.error('Erro no onSubmit:', error)
                      })
                    }
                  }} 
                  noValidate
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {title}
                    </Dialog.Title>
                    
                    <div className="space-y-4">
                      {children}
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={loading}
                      className="min-w-[100px]"
                    >
                      {cancelLabel}
                    </Button>
                    <Button
                      type="submit"
                      variant="default"
                      disabled={loading}
                      className="min-w-[100px] font-semibold shadow-sm hover:shadow-md transition-shadow"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </span>
                      ) : (
                        submitLabel
                      )}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

