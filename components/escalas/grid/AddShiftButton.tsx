'use client'

interface AddShiftButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function AddShiftButton({ onClick, disabled }: AddShiftButtonProps) {
  if (disabled) return null
  
  return (
    <button
      onClick={onClick}
      className="
        w-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600
        rounded text-gray-400 dark:text-gray-500
        hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
        transition-colors flex items-center justify-center
      "
      title="Adicionar plantão"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  )
}


