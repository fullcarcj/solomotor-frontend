import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FB Marketplace | ERP",
  description: "Conversaciones de Facebook Marketplace Personal (extensión Chrome fbmp_edge)",
};

export default function FbmpEdgeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
