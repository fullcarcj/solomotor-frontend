'use client';

import type { SupervisorException } from '@/types/supervisor';
import { EXCEPTION_KIND_LABELS } from '@/types/supervisor';

interface Props {
  items: SupervisorException[];
  count: number;
  onAction?: (exception: SupervisorException, action: 'primary' | 'secondary') => void;
}

/**
 * Mapping del `kind` semántico del backend a las variantes visuales del
 * mockup (solomotorx-v3-automatizado.html):
 *   - kind === 'primary'   → .exc-btn--primary (naranja · acción urgente)
 *   - kind === 'secondary' → .exc-btn--accent  (verde limón · aprobación/ok)
 * La acción secundaria (si existe) siempre se renderiza como botón default gris.
 */
function primaryBtnClass(kind: 'primary' | 'secondary'): string {
  return kind === 'primary' ? 'exc-btn exc-btn--primary' : 'exc-btn exc-btn--accent';
}

export function ExceptionsPanel({ items, count, onAction }: Props) {
  return (
    <section className="sv-panel sv-panel-exc">
      <header className="sv-panel-head">
        <h3>
          Excepciones <span className="sv-count">{count}</span>
        </h3>
        <div className="sv-panel-sub">
          Únicas cosas que el bot no puede resolver
        </div>
      </header>

      <div className="sv-panel-body">
        {items.map((exc) => (
          <article key={exc.id} className="exc-item">
            <div className="exc-body">
              <span className="exc-reason">⚠ {EXCEPTION_KIND_LABELS[exc.kind]}</span>
              <div className="exc-title">{exc.title}</div>
              <div className="exc-detail">{exc.detail}</div>
            </div>

            <div className="exc-actions">
              <button
                type="button"
                className={primaryBtnClass(exc.primary_action.kind)}
                onClick={() => onAction?.(exc, 'primary')}
              >
                {exc.primary_action.label}
              </button>
              {exc.secondary_action && (
                <button
                  type="button"
                  className="exc-btn"
                  onClick={() => onAction?.(exc, 'secondary')}
                >
                  {exc.secondary_action.label}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
