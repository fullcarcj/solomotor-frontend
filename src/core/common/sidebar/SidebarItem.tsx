"use client";

import Link from "next/link";
import type { MenuItemLeaf } from "@/store/menuSlice";

interface Props {
  item: MenuItemLeaf;
  pathname: string;
}

export default function SidebarItem({ item, pathname }: Props) {
  const disabled = item.pendingMigration || item.future;
  const active = !disabled && item.path && pathname === item.path;
  const disabledClass = disabled
    ? item.future
      ? "sidebar-item--future"
      : "sidebar-item--pending"
    : "";

  if (disabled) {
    return (
      <span className={disabledClass} title="Disponible próximamente">
        {item.label}
      </span>
    );
  }

  return (
    <Link href={item.path || "#"} className={active ? "active" : ""}>
      {item.label}
    </Link>
  );
}
