'use client';

import { useCallback } from 'react';
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

// Acciones primarias que disparan resolve real en backend.
// El resto (CHAT, VER FOTO, LLAMAR, EDITAR) solo abre un alert informativo
// hasta que aparezca necesidad concreta (deuda priorizable post-Paso 5).
const RESOLVE_LABELS = new Set(['REVISAR', 'RESOLVER', 'APROBAR']);

export default function VentasTableroPage() {
  const { kpis, loading: loadingKpis, error: errorKpis, refetch: refetchKpis } =
    useSupervisorKPIs();
  const { waiting } = useSupervisorWaiting();
  const { exceptions, refetch: refetchExceptions } = useSupervisorExceptions();

  const handleExceptionAction = useCallback(
    async (exc: SupervisorException, which: 'primary' | 'secondary') => {
      const action = which === 'primary' ? exc.primary_action : exc.secondary_action;
      const label = action?.label;
      if (!label) return;

      // Acción informativa · no hay backend aún para CHAT/VER FOTO/LLAMAR/EDITAR
      if (which !== 'primary' || !RESOLVE_LABELS.has(label)) {
        void Swal.fire({
          title: `Acción: ${label}`,
          text: exc.title,
          icon: 'info',
        });
        return;
      }

      // Flujo resolve · PATCH real a backend con nota opcional
      const confirmed = await Swal.fire({
        title: `${label} excepción`,
        html:
          `<div style="text-align:left"><p><strong>${exc.title}</strong></p>` +
          `<p style="font-size:12px;color:#6e6f64">${exc.detail}</p></div>`,
        input: 'textarea',
        inputLabel: 'Nota de resolución (opcional)',
        inputPlaceholder: 'Ej: pago verificado contra extracto bancario…',
        showCancelButton: true,
        confirmButtonText: label,
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
      });
      if (!confirmed.isConfirmed) return;

      const note =
        typeof confirmed.value === 'string' && confirmed.value.trim()
          ? confirmed.value.trim()
          : null;

      try {
        const res = await fetch(
          `/api/ventas/exceptions/${encodeURIComponent(String(exc.id))}/resolve`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution_note: note }),
          }
        );
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(text || `HTTP ${res.status}`);
        }
        await Promise.all([refetchExceptions(), refetchKpis()]);
        void Swal.fire({
          icon: 'success',
          title: 'Excepción resuelta',
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (err) {
        void Swal.fire({
          icon: 'error',
          title: 'No se pudo resolver',
          text: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [refetchExceptions, refetchKpis]
  );

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
