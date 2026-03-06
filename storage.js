(function () {
  'use strict';

  const KEY = 'typingStats_v2';

  function safeJsonParse(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  // Пробуем читать новые данные, иначе — старые (для совместимости)
  function getStats() {
    // v2
    const raw2 = localStorage.getItem(KEY);
    const parsed2 = raw2 ? safeJsonParse(raw2) : null;
    if (Array.isArray(parsed2)) return parsed2;

    // v1 legacy (ваш старый ключ)
    const raw1 = localStorage.getItem('typingStats');
    const parsed1 = raw1 ? safeJsonParse(raw1) : null;
    if (Array.isArray(parsed1)) return parsed1;

    return [];
  }

  function saveAttempt(attempt) {
    const stats = getStats();
    stats.push(attempt);
    try {
      localStorage.setItem(KEY, JSON.stringify(stats));
    } catch (e) {
      console.error('Ошибка записи статистики:', e);
    }
  }

  function clearStats() {
    localStorage.removeItem(KEY);
    // не трогаем legacy автоматически, но можно по желанию:
    // localStorage.removeItem('typingStats');
  }

  window.TypingStorage = {
    KEY,
    getStats,
    saveAttempt,
    clearStats
  };
})();
