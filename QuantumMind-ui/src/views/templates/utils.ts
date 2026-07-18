// ** Shared helpers for the Templates module

// Converts a snake_case / kebab-case enum value into a human readable label.
export const humanize = (value?: string): string => {
  if (!value) return '';
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Truncates long text for card descriptions.
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

// Maps a template status to an MUI theme colour.
export const statusColor = (
  status?: string,
): 'success' | 'warning' | 'secondary' | 'default' => {
  switch (status) {
    case 'published':
      return 'success';
    case 'draft':
      return 'warning';
    case 'archived':
      return 'secondary';
    default:
      return 'default';
  }
};
