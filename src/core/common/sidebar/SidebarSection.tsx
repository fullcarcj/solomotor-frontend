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
  const hasActiveChild = section.items.some((item) => item.path && pathname === item.path);
  const [open, setOpen] = useState(hasActiveChild);
  const icon = section.icon?.trim() || "layout-grid";
  const pending = section.moduleStatus === "pending";

  return (
    <li className="submenu sidebar-section">
      <Link
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className={`sidebar-section__toggle ${open ? "subdrop" : ""}`}
      >
        <span className={`sidebar-section__icon ${open || hasActiveChild ? "sidebar-section__icon--active" : ""}`}>
          <i className={`ti ti-${icon}`} />
        </span>
        <span className="sidebar-section__label">{section.label}</span>
        {pending && (
          <span className="badge bg-secondary sidebar-section__badge">Próximamente</span>
        )}
        <i className={`ti ti-chevron-right sidebar-section__arrow ${open ? "sidebar-section__arrow--open" : ""}`} />
      </Link>
      <ul style={{ display: open ? "block" : "none" }} className="sidebar-section__items">
        {section.items.map((item) => (
          <li key={item.id}>
            <SidebarItem item={item} pathname={pathname} />
          </li>
        ))}
      </ul>
    </li>
  );
}
