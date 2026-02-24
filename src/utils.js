// ─── Shared formatting helpers ────────────────────────────────────────────────
// Single source of truth for PHP currency formatting across all components.
// Both ExpirationCalculator and PetriDishPortfolio use these.

export const formatPHP = (n) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(n || 0);

export function formatShort(n) {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`;
  return n > 0 ? `₱${n}` : '—';
}
