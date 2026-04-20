'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { BotAction, BotActionReviewInput } from '@/types/botActions';
import Swal from 'sweetalert2';

/** Evento interno para invalidar listas de bot-actions tras una revisión. */
const EVT_BOT_REVIEWED = 'solomotor:bot-action-reviewed';

interface UseBotActionsResult {
  data: BotAction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseReviewBotActionResult {
  reviewing: boolean;
  review: (actionId: number, input: BotActionReviewInput) => Promise<boolean>;
}

/** Parsea la respuesta del backend que puede venir como array, {data:[]}, o {items:[]}. */
function parseBotActionsPayload(raw: unknown): BotAction[] {
  if (Array.isArray(raw)) return raw as BotAction[];
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as BotAction[];
    if (Array.isArray(r.items)) return r.items as BotAction[];
  }
  return [];
}

/** Fetch acciones del bot para un chat específico. */
export function useBotActions(chatId: number | string): UseBotActionsResult {
  const [data, setData] = useState<BotAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!chatId) return;
    cancelledRef.current = false;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/sales/chats/${encodeURIComponent(String(chatId))}/bot-actions`,
          { credentials: 'include', cache: 'no-store' }
        );
        if (!res.ok) {
          if (res.status === 403) {
            void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para ver las acciones del bot.', timer: 3000, showConfirmButton: false });
          } else if (res.status >= 500) {
            void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudieron cargar las acciones del bot.', timer: 3000, showConfirmButton: false });
          }
          throw new Error(`HTTP ${res.status}`);
        }
        const raw: unknown = await res.json();
        const parsed = parseBotActionsPayload(raw);
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
    })();

    return () => { cancelledRef.current = true; };
  }, [chatId, tick]);

  // Refetch al recibir evento de revisión completada
  useEffect(() => {
    const handler = () => setTick((t) => t + 1);
    window.addEventListener(EVT_BOT_REVIEWED, handler);
    return () => window.removeEventListener(EVT_BOT_REVIEWED, handler);
  }, []);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { data, isLoading, error, refetch };
}

/** Mutation para revisar una acción del bot. */
export function useReviewBotAction(): UseReviewBotActionResult {
  const [reviewing, setReviewing] = useState(false);

  const review = useCallback(
    async (actionId: number, input: BotActionReviewInput): Promise<boolean> => {
      setReviewing(true);
      try {
        const res = await fetch(
          `/api/sales/bot-actions/${encodeURIComponent(String(actionId))}/review`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
          }
        );
        if (!res.ok) {
          if (res.status === 403) {
            void Swal.fire({ icon: 'error', title: 'Sin permisos', text: 'No tenés permisos para revisar acciones del bot.', timer: 3000, showConfirmButton: false });
          } else if (res.status >= 500) {
            void Swal.fire({ icon: 'error', title: 'Error del servidor', text: 'No se pudo guardar la revisión.', timer: 3000, showConfirmButton: false });
          }
          return false;
        }
        // Invalidar useBotActions + useSupervisorBotActions en todos los componentes montados
        window.dispatchEvent(new CustomEvent(EVT_BOT_REVIEWED));
        return true;
      } catch {
        return false;
      } finally {
        setReviewing(false);
      }
    },
    []
  );

  return { reviewing, review };
}
