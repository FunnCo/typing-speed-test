(function () {
  'use strict';

  function clampInt(n, min, max) {
    const x = Number.isFinite(n) ? Math.trunc(n) : 0;
    return Math.max(min, Math.min(max, x));
  }

  /**
   * Сравнение слов по символам "по позициям" с длиной = max(lenTyped, lenTarget).
   * Возвращает:
   * - correct: сколько позиций совпало
   * - total: сколько позиций сравнили (maxLen)
   */
  function compareWordByPositions(typed, target) {
    const t = String(typed ?? '');
    const s = String(target ?? '');
    const total = Math.max(t.length, s.length);
    let correct = 0;

    for (let i = 0; i < total; i++) {
      const tc = t[i];
      const sc = s[i];
      if (tc !== undefined && sc !== undefined && tc === sc) correct++;
    }

    return { correct, total };
  }

  function percent(part, total) {
    if (!total) return 0;
    return clampInt(Math.floor((part / total) * 100), 0, 100);
  }

  /**
   * Standard WPM: (chars/5)/minutes
   */
  function standardWpm(charsTyped, durationSec) {
    const minutes = durationSec / 60;
    if (!minutes) return 0;
    return Math.max(0, Math.floor((charsTyped / 5) / minutes));
  }

  function wordWpm(wordsCorrect, durationSec) {
    const minutes = durationSec / 60;
    if (!minutes) return 0;
    return Math.max(0, Math.floor(wordsCorrect / minutes));
  }

  /**
   * Moving average для ряда чисел.
   */
  function movingAverage(values, windowSize = 5) {
    const w = Math.max(1, Math.floor(windowSize));
    const out = [];
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - w + 1);
      const chunk = values.slice(start, i + 1);
      const avg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
      out.push(Number.isFinite(avg) ? avg : 0);
    }
    return out;
  }

  window.TypingMetrics = {
    compareWordByPositions,
    percent,
    standardWpm,
    wordWpm,
    movingAverage
  };
})();
