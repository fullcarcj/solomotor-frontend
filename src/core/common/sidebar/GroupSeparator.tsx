"use client";

interface Props {
  label: string;
}

/** Separador entre grupos del menú dinámico (solo lectura). */
export default function GroupSeparator({ label }: Props) {
  return (
    <li
      className="list-unstyled border-0 bg-transparent py-0"
      style={{ listStyle: "none" }}
    >
      <span className="sidebar-group-sep">{label}</span>
    </li>
  );
}
