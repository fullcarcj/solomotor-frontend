import type { Bucket } from "@google-cloud/storage";
import admin from "firebase-admin";

let cached: Bucket | null = null;

/**
 * Bucket de Firebase Storage con credencial de servicio (solo servidor).
 * Env: `FIREBASE_SERVICE_ACCOUNT_JSON` (JSON completo en una línea) y opcionalmente `FIREBASE_STORAGE_BUCKET`.
 */
export function getFirebaseStorageBucket(): Bucket {
  if (cached) return cached;

  const json = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (!json) {
    throw new Error("FALTA_FIREBASE_SERVICE_ACCOUNT_JSON");
  }

  if (!admin.apps.length) {
    const credJson = JSON.parse(json) as { project_id?: string };
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
      (credJson.project_id ? `${credJson.project_id}.appspot.com` : "");

    admin.initializeApp({
      credential: admin.credential.cert(credJson as admin.ServiceAccount),
      ...(bucketName ? { storageBucket: bucketName } : {}),
    });
  }

  const explicit = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  cached = explicit
    ? admin.storage().bucket(explicit)
    : admin.storage().bucket();

  return cached;
}
