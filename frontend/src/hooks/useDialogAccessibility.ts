import { useEffect, useRef } from 'react'
const selector = 'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const topDialog = () => [...document.querySelectorAll<HTMLElement>('[role="alertdialog"],[role="dialog"]')].at(-1)
export function useDialogAccessibility(active: boolean, onClose: () => void) {
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    if (!active) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = topDialog()
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>(selector) ?? [])].filter(element => element.offsetParent !== null)
    const timer = window.setTimeout(() => {
      if (!dialog || dialog !== topDialog()) return
      if (!dialog.contains(document.activeElement)) (dialog.querySelector<HTMLElement>('[autofocus]') ?? focusable()[0] ?? dialog).focus()
    }, 0)
    const keydown = (event: KeyboardEvent) => {
      if (!dialog || dialog !== topDialog() || event.defaultPrevented) return
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); return }
      if (event.key !== 'Tab') return
      const elements = focusable(), first = elements[0], last = elements.at(-1)
      if (!first || !last) { event.preventDefault(); dialog.focus(); return }
      if (!dialog.contains(document.activeElement) || (event.shiftKey && document.activeElement === first)) { event.preventDefault(); (event.shiftKey ? last : first).focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { window.clearTimeout(timer); document.removeEventListener('keydown', keydown); if (previous?.isConnected) previous.focus() }
  }, [active])
}
