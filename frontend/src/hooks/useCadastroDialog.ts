import { useEffect, useRef } from 'react'

const dialogSelector = ':is([role="alertdialog"],[role="dialog"])[aria-modal="true"]'
const focusableSelector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])'
const topDialog = () => [...document.querySelectorAll<HTMLElement>(dialogSelector)].at(-1)
const isCadastroDialog = (dialog: HTMLElement) => Boolean(dialog.closest('[data-cadastros] .cad-page'))

export function useCadastroDialog(active: boolean, onClose: () => void) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!active) return
    const dialog = topDialog()
    if (!dialog || !isCadastroDialog(dialog)) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const elements = () => [...dialog.querySelectorAll<HTMLElement>(focusableSelector)]
      .filter(element => element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert],[aria-hidden="true"]'))
    const timer = window.setTimeout(() => {
      if (dialog === topDialog() && !dialog.contains(document.activeElement)) {
        (dialog.querySelector<HTMLElement>('[autofocus]') ?? elements()[0] ?? dialog).focus()
      }
    }, 0)
    const keydown = (event: KeyboardEvent) => {
      if (dialog !== topDialog() || event.defaultPrevented) return
      if (event.key === 'Escape') {
        event.preventDefault()
        const details = dialog.querySelector<HTMLDetailsElement>('details.filter-multiselect[open]')
        if (details) {
          details.open = false
          details.querySelector('summary')?.focus()
        } else closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const fields = elements()
      const first = fields[0], last = fields.at(-1)
      if (!first || !last) {
        event.preventDefault()
        dialog.focus()
        return
      }
      if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) {
        event.preventDefault()
        const target = event.shiftKey ? last : first
        target.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', keydown)
      const remaining = topDialog()
      if (previous?.isConnected && (!remaining || remaining.contains(previous))) previous.focus()
    }
  }, [active])
}
