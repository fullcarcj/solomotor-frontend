'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AiResponderSubnav() {
  const p = usePathname() || '';
  const isMonitor = p.includes('/ai-responder/monitor');
  const isLogs = p.includes('/ai-responder/logs');
  const isConfig = p.includes('/ai-responder/configuracion');
  return (
    <nav className="am-subnav" aria-label="Secciones AI Responder">
      <Link href="/ai-responder/monitor" className={isMonitor ? 'active' : ''}>
        Monitor
      </Link>
      <Link href="/ai-responder/logs" className={isLogs ? 'active' : ''}>
        Logs IA
      </Link>
      <Link href="/ai-responder/configuracion" className={isConfig ? 'active' : ''}>
        Config AI
      </Link>
    </nav>
  );
}
