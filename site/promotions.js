// Calendar dates use UTC and include the entire end date. Timestamps are exact instants.
function boundary(value, end = false) {
  if (!value) return null;
  if (typeof value !== 'string') return NaN;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return NaN;
  if (date && new Date(time).toISOString().slice(0, 10) !== value) return NaN;
  return time + (date && end ? 86400000 - 1 : 0);
}

function isPromotionActive(promotion, now) {
  if (!promotion) return false;
  const start = boundary(promotion.start);
  const end = boundary(promotion.end, true);
  return !Number.isNaN(start) && !Number.isNaN(end)
    && (start === null || now >= start) && (end === null || now <= end);
}

function safeParsePromotions(raw, labels) {
  try {
    const values = JSON.parse(raw || '[]');
    if (!Array.isArray(values)) return [];
    return values.filter(p => p && typeof p === 'object').map(p => {
      const type = p.type === 'percent' ? 'percent' : 'flat';
      const amount = Number.isFinite(Number(p.amount)) ? Number(p.amount) : 0;
      const label = (type === 'percent' ? labels.percent : labels.flat).replace('{amount}', amount);
      return { ...p, type, amount, badgeText: String(p.badgeText || label) };
    });
  } catch {
    return [];
  }
}

module.exports = { isPromotionActive, safeParsePromotions };
