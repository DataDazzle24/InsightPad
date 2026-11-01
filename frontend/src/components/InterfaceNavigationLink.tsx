import { useState, type ComponentProps } from 'react'
import { Link, NavLink } from 'react-router-dom'

// Presentation only. Router defaults, modifiers, destinations and handlers stay intact.
function useNavigationFeedback() {
  const [feedback, setFeedback] = useState(false)
  return { feedback, start: () => setFeedback(true), end: () => setFeedback(false) }
}

export function InterfaceLink({ children, className = '', onPointerDown, onKeyDown, onPointerUp, onKeyUp, onBlur, onAnimationEnd, ...props }: ComponentProps<typeof Link>) {
  const visual = useNavigationFeedback()
  return <Link {...props} className={`${className} ip-nav ${visual.feedback ? 'is-feedback' : ''}`}
    onPointerDown={event => { onPointerDown?.(event); if (!event.defaultPrevented && event.button === 0) visual.start() }}
    onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && event.key === 'Enter') visual.start() }}
    onPointerUp={event => { onPointerUp?.(event); if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) visual.end() }}
    onKeyUp={event => { onKeyUp?.(event); if (event.key === 'Enter' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) visual.end() }}
    onBlur={event => { onBlur?.(event); visual.end() }}
    onAnimationEnd={event => { onAnimationEnd?.(event); if (event.target === event.currentTarget) visual.end() }}>
    <span className="ip-nav-content">{children}</span>
  </Link>
}

export function InterfaceNavLink({ children, className = '', onPointerDown, onKeyDown, onPointerUp, onKeyUp, onBlur, onAnimationEnd, ...props }: ComponentProps<typeof NavLink>) {
  const visual = useNavigationFeedback()
  return <NavLink {...props} className={state => `${typeof className === 'function' ? className(state) : className} ${state.isActive ? 'active' : ''} ip-nav ${visual.feedback ? 'is-feedback' : ''}`}
    onPointerDown={event => { onPointerDown?.(event); if (!event.defaultPrevented && event.button === 0) visual.start() }}
    onKeyDown={event => { onKeyDown?.(event); if (!event.defaultPrevented && event.key === 'Enter') visual.start() }}
    onPointerUp={event => { onPointerUp?.(event); if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) visual.end() }}
    onKeyUp={event => { onKeyUp?.(event); if (event.key === 'Enter' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) visual.end() }}
    onBlur={event => { onBlur?.(event); visual.end() }}
    onAnimationEnd={event => { onAnimationEnd?.(event); if (event.target === event.currentTarget) visual.end() }}>
    {state => <span className="ip-nav-content">{typeof children === 'function' ? children(state) : children}</span>}
  </NavLink>
}
