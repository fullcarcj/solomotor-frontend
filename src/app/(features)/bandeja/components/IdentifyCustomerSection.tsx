'use client';

import { useEffect, useState } from 'react';
import { notification, Button, Alert, Spin } from 'antd';

interface PhoneMatch {
  customer_id: number;
  name: string;
  phone: string;
}

interface MlBuyerMatch {
  customer_id: number;
  name: string;
  ml_user_id: string;
}

interface IdentityCandidates {
  phoneMatches:   PhoneMatch[];
  mlBuyerMatches: MlBuyerMatch[];
  keywordHint:    string | null;
}

/**
 * Normaliza el payload del backend (acepta camelCase y snake_case) y aplica
 * defaults seguros si falta alguna clave — evita crashear el panel cuando el
 * backend todavía no expone el endpoint completo.
 */
function normalizeCandidates(raw: unknown): IdentityCandidates {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const phone = (obj.phoneMatches ?? obj.phone_matches);
  const ml    = (obj.mlBuyerMatches ?? obj.ml_buyer_matches);
  const hint  = (obj.keywordHint ?? obj.keyword_hint);
  return {
    phoneMatches:   Array.isArray(phone) ? (phone as PhoneMatch[]) : [],
    mlBuyerMatches: Array.isArray(ml)    ? (ml    as MlBuyerMatch[]) : [],
    keywordHint:    typeof hint === 'string' && hint.length > 0 ? hint : null,
  };
}

interface Props {
  chatId:   string | number;
  onLinked: () => void;
}

export function IdentifyCustomerSection({ chatId, onLinked }: Props) {
  const [candidates, setCandidates] = useState<IdentityCandidates | null>(null);
  const [loading, setLoading]       = useState(true);
  const [linking, setLinking]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/inbox/${encodeURIComponent(String(chatId))}/identity-candidates`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
        return r.json();
      })
      .then((data: unknown) => {
        if (!cancelled) {
          setCandidates(normalizeCandidates(data));
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setCandidates(normalizeCandidates(null));
          setLoading(false);
          notification.error({
            message: 'Error al buscar candidatos',
            description: err instanceof Error ? err.message : String(err),
          });
        }
      });
    return () => { cancelled = true; };
  }, [chatId]);

  async function handleLink(linkType: 'phone' | 'ml_buyer', customerId: number) {
    setLinking(true);
    try {
      const res = await fetch(
        `/api/inbox/${encodeURIComponent(String(chatId))}/link-customer`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link_type: linkType, customer_id: customerId }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      notification.success({ message: 'Cliente vinculado correctamente' });
      onLinked();
    } catch (err: unknown) {
      notification.error({
        message: 'No se pudo vincular el cliente',
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLinking(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-3">
        <Spin size="small" />
        <p className="text-muted small mt-2 mb-0">Buscando coincidencias…</p>
      </div>
    );
  }

  if (!candidates) return null;

  const hasAny =
    candidates.phoneMatches.length > 0 ||
    candidates.mlBuyerMatches.length > 0 ||
    !!candidates.keywordHint;

  if (!hasAny) {
    return (
      <Alert
        type="info"
        showIcon
        message="Sin coincidencias automáticas"
        description="Buscar manualmente en el listado de clientes para vincular."
        style={{ marginTop: 8 }}
      />
    );
  }

  return (
    <div className="identify-customer-section">
      <p className="text-muted small mb-2">Posibles coincidencias encontradas:</p>

      {candidates.phoneMatches.map(c => (
        <Alert
          key={`phone-${c.customer_id}`}
          type="success"
          showIcon
          message={`Por teléfono: ${c.name}`}
          description={c.phone}
          style={{ marginBottom: 8 }}
          action={
            <Button
              size="small"
              type="primary"
              loading={linking}
              onClick={() => handleLink('phone', c.customer_id)}
            >
              Vincular
            </Button>
          }
        />
      ))}

      {candidates.mlBuyerMatches.map(c => (
        <Alert
          key={`ml-${c.customer_id}`}
          type="success"
          showIcon
          message={`Por comprador ML: ${c.name}`}
          description={`ML User: ${c.ml_user_id}`}
          style={{ marginBottom: 8 }}
          action={
            <Button
              size="small"
              type="primary"
              loading={linking}
              onClick={() => handleLink('ml_buyer', c.customer_id)}
            >
              Vincular
            </Button>
          }
        />
      ))}

      {candidates.keywordHint && (
        <Alert
          type="warning"
          showIcon
          message="Pista por palabra clave"
          description={candidates.keywordHint}
        />
      )}
    </div>
  );
}
