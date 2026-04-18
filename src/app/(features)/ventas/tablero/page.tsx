'use client';

import { useState } from 'react';
import Link from 'next/link';
import Swal from 'sweetalert2';

import { all_routes as route } from '@/data/all_routes';
import type { SupervisorException } from '@/types/supervisor';

import { SupervisorKPIs } from './components/SupervisorKPIs';
import { WaitingPanel } from './components/WaitingPanel';
import { ExceptionsPanel } from './components/ExceptionsPanel';
import { MOCK_KPIS, MOCK_WAITING, MOCK_EXCEPTIONS } from './mock-data';

import './tablero.scss';

export default function VentasTableroPage() {
  // TODO Paso 5 · reemplazar mocks con fetch real
  //   GET /api/sales/supervisor/kpis
  //   GET /api/sales/supervisor/waiting
  //   GET /api/sales/supervisor/exceptions
  const [kpis] = useState(MOCK_KPIS);
  const [waiting] = useState(MOCK_WAITING);
  const [exceptions] = useState(MOCK_EXCEPTIONS);

  function handleExceptionAction(exc: SupervisorException, which: 'primary' | 'secondary') {
    const actionLabel =
      which === 'primary'
        ? exc.primary_action.label
        : exc.secondary_action?.label;
    if (!actionLabel) return;

    // TODO Paso 5 · integrar con endpoints reales (resolve, escalation, etc.)
    void Swal.fire({
      title: `Acción: ${actionLabel}`,
      text: `Excepción: ${exc.title}`,
      icon: 'info',
    });
  }

  return (
    <div className="supervisor-view">
      <header className="supervisor-head">
        <div className="supervisor-title">
          <h1>Tablero de Supervisión</h1>
          <p className="supervisor-sub">
            Vista del vendedor · solo excepciones · sin inbox tradicional
          </p>
        </div>

        <div className="supervisor-auto-indicator">
          <span className="dot-pulse" />
          Bot activo · 24/7
        </div>
      </header>

      <SupervisorKPIs kpis={kpis} />

      <div className="supervisor-split">
        <WaitingPanel items={waiting} count={kpis.waiting_buyer.count} />
        <ExceptionsPanel
          items={exceptions}
          count={kpis.exceptions.count}
          onAction={handleExceptionAction}
        />
      </div>

      <footer className="supervisor-footer">
        <p>
          Vista secundaria · conversaciones individuales:{' '}
          <Link href={route.bandeja}>ir a {route.bandeja}</Link>
        </p>
      </footer>
    </div>
  );
}
