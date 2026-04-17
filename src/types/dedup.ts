/** Candidatos a fusión CRM — GET /api/dedup/candidates */

export interface DedupCustomerMini {
  id: number;
  full_name: string;
  phone: string | null;
  id_type: string | null;
  id_number: string | null;
}

export type DedupCandidateStatus =
  | "pending"
  | "auto_approved"
  | "approved"
  | "rejected";

export interface DedupCandidateListItem {
  id: number;
  company_id: number;
  customer_a: DedupCustomerMini;
  customer_b: DedupCustomerMini;
  score: number;
  score_breakdown: Record<string, number> | null;
  status: DedupCandidateStatus | string;
  created_at: string;
  updated_at?: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
}

export interface DedupCandidatesResponse {
  candidates: DedupCandidateListItem[];
  total: number;
}

export interface DedupMergeLogRow {
  snapshot_kept: unknown;
  snapshot_dropped: unknown;
  rows_affected: unknown;
  merged_at: string;
  triggered_by: string;
  score: number | null;
  score_breakdown: unknown;
}

/** Entrada de GET /api/dedup/merge-log — historial de fusiones aplicadas */
export interface MergeLogEntry {
  merged_at: string;
  kept_id: number;
  kept_name: string | null;
  dropped_id: number;
  triggered_by: string;
  score: number | null;
  snapshot_kept: Record<string, unknown> | null;
  snapshot_dropped: Record<string, unknown> | null;
  rows_affected: Record<string, number> | null;
}

export interface DedupMergeLogResponse {
  log: MergeLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface DedupCandidateDetail extends DedupCandidateListItem {
  merge_log: DedupMergeLogRow[] | null;
}
