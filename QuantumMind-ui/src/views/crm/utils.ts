// ** Shared helpers for the CRM module

// Converts a snake_case / kebab-case enum value into a human readable label.
export const humanize = (value?: string): string => {
  if (!value) return '';
  return value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

// Truncates long text.
export const ellipsify = (str?: string, max = 100): string => {
  if (!str) return '';
  return str.length > max ? `${str.substring(0, max)}...` : str;
};

// Formats an ISO date to a readable string.
export const formatDate = (date?: string | Date): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Formats a numeric amount as currency.
export const formatCurrency = (amount?: number, currency = 'USD'): string => {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

// Returns the initials for an avatar fallback.
export const initials = (name?: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase() || '?';
};

// ** Deal pipeline stages, mirrored from the reference CRM's DealStage enum.
export const DEAL_STAGES = [
  'DEMO_BOOKED',
  'QUALIFIED_TO_BUY',
  'UNQUALIFIED_TO_BUY',
  'DECISION_MAKER_BOUGHT_IN',
  'CONTRACT_SENT',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

// Maps a deal stage to an MUI theme colour.
export const stageColor = (
  stage?: string,
): 'success' | 'error' | 'warning' | 'info' | 'primary' | 'secondary' => {
  switch (stage) {
    case 'CLOSED_WON':
      return 'success';
    case 'CLOSED_LOST':
    case 'UNQUALIFIED_TO_BUY':
      return 'error';
    case 'CONTRACT_SENT':
      return 'warning';
    case 'DECISION_MAKER_BOUGHT_IN':
      return 'info';
    case 'QUALIFIED_TO_BUY':
      return 'primary';
    default:
      return 'secondary';
  }
};

// Maps a generic record status to an MUI theme colour.
export const statusColor = (
  status?: string,
): 'success' | 'warning' | 'secondary' | 'default' => {
  switch ((status || '').toLowerCase()) {
    case 'active':
    case 'customer':
      return 'success';
    case 'lead':
    case 'prospect':
      return 'warning';
    case 'archived':
    case 'inactive':
      return 'secondary';
    default:
      return 'default';
  }
};
