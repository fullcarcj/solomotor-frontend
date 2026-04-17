export interface Company {
  id:                number;
  name:              string;
  rif:               string | null;
  address:           string | null;
  phone:             string | null;
  email:             string | null;
  logo_url:          string | null;
  city:              string | null;
  country:           string | null;
  fiscal_year_start: string | null;
}

export interface Branch {
  id:            number;
  company_id:    number;
  name:          string;
  code:          string;
  is_active:     boolean;
  is_principal:  boolean;
  created_at:      string;
}

export interface ErpUser {
  id:              number;
  username:        string;
  email:           string | null;
  full_name:       string | null;
  role:            string;
  status:          string;
  last_login_at:   string | null;
  failed_attempts: number;
  created_at:      string;
}

export interface Integration {
  configured: boolean;
  status:     "connected" | "not_configured";
}

export interface Integrations {
  whatsapp: Integration & {
    phone_number: string | null;
  };
  mercadolibre: Integration & {
    accounts_count: number;
    last_connected: string | null;
  };
  banesco: Integration & {
    last_sync_at: string | null;
  };
}

/** Respuesta flexible del backend para permisos por rol */
export interface RolePermissionRow {
  role:         string;
  modules?:    string[];
  actions?:    string[];
  permissions?: string[] | Record<string, unknown>;
  [key: string]: unknown;
}
