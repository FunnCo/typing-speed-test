export const KEY = 'typingStats_v2';

function safeJsonParse(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

export function getStats() {
  const raw = localStorage.getItem(KEY);
  const parsed = raw ? safeJsonParse(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

export function saveAttempt(attempt) {
  const stats = getStats();
  stats.push(attempt);
  localStorage.setItem(KEY, JSON.stringify(stats));
}

export function clearStats() {
  localStorage.removeItem(KEY);
}

export const TypingStorage = { KEY, getStats, saveAttempt, clearStats };

if (typeof window !== 'undefined') window.TypingStorage = TypingStorage;
