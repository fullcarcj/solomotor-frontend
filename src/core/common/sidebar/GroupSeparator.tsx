"use client";

interface Props {
  label: string;
}

/** Separador entre grupos del menú dinámico. */
export default function GroupSeparator({ label }: Props) {
  return (
    <li className="sidebar-group-item">
      <span className="sidebar-group-sep">
        <span className="sidebar-group-sep__text">{label}</span>
      </span>
    </li>
  );
}
