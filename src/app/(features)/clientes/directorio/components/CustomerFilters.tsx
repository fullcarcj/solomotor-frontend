import type { CustomerFilters } from "@/types/customers";

const STATUS_OPTIONS = [
  { value: "",         label: "Todos los estados" },
  { value: "active",   label: "Activo"            },
  { value: "lead",     label: "Lead"              },
  { value: "inactive", label: "Inactivo"          },
  { value: "blocked",  label: "Bloqueado"         },
];

interface Props {
  filters:  CustomerFilters;
  onChange: (f: Partial<CustomerFilters>) => void;
}

export default function CustomerFilters({ filters, onChange }: Props) {
  const handleReset = () =>
    onChange({ search: "", status: "", offset: 0 });

  return (
    <div className="card mb-3">
      <div className="card-body py-3">
        <div className="row g-2 align-items-center">
          {/* Búsqueda */}
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="ti ti-search text-muted" />
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre…"
                value={filters.search}
                onChange={(e) =>
                  onChange({ search: e.target.value, offset: 0 })
                }
              />
            </div>
          </div>

          {/* Estado CRM */}
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) =>
                onChange({ status: e.target.value, offset: 0 })
              }
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Limpiar */}
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={handleReset}
            >
              <i className="ti ti-x me-1" />
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
