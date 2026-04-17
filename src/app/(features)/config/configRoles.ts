/** Roles ERP — orden del select y filtro */
export const ERP_ROLES = [
  "SUPERUSER",
  "ADMIN",
  "SUPERVISOR",
  "VENDEDOR_MOSTRADOR",
  "VENDEDOR_EXTERNO",
  "OPERADOR_DIGITAL",
  "ALMACENISTA",
  "CONTADOR",
] as const;

export const USER_STATUSES = ["ACTIVE", "LOCKED", "INACTIVE"] as const;

export function roleBadgeClass(role: string): string {
  switch (role) {
    case "SUPERUSER": return "bg-danger";
    case "ADMIN": return "bg-primary";
    case "SUPERVISOR": return "bg-info text-dark";
    case "VENDEDOR_MOSTRADOR": return "bg-success";
    case "VENDEDOR_EXTERNO": return "bg-success";
    case "OPERADOR_DIGITAL": return "text-white";
    case "ALMACENISTA": return "bg-warning text-dark";
    case "CONTADOR": return "bg-secondary";
    default: return "bg-secondary";
  }
}

export function roleLabel(role: string): string {
  const m: Record<string, string> = {
    SUPERUSER: "Superuser",
    ADMIN: "Admin",
    SUPERVISOR: "Supervisor",
    VENDEDOR_MOSTRADOR: "Vendedor",
    VENDEDOR_EXTERNO: "V. Externo",
    OPERADOR_DIGITAL: "Operador",
    ALMACENISTA: "Almacenista",
    CONTADOR: "Contador",
  };
  return m[role] ?? role;
}

