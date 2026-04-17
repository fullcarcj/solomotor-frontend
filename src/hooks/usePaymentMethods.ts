"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaymentMethodOption } from "@/types/pos";

function parseMethods(json: unknown): PaymentMethodOption[] {
  let arr: unknown[] = [];
  if (Array.isArray(json)) arr = json;
  else if (json && typeof json === "object") {
    const o = json as Record<string, unknown>;
    const data = o.data ?? o;
    if (Array.isArray(data)) arr = data;
    else if (data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      const inner =
        d.payment_methods ??
        d.methods ??
        d.items ??
        d.rows;
      if (Array.isArray(inner)) arr = inner;
    }
  }
  return arr.map((x) => {
    const r = x as Record<string, unknown>;
    const code = String(
      r.code ?? r.payment_method_code ?? r.id ?? ""
    ).trim();
    const label = String(
      r.label ?? r.name ?? r.description ?? r.payment_method_label ?? code
    ).trim();
    return {
      code,
      label: label || code,
      applies_igtf: Boolean(r.applies_igtf ?? r.appliesIgtf),
    };
  }).filter((m) => m.code.length > 0);
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/payment-methods", {
        credentials: "include",
        cache: "no-store",
      });
      const raw: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMethods([]);
        return;
      }
      setMethods(parseMethods(raw));
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { methods, loading, refetch: load };
}
