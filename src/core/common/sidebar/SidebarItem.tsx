"use client";

import Link from "next/link";
import type { MenuItemLeaf } from "@/store/menuSlice";

interface Props {
  item: MenuItemLeaf;
  pathname: string;
}

export default function SidebarItem({ item, pathname }: Props) {
  const disabled = item.pendingMigration || item.future;
  const active = !disabled && !!item.path && pathname === item.path;

  if (disabled) {
    const cls = item.future ? "sidebar-leaf sidebar-leaf--future" : "sidebar-leaf sidebar-leaf--pending";
    return (
      <span className={cls} title="Disponible próximamente">
        <span className="sidebar-leaf__dot" />
        {item.label}
      </span>
    );
  }

  return (
    <Link
      href={item.path || "#"}
      className={`sidebar-leaf${active ? " active" : ""}`}
    >
      <span className="sidebar-leaf__dot" />
      {item.label}
    </Link>
  );
}
