export function formatBrl(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatUsd(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '$ 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(1)}%`;
}

export function formatDateBr(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  return dateString;
}

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysDifference(dueDateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = dueDateString.split('-');
  if (parts.length !== 3) return 0;
  const due = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getInstallmentUrgency(dueDateString: string, isPaid: boolean): {
  status: 'Pago' | 'Atrasado' | 'Hoje' | 'Pendente';
  label: string;
  badgeClass: string;
} {
  if (isPaid) {
    return {
      status: 'Pago',
      label: 'Pago',
      badgeClass: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    };
  }

  const days = getDaysDifference(dueDateString);

  if (days < 0) {
    const absDays = Math.abs(days);
    return {
      status: 'Atrasado',
      label: `${absDays} ${absDays === 1 ? 'dia' : 'dias'} em atraso`,
      badgeClass: 'bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse',
    };
  }

  if (days === 0) {
    return {
      status: 'Hoje',
      label: 'Vence Hoje',
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
    };
  }

  if (days <= 3) {
    return {
      status: 'Pendente',
      label: `Vence em ${days} ${days === 1 ? 'dia' : 'dias'}`,
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    };
  }

  return {
    status: 'Pendente',
    label: `Vence em ${days} dias`,
    badgeClass: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
  };
}
