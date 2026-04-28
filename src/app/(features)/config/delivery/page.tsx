"use client";

import { useId, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import ZonesTab from "./components/ZonesTab";
import ProvidersTab from "./components/ProvidersTab";
import ServicesTab from "./components/ServicesTab";

type TabId = "zones" | "providers" | "services";

const TABS: { id: TabId; label: string; description: string }[] = [
  { id: "zones", label: "Tarifas por zona", description: "Precios y cobertura" },
  { id: "providers", label: "Motorizados", description: "Contactos y liquidación preferida" },
  { id: "services", label: "Carreras y liquidación", description: "Historial, asignación y cierre semanal" },
];

export default function ConfigDeliveryPage() {
  const role = useAppSelector((s) => s.auth.role);
  const canEdit = role === "SUPERUSER" || role === "ADMIN";
  const [tab, setTab] = useState<TabId>("zones");
  const navId = useId();

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header mb-3">
          <h4 className="page-title">Delivery</h4>
          <p className="text-muted small mb-0">
            Configuración de zonas, motorizados subcontratados y seguimiento de carreras para liquidación periódica.
          </p>
        </div>

        {!canEdit && (
          <div className="alert alert-info py-2 small mb-3">
            Solo lectura: se requiere rol <strong>ADMIN</strong> o <strong>SUPERUSER</strong> para crear o editar.
          </div>
        )}

        <ul className="nav nav-tabs mb-3" id={navId} role="tablist">
          {TABS.map((t) => (
            <li className="nav-item" key={t.id} role="presentation">
              <button
                type="button"
                className={`nav-link ${tab === t.id ? "active fw-semibold" : ""}`}
                role="tab"
                onClick={() => setTab(t.id)}
                title={t.description}
              >
                {t.label}
              </button>
            </li>
          ))}
        </ul>

        {tab === "zones" && <ZonesTab canEdit={canEdit} />}
        {tab === "providers" && <ProvidersTab canEdit={canEdit} />}
        {tab === "services" && <ServicesTab canEdit={canEdit} />}
      </div>
    </div>
  );
}
