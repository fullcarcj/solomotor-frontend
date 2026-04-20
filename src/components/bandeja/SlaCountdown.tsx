"use client";

import { useEffect, useState } from "react";

interface Props {
  deadline: string | null;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export default function SlaCountdown({ deadline }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  if (!deadline) return null;

  let end: number;
  try {
    end = new Date(deadline).getTime();
  } catch {
    return null;
  }
  if (!Number.isFinite(end)) return null;

  void tick;
  const now = Date.now();
  const leftSec = Math.floor((end - now) / 1000);
  if (leftSec <= 0) return null;

  const mm = Math.floor(leftSec / 60);
  const ss = leftSec % 60;
  const label = `${pad2(mm)}:${pad2(ss)}`;

  const urgent = leftSec <= 10;
  const warn = leftSec <= 30;

  return (
    <span
      className={`sla-countdown${urgent ? " sla-countdown--danger" : warn ? " sla-countdown--warn" : ""}`}
      title="SLA"
      suppressHydrationWarning
    >
      SLA {label}
    </span>
  );
}
