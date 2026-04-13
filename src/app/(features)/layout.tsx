import Header from "@/core/common/header/header";
import HorizontalSidebar from "@/core/common/sidebar/horizontalSidebar";
import Sidebar from "@/core/common/sidebar/sidebar";
import ThemeSettings from "@/core/common/sidebar/themeSettings";
import TwoColumnSidebar from "@/core/common/sidebar/two-column";

export default function PageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="main-wrapper">
      <Header />
      <Sidebar />
      <HorizontalSidebar />
      <TwoColumnSidebar />
      <ThemeSettings />
      {children}
    </div>
  );
}
