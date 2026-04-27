"use client";

import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import type { Sale } from "@/types/sales";
import EditCustomerModal from "@/app/(features)/bandeja/[chatId]/components/EditCustomerModal";

function customerMlBuyerSummaryLine(mlBuyerId: number | null | undefined): string {
  if (mlBuyerId != null && Number(mlBuyerId) > 0) {
    return `ID MERCADOLIBRE: ${String(mlBuyerId)}`;
  }
  return "ID MERCADOLIBRE: —";
}

/** PK numérico `sales_orders.id` cuando el listado usa id `so-123`. */
export function salesOrdersInternalId(sale: Sale): number | null {
  const sid = String(sale.id);
  const m = /^so-(\d+)$/i.exec(sid);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function validatePhoneDigits(raw: string): { ok: true; digits: string } | { ok: false; message: string } {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    return {
      ok: false,
      message: "Ingresá entre 10 y 15 dígitos (código de país incluido si aplica).",
    };
  }
  return { ok: true, digits };
}

export function usePedidosCustomerContact(
  sale: Sale,
  onRefetch: () => void | Promise<void>
): { phonesBlock: ReactNode; editClientButton: ReactNode; editModal: ReactNode } {
  const [editOpen, setEditOpen] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cid = sale.customer_id != null && Number(sale.customer_id) > 0 ? Number(sale.customer_id) : null;
  const hasPhone = Boolean(sale.customer_phones_line?.trim());

  const runSync = useCallback(async () => {
    if (!cid) return;
    const soid = salesOrdersInternalId(sale);
    await fetch(`/api/clientes/${encodeURIComponent(String(cid))}/sync-wa-chats`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(soid != null ? { sales_order_id: soid } : {}),
    }).catch(() => {});
  }, [cid, sale]);

  const saveInlinePhone = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!cid) return;
      setErr(null);
      const v = validatePhoneDigits(phoneDraft);
      if (!v.ok) {
        setErr(v.message);
        return;
      }
      setSaving(true);
      try {
        const res = await fetch(`/api/clientes/${encodeURIComponent(String(cid))}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ phone: v.digits }),
        });
        const j = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        if (!res.ok) {
          const msg =
            (j?.message as string) ||
            (j?.error as string) ||
            "No se pudo guardar el teléfono.";
          setErr(msg);
          return;
        }
        await runSync();
        setPhoneDraft("");
        await onRefetch();
      } catch {
        setErr("Error de red al guardar.");
      } finally {
        setSaving(false);
      }
    },
    [cid, phoneDraft, onRefetch, runSync]
  );

  const phonesBlock = (
    <div
      className="c-client-ln c-client-ln--phones c-client-ln--phones-pedidos"
      title={sale.customer_phones_line ?? undefined}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {cid ? (
        hasPhone ? (
          <span className="c-client-phone-row">
            <span className="c-client-phone-txt">{sale.customer_phones_line!.trim()}</span>
          </span>
        ) : (
          <form className="c-client-phone-form" onSubmit={saveInlinePhone}>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="c-client-phone-inp"
              placeholder="Teléfono (celular)"
              value={phoneDraft}
              disabled={saving}
              onChange={(e) => setPhoneDraft(e.target.value)}
              aria-label="Teléfono del cliente"
            />
            <button type="submit" className="c-client-save-btn" disabled={saving}>
              {saving ? "…" : "Guardar"}
            </button>
            {err ? <span className="c-client-phone-err">{err}</span> : null}
          </form>
        )
      ) : (
        <span className="c-client-ln--muted">—</span>
      )}
    </div>
  );

  const editModal =
    cid != null && editOpen ? (
      <EditCustomerModal
        open={editOpen}
        customerId={cid}
        chatId={sale.chat_id != null ? String(sale.chat_id) : null}
        sourceType={null}
        overlayZIndex={2060}
        dialogZIndex={2061}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          void (async () => {
            await runSync();
            await onRefetch();
          })();
        }}
      />
    ) : null;

  const editClientButton =
    cid != null ? (
      <button
        type="button"
        className="c-client-edit-btn"
        disabled={saving}
        onClick={(e) => {
          e.stopPropagation();
          setEditOpen(true);
        }}
      >
        Editar cliente
      </button>
    ) : null;

  return { phonesBlock, editClientButton, editModal };
}

export function PedidosCustomerContactView({
  variant,
  sale,
  custLabel,
  custIni = "?",
  custAv = { bg: "#1e293b", color: "#94a3b8" },
  phonesBlock,
  clientActions,
}: {
  variant: "table" | "card";
  sale: Sale;
  custLabel: string;
  custIni?: string;
  custAv?: { bg: string; color: string };
  phonesBlock: ReactNode;
  clientActions?: ReactNode | null;
}) {
  if (variant === "table") {
    return (
      <div className="c-client">
        <div
          className="c-client-av"
          style={{ background: custAv.bg, color: custAv.color }}
          aria-hidden="true"
        >
          {custIni}
        </div>
        <div className="c-client-info c-client-info--3l">
          <div className="c-client-ln c-client-ln--name">{custLabel}</div>
          {phonesBlock}
          <div className="c-client-ln c-client-ln--ml">
            {customerMlBuyerSummaryLine(sale.customer_primary_ml_buyer_id ?? null)}
          </div>
          {clientActions ? (
            <div className="c-client-actions-wrap">{clientActions}</div>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <div className="ord-card-customer-row ord-card-customer-row--3l ord-card-customer-contact">
      <div className="c-client-ln c-client-ln--name">{custLabel}</div>
      {phonesBlock}
      <div className="c-client-ln c-client-ln--ml">
        {customerMlBuyerSummaryLine(sale.customer_primary_ml_buyer_id ?? null)}
      </div>
      {clientActions ? (
        <div className="c-client-actions-wrap c-client-actions-wrap--card">
          {clientActions}
        </div>
      ) : null}
    </div>
  );
}
