export interface BankStatement {
  id:                     number | string;
  bank_account_id:        number | string;
  tx_date:                string;
  reference_number:       string;
  description:            string;
  tx_type:                "DEBIT" | "CREDIT";
  amount:                 number | string;
  balance_after:          number | string;
  payment_type:           string;
  reconciliation_status:  string;
}

export interface Comprobante {
  id:                    number | string;
  firebase_url:          string;
  extracted_reference:   string | null;
  extracted_amount_bs:   number | string | null;
  extracted_date:        string | null;
  extracted_bank:        string | null;
  reconciliation_status: string;
  created_at:            string;
  customer_name:         string | null;
  customer_phone:        string | null;
  external_order_id:     string | null;
}

export interface FinanceSummary {
  period: string;
  cashflow: {
    ingresos_bs:       number | string;
    egresos_bs:        number | string;
    balance_bs:        number | string;
    total_movimientos: number;
  };
  pending_approvals:   number;
  unjustified_debits:  number;
  igtf: {
    collected_usd:     number | string;
    transactions:      number;
    rate_pct:          number;
  };
  comprobantes_wa: {
    total_attempts:    number;
    matched:           number;
    no_match:          number;
    extraction_failed: number;
    match_rate_pct:    number | string;
  };
}

export interface IgtfDeclaration {
  year:           number;
  month:          number;
  status:         "open" | "closed";
  total_igtf_usd: number | string;
  closed_at:      string | null;
}

export interface ReconciliationStatus {
  by_status: Array<{
    status:    string;
    count:     number | string;
    total_bs:  number | string;
  }>;
  worker_24h: Array<{
    action:   string;
    count:    number | string;
    last_run: string;
  }>;
  total_statements: number;
  unmatched_count:  number;
  unmatched_bs:     number | string;
}

export interface FinanceCategory {
  id:   number | string;
  name: string;
  type?: string;
}

export type FinancePeriod = "today" | "week" | "month" | "year";
