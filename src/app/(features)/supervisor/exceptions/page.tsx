import SupervisorExceptionsPanel from "@/components/supervisor/SupervisorExceptionsPanel";
import "@/app/(features)/supervisor/supervisor-theme.scss";

export const metadata = { title: "Excepciones · Supervisor" };

export default function SupervisorExceptionsPage() {
  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <SupervisorExceptionsPanel />
      </div>
    </div>
  );
}
