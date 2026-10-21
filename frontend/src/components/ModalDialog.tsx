import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';

type Props = {
  children: ReactNode;
  className?: string;
  labelledBy: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  busy?: boolean;
  onRequestClose: () => void;
};

// Mount only while open. The native modal top layer owns background inertness,
// nested-dialog isolation; explicit Tab wrapping keeps focus within the document.
export function ModalDialog({ children, className, labelledBy, initialFocusRef, busy = false, onRequestClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!openerRef.current) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    const opener = openerRef.current;
    dialog.showModal();
    initialFocusRef?.current?.focus();
    return () => {
      dialog.close();
      // React removes the modal before re-enabling a busy opener in this commit.
      // Restore after the commit, checking that navigation did not remove it.
      queueMicrotask(() => { if (!dialog.open && opener?.isConnected) opener.focus(); });
    };
  }, [initialFocusRef]);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-labelledby={labelledBy}
      aria-modal="true"
      aria-busy={busy || undefined}
      onKeyDown={(event)=>{
        const dialog=dialogRef.current
        if(event.key!=='Tab'||!dialog||dialog!==[...document.querySelectorAll('dialog[open]')].at(-1))return
        const controls=[...dialog.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(e=>e.offsetParent!==null&&e.closest('dialog')===dialog)
        const first=controls[0],last=controls.at(-1)
        if(!first||!last){event.preventDefault();dialog.focus();return}
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onRequestClose();
      }}
    >
      {children}
    </dialog>
  );
}
