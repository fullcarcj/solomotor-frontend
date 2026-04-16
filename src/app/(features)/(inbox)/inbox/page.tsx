import { Suspense } from "react";
import InboxPage from "@/components/inbox/InboxPage";

/** Bandeja omnicanal — layout 4 columnas; datos vía proxy Next → webhook-receiver (`/api/inbox`, etc.). */
export default function InboxRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrapper d-flex align-items-center justify-content-center p-5 text-muted">
          Cargando bandeja…
        </div>
      }
    >
      <InboxPage />
    </Suspense>
  );
}
