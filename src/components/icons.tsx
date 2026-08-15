import type { CSSProperties } from 'react'

interface IconProps {
  size?: number
  className?: string
  style?: CSSProperties
}

/** Einheitliche Strich-Icons — bewusst inline, damit die App keine Fremd-Assets braucht. */
function base({ size, className, style }: IconProps) {
  return {
    width: size ?? 24,
    height: size ?? 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    style,
    'aria-hidden': true,
  }
}

export const IconToday = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <rect x="3" y="4" width="18" height="17" rx="3" />
    <path d="M8 2v4M16 2v4M3 10h18" />
    <path d="M9 15l2 2 4-4" />
  </svg>
)

export const IconChart = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M3 21h18" />
    <path d="M6 17v-5M11 17V7M16 17v-8M21 17v-3" />
  </svg>
)

export const IconBook = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
    <path d="M4 19a2 2 0 0 1 2-2h13" />
  </svg>
)

export const IconHistory = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
)

export const IconSettings = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
  </svg>
)

export const IconCheck = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })} strokeWidth={3}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export const IconPlus = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconMinus = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M5 12h14" />
  </svg>
)

export const IconChevronLeft = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
)

export const IconChevronDown = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export const IconRun = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <circle cx="15.5" cy="4.5" r="2" />
    <path d="M8 21l2.5-5 3-2-1-5-3.5 2L7 13" />
    <path d="M13.5 14l2.5 3 1.5 4" />
    <path d="M12.5 9L16 8l2.5 3H21" />
  </svg>
)

export const IconStrength = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M4 9v6M20 9v6M7 6v12M17 6v12" />
    <path d="M7 12h10" />
  </svg>
)

export const IconTrash = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
)

export const IconWhistle = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M21 9H10.5a5.5 5.5 0 1 0 0 11h3.2a5.5 5.5 0 0 0 5.4-4.4L21 9z" />
    <circle cx="10.5" cy="14.5" r="2" />
    <path d="M13 9V6a2 2 0 0 0-2-2H8" />
  </svg>
)

export const IconFlame = ({ size, className, style }: IconProps) => (
  <svg {...base({ size, className, style })}>
    <path d="M12 2c1.5 3.5-1 5-1 7a3 3 0 0 0 6 0c0-1-.3-2-1-3 3 2 5 5 5 8a9 9 0 1 1-18 0c0-4 2.5-8 6-10 0-1 .5-1.5 3-2z" />
  </svg>
)
