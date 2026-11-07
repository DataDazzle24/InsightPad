import { useLayoutEffect, useState, type RefObject } from 'react';

/** Measures only presentation inside this route; never changes queries or data. */
export function useDashboardMeasurements(rootRef: RefObject<HTMLElement | null>, layoutKey: string) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let disposed = false;
    let fittedTotals = new WeakMap<HTMLElement, {diameter:number;text:string;fit:number;compact:boolean}>();
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
        const text = value.textContent ?? '';
        const previous = fittedTotals.get(graphic);
        const unchanged = previous && Math.abs(previous.diameter-diameter)<.5 && previous.text===text;
        const limit = Math.max(1, diameter*.54-4);
        // Font hinting is quantized: feeding the last result back into an
        // unconstrained ratio can alternate forever between two font sizes.
        // For identical geometry/content, keep a fit that is already safe and
        // only shrink an overflowing one. Growing the ring/changing the data or
        // loading fonts starts a new fit; business state is never touched.
        if (unchanged && (previous.compact || textWidth<=limit+.25)) return;
        let fit = Math.min(21, Math.floor((font*limit/Math.max(1,textWidth)+.001)*10)/10);
        if (unchanged) fit = Math.min(fit, previous.fit-.1);
        const compact = diameter<180 || fit<12;
        graphic.classList.toggle('is-compact', compact);
        graphic.style.setProperty('--dv-donut-font', `${Math.max(12,fit)}px`);
        graphic.style.setProperty('--dv-donut-label', `${Math.max(10,Math.min(12,fit*.65))}px`);
        fittedTotals.set(graphic,{diameter,text,fit:Math.max(12,fit),compact});
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
    const fontsChanged = () => { if(disposed)return; fittedTotals=new WeakMap(); schedule(); };
    document.fonts?.addEventListener('loadingdone', fontsChanged);
    void document.fonts?.ready.then(fontsChanged);
    schedule();
    return () => {
      disposed = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      document.fonts?.removeEventListener('loadingdone', fontsChanged);
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
