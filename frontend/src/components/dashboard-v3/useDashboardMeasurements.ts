import { useLayoutEffect, useState, type RefObject } from 'react';

/** Measures only presentation inside this route; never changes queries or data. */
export function useDashboardMeasurements(rootRef: RefObject<HTMLElement | null>, layoutKey: string) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const line = root.querySelector<HTMLElement>('.dv-sub-line');
      const nav = root.querySelector<HTMLElement>('.dv-subnav');
      const active = root.querySelector<HTMLElement>('.dv-nav button[aria-pressed="true"]');
      if (line && nav && active) {
        const style = getComputedStyle(root), ns = getComputedStyle(nav);
        const available = root.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const left = root.getBoundingClientRect().left + root.clientLeft + parseFloat(style.paddingLeft);
        const intrinsic = [...nav.children].reduce((sum, child) => sum + child.getBoundingClientRect().width, 0)
          + (parseFloat(ns.columnGap) || 0) * Math.max(0, nav.children.length - 1)
          + parseFloat(ns.paddingLeft) + parseFloat(ns.paddingRight)
          + parseFloat(ns.borderLeftWidth) + parseFloat(ns.borderRightWidth);
        const pager = line.querySelector<HTMLElement>('.dv-pager');
        const pagerWidth = pager && getComputedStyle(pager).display !== 'none'
          ? pager.getBoundingClientRect().width + (parseFloat(getComputedStyle(line).columnGap) || 0) : 0;
        line.style.setProperty('--dv-submenu-offset', `${Math.max(0, Math.min(active.getBoundingClientRect().left - left, available - intrinsic - pagerWidth))}px`);
      }
      root.querySelectorAll<HTMLElement>('.dv-donut-graphic').forEach(graphic => {
        if (!graphic.getClientRects().length) return;
        const svg = graphic.querySelector('svg');
        const value = graphic.querySelector<HTMLElement>('.dv-donut-total strong');
        if (!svg || !value) return;
        const box = svg.getBoundingClientRect(), diameter = Math.min(box.width, box.height);
        const range = document.createRange(); range.selectNodeContents(value);
        // Sum line fragments even when compact layout wraps a large total.
        // Measuring only its bounding width would repeatedly toggle compact mode.
        const textWidth = [...range.getClientRects()].reduce((sum, rect) => sum + rect.width, 0);
        const font = parseFloat(getComputedStyle(value).fontSize);
        const fit = Math.min(21, Math.floor((font * Math.max(1, diameter * .54 - 4) / Math.max(1, textWidth) + .001) * 10) / 10);
        graphic.classList.toggle('is-compact', diameter < 180 || fit < 12);
        graphic.style.setProperty('--dv-donut-font', `${Math.max(12, fit)}px`);
        graphic.style.setProperty('--dv-donut-label', `${Math.max(10, Math.min(12, fit * .65))}px`);
      });
    };
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(root);
    root.querySelectorAll('.dv-nav,.dv-subnav,.dv-donut-graphic svg,.dv-donut-total strong').forEach(element => observer?.observe(element));
    window.addEventListener('resize', schedule);
    document.fonts?.addEventListener('loadingdone', schedule);
    void document.fonts?.ready.then(schedule);
    schedule();
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', schedule);
    };
  }, [rootRef, layoutKey]);
}

/** The existing SVG plot uses CSS-pixel coordinates so labels never shrink with
 * a fixed 660x270 viewBox. This state is geometry only, not query/filter state. */
export function usePlotDimensions(ref: RefObject<SVGSVGElement | null>) {
  const [size, setSize] = useState({width:660,height:270});
  useLayoutEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    let frame = 0, disposed = false;
    const schedule = () => {
      if (disposed) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed) return;
        const {width,height} = svg.getBoundingClientRect();
        if (width > 0 && height > 0) setSize(old => Math.abs(old.width-width)<.5&&Math.abs(old.height-height)<.5 ? old : {width,height});
      });
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
    observer?.observe(svg);
    window.addEventListener('resize',schedule);
    schedule();
    return () => { disposed=true; observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('resize',schedule); };
  }, [ref]);
  return size;
}
