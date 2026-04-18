'use client';

import { Button } from 'antd';
import type { SupervisorException } from '@/types/supervisor';
import { EXCEPTION_KIND_LABELS } from '@/types/supervisor';

interface Props {
  items: SupervisorException[];
  count: number;
  onAction?: (exception: SupervisorException, action: 'primary' | 'secondary') => void;
}

export function ExceptionsPanel({ items, count, onAction }: Props) {
  return (
    <section className="sv-panel sv-panel-exc">
      <header className="sv-panel-head">
        <h3>
          Excepciones <span className="sv-count">{count}</span>
        </h3>
        <div className="sv-panel-sub">
          ÚNICAS COSAS QUE EL BOT NO PUEDE RESOLVER
        </div>
      </header>

      <div className="sv-panel-body">
        {items.map((exc) => (
          <div key={exc.id} className="exc-item">
            <div className="exc-reason">⚠ {EXCEPTION_KIND_LABELS[exc.kind]}</div>
            <div className="exc-title">{exc.title}</div>
            <div className="exc-detail">{exc.detail}</div>

            <div className="exc-actions">
              <Button
                type={exc.primary_action.kind === 'primary' ? 'primary' : 'default'}
                onClick={() => onAction?.(exc, 'primary')}
              >
                {exc.primary_action.label}
              </Button>
              {exc.secondary_action && (
                <Button
                  type="default"
                  onClick={() => onAction?.(exc, 'secondary')}
                >
                  {exc.secondary_action.label}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
