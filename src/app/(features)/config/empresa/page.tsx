"use client";
import { useAppSelector } from "@/store/hooks";
import CompanyForm from "../components/CompanyForm";

export default function ConfigEmpresaPage() {
  const role = useAppSelector(s => s.auth.role);
  const canEdit = role === "SUPERUSER" || role === "ADMIN";

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <h4 className="page-title">Configuración de Empresa</h4>
          <p className="text-muted small mb-0">Datos fiscales y de contacto de la compañía</p>
        </div>
        <CompanyForm canEdit={canEdit} />
      </div>
    </div>
  );
}
