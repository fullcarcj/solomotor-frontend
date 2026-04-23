"use client";

import Link from "next/link";
import type { MenuItemLeaf } from "@/store/menuSlice";
import { normalizeTablerIcon, tablerIconForMenuPath } from "./menuPathIcon";

interface Props {
  item: MenuItemLeaf;
  pathname: string;
}

function leafIcon(item: MenuItemLeaf): string {
  const raw = item.icon?.trim();
  if (raw) {
    return normalizeTablerIcon(raw, tablerIconForMenuPath(item.path || ""));
  }
  return tablerIconForMenuPath(item.path || "");
}

export default function SidebarItem({ item, pathname }: Props) {
  const disabled = item.pendingMigration || item.future;
  const active = !disabled && !!item.path && pathname === item.path;
  const icon = leafIcon(item);

  if (disabled) {
    const cls = item.future
      ? "sidebar-leaf sidebar-leaf--future"
      : "sidebar-leaf sidebar-leaf--pending";
    return (
      <span className={cls} title="Disponible próximamente">
        <span className="sidebar-leaf__icon" aria-hidden>
          <i className="ti ti-lock" />
        </span>
        <span className="sidebar-leaf__label">{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.path || "#"}
      className={`sidebar-leaf${active ? " active" : ""}`}
      title={item.label}
    >
      <span className="sidebar-leaf__icon" aria-hidden>
        <i className={`ti ti-${icon}`} />
      </span>
      <span className="sidebar-leaf__label">{item.label}</span>
    </Link>
  );
}
