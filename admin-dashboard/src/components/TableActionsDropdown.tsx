import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export type TableActionItem =
  | { label: string; onClick: () => void; danger?: boolean }
  | { label: string; to: string; danger?: boolean };

type Props = {
  actions: TableActionItem[];
  /** Optional aria-label for the trigger button */
  ariaLabel?: string;
};

/** Vertical three-dots (kebab) icon for row actions */
const MoreVerticalIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="6" r="1.5" fill="currentColor" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    <circle cx="12" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

export const TableActionsDropdown = ({ actions, ariaLabel = "Actions" }: Props) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="table-actions-dropdown" ref={containerRef}>
      <button
        type="button"
        className="table-actions-trigger"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <MoreVerticalIcon />
      </button>
      {open && (
        <ul className="table-actions-menu" role="menu">
          {actions.map((action, i) => (
            <li key={i} role="none">
              {"to" in action ? (
                <Link
                  to={action.to}
                  className={`table-actions-item ${action.danger ? "table-actions-item--danger" : ""}`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  className={`table-actions-item ${action.danger ? "table-actions-item--danger" : ""}`}
                  role="menuitem"
                  onClick={() => { action.onClick(); setOpen(false); }}
                >
                  {action.label}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
