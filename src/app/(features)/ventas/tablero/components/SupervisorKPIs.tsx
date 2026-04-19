'use client';

import type { SupervisorKPIs as KPIsType } from '@/types/supervisor';
import { formatMoneyUsd } from './shared';

interface Props {
  kpis: KPIsType;
}

export function SupervisorKPIs({ kpis }: Props) {
  return (
    <div className="supervisor-kpis">
      <div className="kpi kpi--bot">
        <div className="kpi-label">
          <span className="dot dot-bot" />
          BOT resolvió
        </div>
        <div className="kpi-value">{kpis.bot_resolved.percentage}%</div>
        <div className="kpi-sub">
          {kpis.bot_resolved.count_today} / {kpis.bot_resolved.count_total_today} hoy · sin tocar
        </div>
      </div>

      <div className="kpi kpi--human">
        <div className="kpi-label">
          <span className="dot dot-human" />
          Esperando comprador
        </div>
        <div className="kpi-value">{kpis.waiting_buyer.count}</div>
        <div className="kpi-sub">
          {kpis.waiting_buyer.by_stage.approval} aprob. ·{' '}
          {kpis.waiting_buyer.by_stage.payment} pago ·{' '}
          {kpis.waiting_buyer.by_stage.delivery} entrega
        </div>
      </div>

      <div className="kpi kpi--warn">
        <div className="kpi-label">
          <span className="dot dot-warn" />
          Excepciones
        </div>
        <div className="kpi-value">{kpis.exceptions.count}</div>
        <div className="kpi-sub">Requieren tu atención</div>
      </div>

      <div className="kpi kpi--ok">
        <div className="kpi-label">
          <span className="dot dot-ok" />
          Cerradas hoy
        </div>
        <div className="kpi-value">{kpis.closed_today.count}</div>
        <div className="kpi-sub kpi-money">
          +{formatMoneyUsd(kpis.closed_today.amount_usd)}
        </div>
      </div>
    </div>
  );
}
