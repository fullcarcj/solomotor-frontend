'use client';

import { Tag } from 'antd';
import type { WaitingItem } from '@/types/supervisor';
import {
  WAITING_REASON_LABELS,
  WAITING_REASON_COLORS,
} from '@/types/supervisor';
import { formatTimeSince, formatMoneyUsd } from './shared';

interface Props {
  items: WaitingItem[];
  count: number;
}

export function WaitingPanel({ items, count }: Props) {
  return (
    <section className="sv-panel sv-panel-waiting">
      <header className="sv-panel-head">
        <h3>
          Esperando <span className="sv-count">{count}</span>
        </h3>
        <div className="sv-panel-sub">
          POR COMPRADOR · BOT YA HIZO SU PARTE
        </div>
      </header>

      <div className="sv-panel-body">
        {items.map((item) => (
          <div key={item.id} className="waiting-item">
            <div className="waiting-avatar">{item.customer_initials}</div>

            <div className="waiting-main">
              <div className="waiting-name">{item.customer_name}</div>
              <div className="waiting-stage">
                <Tag color={WAITING_REASON_COLORS[item.stage_reason]}>
                  {WAITING_REASON_LABELS[item.stage_reason].toUpperCase()}
                </Tag>
                <span className="waiting-desc">{item.stage_description}</span>
              </div>
              <div className="waiting-botlog">{item.bot_log}</div>
            </div>

            <div className="waiting-right">
              <div className="waiting-money">{formatMoneyUsd(item.amount_usd)}</div>
              <div className="waiting-since">{formatTimeSince(item.since_iso)}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
