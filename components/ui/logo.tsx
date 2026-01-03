import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  className?: string
}

export function Logo({ variant = 'light', className }: LogoProps) {
  const baseClasses = "w-full h-auto"
  const gradientId = `popGradient-${variant}`
  const filterId = `softShadow-${variant}`
  
  if (variant === 'dark') {
    // Logo branca para fundos escuros
    return (
      <svg 
        viewBox="0 0 450 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={cn(baseClasses, className)}
        aria-label="Plantão Flow"
      >
        <g transform="translate(40, 25)">
          <rect x="0" y="5" width="55" height="55" rx="10" fill="white" opacity="0.2"/>
          <rect x="5" y="0" width="55" height="55" rx="10" fill="white"/>
          
          <line x1="32.5" y1="5" x2="32.5" y2="55" stroke="#004182" strokeWidth="2" opacity="0.6"/>
          <line x1="5" y1="32.5" x2="55" y2="32.5" stroke="#004182" strokeWidth="2" opacity="0.6"/>

          <g>
            <rect x="30" y="-5" width="32" height="32" rx="8" fill="white"/>
            <path d="M46 6V16M41 11H51" stroke="#004182" strokeWidth="2.5" strokeLinecap="round"/>
          </g>
        </g>

        <text x="120" y="72" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontWeight="800" fontSize="32" fill="white" letterSpacing="0.5">PLANTÃO</text>
        <text x="278" y="72" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontWeight="300" fontSize="32" fill="white" letterSpacing="0.5">FLOW</text>
      </svg>
    )
  }

  // Logo azul para fundos claros
  return (
    <svg 
      viewBox="0 0 450 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn(baseClasses, className)}
      aria-label="Plantão Flow"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#4C9FFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2684FF', stopOpacity: 1 }} />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="1" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge> 
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/> 
          </feMerge>
        </filter>
      </defs>
      <g transform="translate(40, 25)">
        <rect x="0" y="5" width="55" height="55" rx="10" fill="#003466"/>
        <rect x="5" y="0" width="55" height="55" rx="10" fill="#004182"/>
        
        <line x1="32.5" y1="5" x2="32.5" y2="55" stroke="#2684FF" strokeWidth="2" opacity="0.3"/>
        <line x1="5" y1="32.5" x2="55" y2="32.5" stroke="#2684FF" strokeWidth="2" opacity="0.3"/>

        <g filter={`url(#${filterId})`}>
          <rect x="30" y="-5" width="32" height="32" rx="8" fill={`url(#${gradientId})`}/>
          <path d="M46 6V16M41 11H51" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </g>

      <text x="120" y="72" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontWeight="800" fontSize="32" fill="#004182" letterSpacing="0.5">PLANTÃO</text>
      <text x="278" y="72" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" fontWeight="300" fontSize="32" fill="#004182" letterSpacing="0.5">FLOW</text>
    </svg>
  )
}

