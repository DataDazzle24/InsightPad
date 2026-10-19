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
// Tab navigation and nested-dialog isolation; each instance has an explicit ref.
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
