import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import '../channel-alert-placement.css';

/** Only the compact button moves. The notifier and its order/audio hooks stay mounted. */
export function useChannelAlertTarget(enabled: boolean) {
  const { pathname } = useLocation();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const stage = document.querySelector<HTMLElement>('.app-frame > .app-stage');
    if (!stage) return;
    const anchor = document.createElement('span');
    anchor.className = 'channel-alert-slot';
    anchor.dataset.channelAlertTarget = '';
    let alive = true;
    const reconcile = () => {
      if (!alive) return;
      const dedicated = stage.querySelector<HTMLElement>('[data-channel-alert-slot]');
      const heading = [...stage.querySelectorAll<HTMLElement>('header,.home-menu__welcome,.operational-page__panel')]
        .find(element => !element.closest('dialog,[role="dialog"],[role="alertdialog"],.dv-original-print,article'));
      const homeBrand = heading?.matches('.home-menu__welcome') ? heading.closest<HTMLElement>('.home-menu__brand') : null;
      const host = dedicated ?? homeBrand ?? heading?.querySelector<HTMLElement>('.stock-heading__actions,.sales-header-actions,.catalog-header-actions,.finance-actions') ?? heading ?? stage;
      anchor.classList.toggle('channel-alert-slot--fallback', host === stage);
      if (anchor.parentElement !== host) host.prepend(anchor);
      setTarget(previous => previous === anchor ? previous : anchor);
    };
    const observer = new MutationObserver(reconcile);
    observer.observe(stage, { childList: true, subtree: true });
    queueMicrotask(reconcile);
    return () => { alive = false; observer.disconnect(); anchor.remove(); };
  }, [enabled, pathname]);
  return target?.isConnected ? target : null;
}
