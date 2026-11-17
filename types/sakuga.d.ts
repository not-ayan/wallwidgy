import type { DetailedHTMLProps, HTMLAttributes, Ref } from 'react'

export interface SakugaButtonElement extends HTMLElement {
  done(hold?: number): void
  impact(): void
  primary: boolean
  disabled: boolean
}

export interface SakugaButtonAttributes extends HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  type?: string
  ref?: Ref<SakugaButtonElement>
  title?: string
  className?: string
}

export interface SakugaToastElement extends HTMLElement {
  show(text?: string): void
  hide(): void
  open: boolean
}

export interface SakugaToastAttributes extends HTMLAttributes<HTMLElement> {
  duration?: number | string
  message?: string
  ref?: Ref<SakugaToastElement>
  className?: string
  id?: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sakuga-button': DetailedHTMLProps<SakugaButtonAttributes, SakugaButtonElement>
      'sakuga-toast': DetailedHTMLProps<SakugaToastAttributes, SakugaToastElement>
    }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'sakuga-button': DetailedHTMLProps<SakugaButtonAttributes, SakugaButtonElement>
        'sakuga-toast': DetailedHTMLProps<SakugaToastAttributes, SakugaToastElement>
      }
    }
  }
}
