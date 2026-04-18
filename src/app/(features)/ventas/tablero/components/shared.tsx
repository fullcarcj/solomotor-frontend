export function formatTimeSince(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  if (diff < 60000) return 'ahora';
  if (hours < 1) return `hace ${minutes}m`;
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
}

export function formatMoneyUsd(n: number): string {
  return `$ ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
