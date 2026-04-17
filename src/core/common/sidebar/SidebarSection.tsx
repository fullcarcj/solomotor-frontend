"use client";

import Link from "next/link";
import { useState } from "react";
import type { MenuSection } from "@/store/menuSlice";
import SidebarItem from "./SidebarItem";

interface Props {
  section: MenuSection;
  pathname: string;
}

export default function SidebarSection({ section, pathname }: Props) {
  const [open, setOpen] = useState(false);
  const icon = section.icon?.trim() || "layout-grid";
  const pending = section.moduleStatus === "pending";

  return (
    <li className="submenu">
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className={open ? "subdrop" : ""}
      >
        <i className={`ti ti-${icon} me-2`} />
        <span className="custom-active-span">{section.label}</span>
        {pending && (
          <span className="badge bg-secondary ms-1" style={{ fontSize: 9 }}>
            Próximamente
          </span>
        )}
        <span className="menu-arrow" />
      </Link>
      <ul style={{ display: open ? "block" : "none" }}>
        {section.items.map((item) => (
          <li key={item.id}>
            <SidebarItem item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
    </li>
  );
}
