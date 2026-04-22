import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.WEBHOOK_RECEIVER_BASE_URL ??
  "http://localhost:3001";

/**
 * BFF proxy → backend PATCH /api/crm/customers/:id
 * Actualización parcial del cliente CRM.
 * Campos permitidos: full_name, id_type, id_number, phone, phone_2, email, crm_status,
 * customer_type, address, city, notes, tags, is_active.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const res = await fetch(`${base}/api/crm/customers/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}

/**
 * BFF proxy → backend GET /api/crm/customers/:id
 * Obtiene el detalle del cliente para pre-poblar el formulario de edición.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = BACKEND_URL.replace(/\/+$/, "");
  const cookieHeader = req.headers.get("cookie") ?? "";
  const authHeader = req.headers.get("authorization") ?? "";

  const res = await fetch(`${base}/api/crm/customers/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = { error: { message: "Respuesta no JSON del servidor" } };
    }
  }
  return NextResponse.json(data, { status: res.status });
}
