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
  onSubmit: () => void | Promise<void>
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit()
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className={cn(
                'w-full transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all',
                sizeClasses[size]
              )}>
                <form onSubmit={handleSubmit}>
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
                      disabled={loading}
                      className="min-w-[100px]"
                    >
                      {loading ? 'Salvando...' : submitLabel}
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

