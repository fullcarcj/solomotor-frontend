import type { ChatStage } from '@/types/inbox';
import { CHAT_STAGE_LABELS, CHAT_STAGE_ORDER } from '@/types/inbox';

const AVATAR_CLASS = ['blue', 'orange', 'violet', 'green'] as const;

export function pickAvatarClass(index: number): (typeof AVATAR_CLASS)[number] {
  return AVATAR_CLASS[index % AVATAR_CLASS.length]!;
}

export function initials(name: string | null, phone: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    const a = parts[0]?.[0] ?? '';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase() || phone.slice(-2).toUpperCase();
  }
  return phone.replace(/\D/g, '').slice(-2) || '??';
}

export function fmtShortTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
  } catch {
    return '—';
  }
}

/** Badge canal mockup (.ch-wa / .ch-ml / …) + letra */
export function sourceToChannel(source: string): { channel: 'wa' | 'ml' | 'eco' | 'fv'; letter: string } {
  const s = source.toLowerCase();
  if (s.includes('wa')) return { channel: 'wa', letter: 'W' };
  if (s.includes('ml')) return { channel: 'ml', letter: 'M' };
  if (s.includes('eco') || s.includes('shop') || s.includes('web')) return { channel: 'eco', letter: 'E' };
  return { channel: 'fv', letter: 'F' };
}

/** Clase .tag-* del mockup según etapa */
export function stageToTagClass(stage: ChatStage | undefined): string {
  switch (stage) {
    case 'contact':
      return 'tag-new';
    case 'ml_answer':
      return 'tag-des';
    case 'quote':
      return 'tag-cot';
    case 'approved':
      return 'tag-apr';
    case 'order':
    case 'payment':
      return 'tag-pag';
    case 'dispatch':
      return 'tag-des';
    case 'closed':
      return 'tag-cer';
    default:
      return 'tag-cer';
  }
}

export interface MiniPm {
  label: string;
  status: 'done' | 'current' | 'pending';
}

/** Mini pipeline alineado a BE-1.9 (8 etapas). */
export function miniPipelineFromStage(stage: ChatStage | undefined): MiniPm[] {
  if (stage === 'closed') {
    return CHAT_STAGE_ORDER.map((st, i) => ({
      label: `${String(i + 1).padStart(2, '0')} · ${CHAT_STAGE_LABELS[st].toUpperCase()}`,
      status: 'done' as const,
    }));
  }
  const idx = stage ? CHAT_STAGE_ORDER.indexOf(stage) : -1;
  const current = idx >= 0 ? idx : 0;
  return CHAT_STAGE_ORDER.map((st, i) => ({
    label: `${String(i + 1).padStart(2, '0')} · ${CHAT_STAGE_LABELS[st].toUpperCase()}`,
    status: i < current ? 'done' : i === current ? 'current' : 'pending',
  }));
}

export function messageBody(text: string | null | undefined): string {
  const t = text?.trim();
  return t && t.length > 0 ? t : '—';
}
