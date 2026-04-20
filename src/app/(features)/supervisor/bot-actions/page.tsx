import BotActionsReviewQueue from "@/components/supervisor/BotActionsReviewQueue";
import "@/app/(features)/supervisor/supervisor-theme.scss";

export const metadata = { title: "Cola de revisión bot · Supervisor" };

export default function SupervisorBotActionsPage() {
  return (
    <div className="page-wrapper">
      <div className="content p-0">
        <BotActionsReviewQueue />
      </div>
    </div>
  );
}
