'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  value: Date | null
  onChange: (date: Date | null) => void
  label?: string
  error?: string
  required?: boolean
  min?: Date
  max?: Date
  showTime?: boolean
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  label,
  error,
  required,
  min,
  max,
  showTime = true,
  disabled,
  className
}: DateTimePickerProps) {
  const formatDateTimeLocal = (date: Date | null): string => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (!value) {
      onChange(null)
      return
    }
    const date = new Date(value)
    onChange(date)
  }

  const minStr = min ? formatDateTimeLocal(min) : undefined
  const maxStr = max ? formatDateTimeLocal(max) : undefined

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className={cn(required && 'after:content-["*"] after:ml-0.5 after:text-red-500')}>
          {label}
        </Label>
      )}
      <Input
        type={showTime ? 'datetime-local' : 'date'}
        value={formatDateTimeLocal(value)}
        onChange={handleChange}
        disabled={disabled}
        min={minStr}
        max={maxStr}
        className={cn(
          error && 'border-red-500 focus:ring-red-500'
        )}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}



