"use client";

import { useEffect, useState } from "react";
import { Table, Select, Modal, Input, Badge, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import type { Exception, ExceptionCode } from "@/types/exceptions";
import { EXCEPTION_CODE_LABELS, EXCEPTION_CODE_COLORS } from "@/types/exceptions";
import { useExceptions, useResolveException } from "@/hooks/useExceptions";
import { inboxStream } from "@/lib/realtime/inboxStream";
import Swal from "sweetalert2";

const { RangePicker } = DatePicker;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

const CODE_OPTIONS = Object.entries(EXCEPTION_CODE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

/* ── Modal de resolución ──────────────────────────────────────── */

interface ResolveModalProps {
  exc: Exception | null;
  onClose: () => void;
  onDone: () => void;
}

function ResolveModal({ exc, onClose, onDone }: ResolveModalProps) {
  const { loading, mutate: resolve } = useResolveException();
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!exc) return;
    const ok = await resolve({ id: exc.id, resolution_notes: notes });
    if (ok) {
      onDone();
      onClose();
      void Swal.fire({
        icon: "success",
        title: "Excepción resuelta",
        timer: 1800,
        showConfirmButton: false,
        background: "var(--mu-panel, #1a1f2e)",
        color: "var(--mu-ink, #e2e8f0)",
      });
    }
  };

  return (
    <Modal
      open={!!exc}
      title={
        <span>
          <i className="ti ti-clipboard-check" style={{ marginRight: 8, color: "#22c55e" }} />
          Resolver excepción #{exc?.id}
        </span>
      }
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Confirmar resolución"
      cancelText="Cancelar"
      confirmLoading={loading}
      okButtonProps={{ style: { background: "#22c55e", borderColor: "#22c55e" } }}
    >
      {exc && (
        <>
          <div style={{ marginBottom: 8, fontSize: 12 }}>
            <strong>Chat:</strong> #{exc.chat_id}{"  ·  "}
            <strong>Código:</strong> <code>{exc.code}</code>
          </div>
          <div style={{ marginBottom: 12, fontSize: 12, color: "#9aa4b8" }}>{exc.reason}</div>
          <Input.TextArea
            rows={4}
            placeholder="Describe cómo se resolvió (requerido)…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            showCount
          />
        </>
      )}
    </Modal>
  );
}

/* ── Panel principal ──────────────────────────────────────────── */

export default function SupervisorExceptionsPanel() {
  const { data: allData, isLoading, refetch } = useExceptions({ status: "OPEN" });

  // Suscripción SSE: refetch ante cambios de estado de chat en la bandeja.
  useEffect(() => {
    const unsub = inboxStream.subscribe((event) => {
      if (["chat_taken", "chat_released", "chat_attended", "chat_reopened"].includes(event)) {
        refetch();
      }
    });
    return unsub;
  }, [refetch]);

  const [filterCode, setFilterCode] = useState<ExceptionCode | "">("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [resolveTarget, setResolveTarget] = useState<Exception | null>(null);

  const filtered = filterCode
    ? allData.filter((e) => e.code === filterCode)
    : allData;

  const openCount = filtered.length;

  const columns: ColumnsType<Exception> = [
    {
      title: "Chat / ID",
      dataIndex: "id",
      width: 90,
      render: (_: unknown, row: Exception) => (
        <div>
          <Link
            href={`/bandeja?chat_id=${row.chat_id}`}
            style={{ fontFamily: "monospace", fontSize: 12 }}
          >
            #{row.chat_id}
          </Link>
          <div style={{ fontSize: 10, color: "#5e6a82" }}>exc #{row.id}</div>
        </div>
      ),
    },
    {
      title: "Excepción",
      dataIndex: "code",
      render: (code: ExceptionCode, row: Exception) => {
        const label = EXCEPTION_CODE_LABELS[code] ?? code;
        const color = EXCEPTION_CODE_COLORS[code] ?? "#ef4444";
        return (
          <div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 4,
                background: `${color}22`,
                border: `1px solid ${color}55`,
                color,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <i className="ti ti-alert-triangle" style={{ fontSize: 11 }} />
              {label}
            </span>
            <div style={{ fontSize: 11, color: "#9aa4b8", marginTop: 4, maxWidth: 280 }}>
              {row.reason.length > 60 ? `${row.reason.slice(0, 58)}…` : row.reason}
            </div>
          </div>
        );
      },
    },
    {
      title: "Vendedor responsable",
      dataIndex: "created_by",
      width: 160,
      render: (userId: number | null) => (
        <span style={{ fontSize: 12, color: userId ? "#e2e8f0" : "#5e6a82" }}>
          {userId ? `Usuario #${userId}` : "Sistema / bot"}
        </span>
      ),
    },
    {
      title: "Creada",
      dataIndex: "created_at",
      width: 110,
      render: (iso: string) => (
        <span style={{ fontSize: 11 }} title={new Date(iso).toLocaleString("es-VE")}>
          {timeAgo(iso)}
        </span>
      ),
    },
    {
      title: "Acciones",
      width: 160,
      render: (_: unknown, row: Exception) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="sup-review-btn"
            onClick={() => setResolveTarget(row)}
          >
            Resolver
          </button>
          {/* Botón "Escalar" removido en Fase 2 — decisión 6A: sin endpoint backend definido. */}
        </div>
      ),
    },
  ];

  return (
    <div className="sup-queue">
      <div className="sup-queue-header">
        <div className="sup-queue-title">
          <i className="ti ti-alert-triangle me-2" style={{ color: "#ef4444" }} />
          Excepciones abiertas
          <Badge
            count={openCount}
            style={{ background: "#ef4444", marginLeft: 8, fontSize: 11 }}
          />
          {/* NEW */}
          <span className="sup-queue-new-tag">NEW</span>
        </div>
        <button type="button" className="bat-refresh-btn" onClick={refetch}>
          <i className="ti ti-refresh" /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="sup-filters">
        <Select
          style={{ width: 220 }}
          placeholder="Filtrar por código…"
          allowClear
          options={CODE_OPTIONS}
          value={filterCode || undefined}
          onChange={(v) => setFilterCode(v ?? "")}
          size="small"
        />
        <RangePicker
          size="small"
          style={{ width: 240 }}
          placeholder={["Desde", "Hasta"]}
          onChange={(_, strs) =>
            setDateRange(strs[0] && strs[1] ? [strs[0], strs[1]] : null)
          }
        />
      </div>

      <Table<Exception>
        columns={columns}
        dataSource={filtered}
        loading={isLoading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: "Sin excepciones abiertas con estos filtros" }}
      />

      <ResolveModal
        exc={resolveTarget}
        onClose={() => setResolveTarget(null)}
        onDone={refetch}
      />
    </div>
  );
}
