"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { all_routes } from "@/data/all_routes";

const TABS = [
  { href: all_routes.reportesVentas, label: "Ventas" },
  { href: all_routes.reportesInventario, label: "Inventario" },
  { href: all_routes.reportesClientes, label: "Clientes" },
  { href: all_routes.reportesProductos, label: "Productos" },
] as const;

export default function ReportsTabs() {
  const pathname = usePathname();
  return (
    <ul className="nav nav-tabs mb-4 flex-wrap border-bottom-0">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <li className="nav-item" key={t.href}>
            <Link
              href={t.href}
              className={`nav-link ${active ? "active fw-semibold" : "text-muted"}`}
              aria-current={active ? "page" : undefined}
            >
              {t.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
