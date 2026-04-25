"use client";

function parseFilterIds(raw: string | undefined): Set<number> | null {
  if (!raw || raw.trim() === "") return null;
  const ids = new Set(
    raw
      .split(",")
      .map((v) => Number(v.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
  );
  return ids.size > 0 ? ids : null;
}

function isEnabled(): boolean {
  const v = String(process.env.NEXT_PUBLIC_ML_QUESTION_TRACE ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function shouldLogQuestionId(questionId: number | null | undefined): boolean {
  const set = parseFilterIds(process.env.NEXT_PUBLIC_ML_QUESTION_TRACE_IDS);
  if (!set) return true;
  if (!Number.isFinite(questionId as number)) return false;
  return set.has(Number(questionId));
}

export function traceMlQuestionUi(stage: string, payload: Record<string, unknown>): void {
  if (!isEnabled()) return;
  const qidRaw = payload.ml_question_id;
  const qid = qidRaw == null ? null : Number(qidRaw);
  if (!shouldLogQuestionId(qid)) return;
  const line = {
    tag: "ml_question_trace_ui",
    stage,
    at: new Date().toISOString(),
    ...payload,
  };
  try {
    console.log(line);
  } catch {
    /* ignore */
  }
}

