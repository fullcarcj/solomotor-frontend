'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AiResponderSubnav() {
  const p = usePathname() || '';
  const isMonitor = p.includes('/ai-responder/monitor');
  const isLogs = p.includes('/ai-responder/logs');
  return (
    <nav className="am-subnav" aria-label="Secciones AI Responder">
      <Link href="/ai-responder/monitor" className={isMonitor ? 'active' : ''}>
        Monitor
      </Link>
      <Link href="/ai-responder/logs" className={isLogs ? 'active' : ''}>
        Logs IA
      </Link>
    </nav>
  );
}
