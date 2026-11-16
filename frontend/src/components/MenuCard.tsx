import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

const MENU_PRESS_MS = 160;

type MenuCardProps = { to: string; label: string; description: string; icon: string };

export function MenuCard({ to, label, description, icon }: MenuCardProps) {
  const navigate = useNavigate();
  const timer = useRef<number | undefined>(undefined);
  const [pressed, setPressed] = useState(false);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (timer.current !== undefined) return;
    // A different navigation during the feedback takes precedence.
    const sourceUrl = window.location.href;
    setPressed(true);
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      setPressed(false);
      if (window.location.href === sourceUrl) void navigate(to);
    }, MENU_PRESS_MS);
  }

  // Both layers share geometry. The filled layer is decorative.
  const content = (
    <>
      <span className="material-symbols-rounded menus-card__icon" aria-hidden="true">{icon}</span>
      <span className="menus-card__label"><strong>{label}</strong><small>{description}</small></span>
      <span className="material-symbols-rounded menus-card__arrow" aria-hidden="true">arrow_forward</span>
    </>
  );

  return (
    <Link to={to} onClick={handleClick} className={`legacy-tile menus-card${pressed ? " menus-card--pressed" : ""}`}>
      <span className="menus-card__face">{content}</span>
      <span className="menus-card__face menus-card__face--filled" aria-hidden="true">{content}</span>
    </Link>
  );
}
