'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Exception, ExceptionCreateInput, ExceptionResolveInput } from '@/types/exceptions';
import Swal from 'sweetalert2';

const POLL_INTERVAL_MS = 30_000;

/**
 * Evento interno para invalidar listas de excepciones tras mutación (resolve/create).
 * TODO Sprint 3: reemplazar polling por evento SSE cuando backend emita
 * exception_created / exception_resolved (ver ADR-009 deuda técnica D7).
 */
const EVT_EXCEPTION_MUTATED = 'solomotor:exception-mutated';

interface UseExceptionsOptions {
  status?: 'OPEN' | 'RESOLVED' | '';
  chatId?: number | string | null;
}

interface UseExceptionsResult {
  data: Exception[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseMutationResult<TInput> {
  loading: boolean;
  mutate: (input: TInput) => Promise<boolean>;
}

/** Parsea la respuesta del backend: array plano, {data:[]}, o {items:[]}. */
function parseExceptionsPayload(raw: unknown): Exception[] {
  if (Array.isArray(raw)) return raw as Exception[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as Exception[];
    if (Array.isArray(r.items)) return r.items as Exception[];
  }
  return [];
}

/** Listado de excepciones con filtros opcionales. Polling 30s. */
export function useExceptions({ status = '', chatId }: UseExceptionsOptions = {}): UseExceptionsResult {
  const [data, setData] = useState<Exception[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const [tick, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      if (chatId != null) qs.set('chat_id', String(chatId));

      const res = await fetch(
        `/api/sales/exceptions${qs.toString() ? `?${qs.toString()}` : ''}`,
        { credentials: 'include', cache: 'no-store' }
      );

      if (!res.ok) {
        if (res.status === 403) {
          void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para ver las excepciones.', timer: 3000, showConfirmButton: false });
        } else if (res.status >= 500) {
          void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudieron cargar las excepciones.', timer: 3000, showConfirmButton: false });
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const raw: unknown = await res.json();
      const parsed = parseExceptionsPayload(raw);
      if (!cancelledRef.current) {
        setData(parsed);
        setError(null);
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (!cancelledRef.current) setIsLoading(false);
    }
  }, [status, chatId]);

  useEffect(() => {
    cancelledRef.current = false;
    setIsLoading(true);
    void fetchData();

    // Polling 30s · pausado cuando la pestaña está en segundo plano
    // TODO Sprint 3: reemplazar por evento SSE exception_created / exception_resolved (ADR-009 D7)
    const iv = setInterval(() => {
      if (document.visibilityState !== 'hidden') void fetchData();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void fetchData();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelledRef.current = true;
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchData]);

  // Refetch inmediato al recibir evento de mutación
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(EVT_EXCEPTION_MUTATED, handler);
    return () => window.removeEventListener(EVT_EXCEPTION_MUTATED, handler);
  }, []);

  // tick fuerza re-render del useEffect de fetchData
  useEffect(() => {
    if (tick > 0) void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}

/** Mutation para resolver una excepción. */
export function useResolveException(): UseMutationResult<{ id: number } & ExceptionResolveInput> {
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (input: { id: number } & ExceptionResolveInput): Promise<boolean> => {
      setLoading(true);
      try {
        const { id, ...body } = input;
        const res = await fetch(
          `/api/sales/exceptions/${encodeURIComponent(String(id))}/resolve`,
          {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );
        if (!res.ok) {
          if (res.status === 403) {
            void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para resolver excepciones.', timer: 3000, showConfirmButton: false });
          } else if (res.status === 404) {
            void Swal.fire({ icon: 'warning', title: 'No encontrada', text: 'La excepción no existe o ya fue resuelta.', timer: 3000, showConfirmButton: false });
          } else if (res.status >= 500) {
            void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudo resolver la excepción.', timer: 3000, showConfirmButton: false });
          }
          return false;
        }
        window.dispatchEvent(new CustomEvent(EVT_EXCEPTION_MUTATED));
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, mutate };
}

/** Mutation para crear una excepción manual. */
export function useCreateException(): UseMutationResult<ExceptionCreateInput> {
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(
    async (input: ExceptionCreateInput): Promise<boolean> => {
      setLoading(true);
      try {
        const res = await fetch('/api/sales/exceptions', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          if (res.status === 403) {
            void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para crear excepciones.', timer: 3000, showConfirmButton: false });
          } else if (res.status === 409) {
            const text = await res.text().catch(() => '');
            void Swal.fire({ icon: 'warning', title: 'Conflicto', text: text || 'Ya existe una excepción activa para este chat.', timer: 4000, showConfirmButton: false });
          } else if (res.status >= 500) {
            void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudo crear la excepción.', timer: 3000, showConfirmButton: false });
          }
          return false;
        }
        window.dispatchEvent(new CustomEvent(EVT_EXCEPTION_MUTATED));
        return true;
      } catch {
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, mutate };
}
