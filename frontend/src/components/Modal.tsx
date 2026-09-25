import type { ReactNode } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  children: ReactNode;
  labelledById?: string;
  className?: string;
}

export function Modal({ open, onClose, title, eyebrow, description, children, labelledById, className }: Props) {
  const ref = useModalA11y(open, onClose);
  if (!open) return null;
  const titleId = labelledById ?? 'modal-title';
  return (
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className={`modal${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
      >
        <div className="modal__head">
          {eyebrow && <div className="modal__eyebrow">{eyebrow}</div>}
          <h2 className="modal__title" id={titleId}>{title}</h2>
          {description && <p className="modal__desc">{description}</p>}
          <button className="modal__close" data-close aria-label="Close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
