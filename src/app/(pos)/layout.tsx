
import PosHeader from "@/components/pos-module/pos/posHeader";
import ThemeSettings from "@/core/common/sidebar/themeSettings";

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <PosHeader />
      <ThemeSettings />
      {children}
    </>
  );
}
