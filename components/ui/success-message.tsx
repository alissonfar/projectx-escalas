import * as React from "react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export interface SuccessMessageProps
  extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  showIcon?: boolean
}

const SuccessMessage = React.forwardRef<HTMLDivElement, SuccessMessageProps>(
  ({ className, title, description, actionLabel, onAction, showIcon = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-4", className)}
        {...props}
      >
        <Alert className="bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            {showIcon && (
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-green-800 mb-1">{title}</h3>
              <AlertDescription className="text-green-700">
                {description}
              </AlertDescription>
            </div>
          </div>
        </Alert>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="w-full bg-[#1E73BE] hover:bg-[#1557A0] text-white"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    )
  }
)
SuccessMessage.displayName = "SuccessMessage"

export { SuccessMessage }

