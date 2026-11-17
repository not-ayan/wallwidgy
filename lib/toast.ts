import type { SakugaToastElement } from '@/types/sakuga'

/**
 * Trigger the Sakuga VFX toast notification.
 * Streaks across with speed lines, skids to a stop with manga SFX ズザッ, and auto-dismisses.
 */
export function showSakugaToast(message: string, duration?: number) {
  if (typeof window === 'undefined') return

  const toast = document.querySelector('sakuga-toast') as SakugaToastElement | null
  if (toast && typeof toast.show === 'function') {
    if (duration) toast.setAttribute('duration', String(duration))
    toast.show(message)
  } else if (window.customElements) {
    window.customElements.whenDefined('sakuga-toast').then(() => {
      const el = document.querySelector('sakuga-toast') as SakugaToastElement | null
      if (el && typeof el.show === 'function') {
        if (duration) el.setAttribute('duration', String(duration))
        el.show(message)
      }
    })
  }
}
