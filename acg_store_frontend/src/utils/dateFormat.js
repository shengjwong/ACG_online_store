// Display dates consistently as DD/MM/YYYY across the frontend.
export const formatDate = (value, fallback = '—') => {
  if (!value) return fallback;

  // Handle ISO date strings directly to avoid timezone shifting date-only values.
  const raw = String(value);
  const match = raw.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${parsed.getFullYear()}`;
};

export const formatDateTime = (value, fallback = '—') => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  const date = formatDate(parsed);
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  return `${date} ${hours}:${minutes}`;
};
