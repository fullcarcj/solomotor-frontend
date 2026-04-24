import FeaturesAuthGate from "@/components/FeaturesAuthGate";
import Header from "@/core/common/header/header";
import HorizontalSidebar from "@/core/common/sidebar/horizontalSidebar";
import Sidebar from "@/core/common/sidebar/sidebar";
import ThemeSettings from "@/core/common/sidebar/themeSettings";
import TwoColumnSidebar from "@/core/common/sidebar/two-column";
import FeaturesShell from "./FeaturesShell";
import FeaturesWithInboxLive from "./FeaturesWithInboxLive";
import "./dashboard/sm-dashboard-shell.scss";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeaturesAuthGate>
      <FeaturesShell>
        <FeaturesWithInboxLive>
          <div className="main-wrapper">
            <Header />
            <Sidebar />
            <HorizontalSidebar />
            <TwoColumnSidebar />
            <ThemeSettings />
            {children}
          </div>
        </FeaturesWithInboxLive>
      </FeaturesShell>
    </FeaturesAuthGate>
  );
}
