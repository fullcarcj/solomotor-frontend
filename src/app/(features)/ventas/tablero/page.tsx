'use client';

import Link from 'next/link';
import Swal from 'sweetalert2';

import { all_routes as route } from '@/data/all_routes';
import type { SupervisorException } from '@/types/supervisor';

import { useSupervisorKPIs } from '@/hooks/useSupervisorKPIs';
import { useSupervisorWaiting } from '@/hooks/useSupervisorWaiting';
import { useSupervisorExceptions } from '@/hooks/useSupervisorExceptions';

import { SupervisorKPIs } from './components/SupervisorKPIs';
import { WaitingPanel } from './components/WaitingPanel';
import { ExceptionsPanel } from './components/ExceptionsPanel';

import './tablero.scss';

export default function VentasTableroPage() {
  const { kpis, loading: loadingKpis, error: errorKpis } = useSupervisorKPIs();
  const { waiting } = useSupervisorWaiting();
  const { exceptions } = useSupervisorExceptions();

  function handleExceptionAction(exc: SupervisorException, which: 'primary' | 'secondary') {
    const actionLabel =
      which === 'primary'
        ? exc.primary_action.label
        : exc.secondary_action?.label;
    if (!actionLabel) return;

    // TODO · Commit 3 · cablear PATCH /api/ventas/exceptions/[id]/resolve
    void Swal.fire({
      title: `Acción: ${actionLabel}`,
      text: `Excepción: ${exc.title}`,
      icon: 'info',
    });
  }

  // Carga inicial · solo bloquea si no hay KPIs aún
  if (loadingKpis && !kpis) {
    return (
      <div className="page-wrapper">
        <div className="content p-0">
          <div className="supervisor-view">
            <div className="supervisor-loading">Cargando tablero…</div>
          </div>
        </div>
      </div>
    );
  }

  // Error de KPIs sin data previa · mostramos y permitimos reintento por polling
  if (errorKpis && !kpis) {
    return (
      <div className="page-wrapper">
        <div className="content p-0">
          <div className="supervisor-view">
            <div className="supervisor-error">
              <h2>No se pudo cargar el tablero</h2>
              <p>{errorKpis}</p>
              <p className="supervisor-error-hint">
                Reintentando automáticamente cada 30s…
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!kpis) return null;

  const autopilotText = `Autopiloto · ${kpis.bot_resolved.count_today} de ${kpis.bot_resolved.count_total_today} ventas sin intervención hoy`;

  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <div className="supervisor-view">
          <header className="supervisor-head">
            <div className="supervisor-title">
              <h1>
                Vista del <em>vendedor</em>
              </h1>
              <p className="supervisor-sub">
                Solo excepciones · sin inbox tradicional
              </p>
            </div>

            <div className="supervisor-auto-indicator" title="Bot activo 24/7">
              <span className="dot-pulse" aria-hidden="true" />
              {autopilotText}
            </div>
          </header>

          <div className="supervisor-body">
            <SupervisorKPIs kpis={kpis} />

            <div className="supervisor-split">
              <WaitingPanel items={waiting} count={kpis.waiting_buyer.count} />
              <ExceptionsPanel
                items={exceptions}
                count={kpis.exceptions.count}
                onAction={handleExceptionAction}
              />
            </div>
          </div>

          <footer className="supervisor-footer">
            Vista secundaria · conversaciones individuales:{' '}
            <Link href={route.bandeja}>ir a {route.bandeja}</Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
