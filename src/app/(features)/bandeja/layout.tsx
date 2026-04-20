import type { ReactNode } from "react";
import "./bandeja-theme.scss";
import BandejaShell from "./BandejaShell";

export default function BandejaLayout({ children }: { children: ReactNode }) {
  return <BandejaShell>{children}</BandejaShell>;
}
