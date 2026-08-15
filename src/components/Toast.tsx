import { useEffect } from 'react'

export function Toast({
  message,
  onDismiss,
  duration = 3200,
}: {
  message: string | null
  onDismiss: () => void
  duration?: number
}) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(t)
  }, [message, duration, onDismiss])

  if (!message) return null
  return (
    <div className="toast" role="status">
      {message}
    </div>
  )
}
