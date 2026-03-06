(function () {
  'use strict';

  // --- helpers ---
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      const pad = (n) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return iso;
    }
  }

  function toNumber(x, fallback = 0) {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
  }

  // Нормализуем попытку (поддерживаем старый формат)
  function normalizeAttempt(a) {
    const durationSec = toNumber(a.durationSec, 30);
    const difficulty = a.difficulty || 'unknown';

    // legacy: a.wpm и a.accuracyPercent
    const wpmStd = (a.wpmStd != null)
      ? toNumber(a.wpmStd, 0)
      : (a.wpm != null ? toNumber(a.wpm, 0) : 0);

    const wpmWords = (a.wpmWords != null)
      ? toNumber(a.wpmWords, 0)
      : 0;

    const wordAccuracyPercent = (a.wordAccuracyPercent != null)
      ? toNumber(a.wordAccuracyPercent, 0)
      : (a.accuracyPercent != null ? toNumber(a.accuracyPercent, 0) : 0);

    const charAccuracyPercent = (a.charAccuracyPercent != null)
      ? toNumber(a.charAccuracyPercent, 0)
      : 0;

    return {
      raw: a,
      version: a.version || 1,
      date: a.date,
      durationSec,
      difficulty,

      wpmStd,
      wpmWords,
      wordAccuracyPercent,
      charAccuracyPercent,

      wordsCorrect: toNumber(a.wordsCorrect, 0),
      wordsSubmitted: toNumber(a.wordsSubmitted, 0)
    };
  }

  function applyFilters(attempts, { difficulty, durationSec }) {
    return attempts.filter(a => {
      const okDiff = (difficulty === 'all') || (a.difficulty === difficulty);
      const okDur = (durationSec === 'all') || (String(a.durationSec) === String(durationSec));
      return okDiff && okDur;
    });
  }

  function mean(values) {
    if (!values.length) return 0;
    return values.reduce((s, v) => s + v, 0) / values.length;
  }

  function max(values) {
    if (!values.length) return 0;
    return Math.max(...values);
  }

  // --- DOM ---
  const el = {
    list: document.getElementById('attemptsList'),
    chart: document.getElementById('statsChart'),
    clearBtn: document.getElementById('clearStatsBtn'),

    filterDifficulty: document.getElementById('filterDifficulty'),
    filterDuration: document.getElementById('filterDuration'),
    toggleMA: document.getElementById('toggleMA'),
    resetFiltersBtn: document.getElementById('resetFiltersBtn'),

    summary: document.getElementById('summary')
  };

  // --- render list ---
  function renderAttemptsList(stats) {
    el.list.innerHTML = '';
    if (!stats.length) {
      const empty = document.createElement('div');
      empty.className = 'list-group-item';
      empty.style.background = '#212121';
      empty.style.borderColor = '#52575d';
      empty.textContent = 'Пока нет данных (или ничего не подходит под фильтры).';
      el.list.appendChild(empty);
      return;
    }

    stats.forEach((a, idx) => {
      const item = document.createElement('div');
      item.className = 'list-group-item d-flex justify-content-between align-items-start flex-wrap gap-2';
      item.style.background = '#212121';
      item.style.borderColor = '#52575d';

      const left = document.createElement('div');
      left.innerHTML = `
        <div class="basic-text"><span class="yellow">#${idx + 1}</span> — ${formatDate(a.date)}</div>
        <div class="small basic-text">Режим: ${a.difficulty}, Лимит: ${a.durationSec}s</div>
      `;

      const right = document.createElement('div');
      right.innerHTML = `
        <span class="badge bg-success me-2">WPM(std): ${a.wpmStd}</span>
        <span class="badge bg-secondary me-2">WPM(слов): ${a.wpmWords}</span>
        <span class="badge bg-info text-dark me-2">Слова: ${a.wordAccuracyPercent}%</span>
        <span class="badge bg-warning text-dark me-2">Симв: ${a.charAccuracyPercent}%</span>
        <span class="badge bg-primary">CW/WS: ${a.wordsCorrect}/${a.wordsSubmitted}</span>
      `;

      item.appendChild(left);
      item.appendChild(right);
      el.list.appendChild(item);
    });
  }

  // --- render summary ---
  function renderSummary(stats) {
    el.summary.innerHTML = '';

    const total = stats.length;
    const wpm = stats.map(a => a.wpmStd);
    const wAcc = stats.map(a => a.wordAccuracyPercent);
    const cAcc = stats.map(a => a.charAccuracyPercent);

    const last10 = stats.slice(-10);
    const last10Wpm = last10.map(a => a.wpmStd);
    const last10Acc = last10.map(a => a.wordAccuracyPercent);

    const blocks = [
      { label: 'Попыток', value: String(total) },
      { label: 'Лучший WPM(std)', value: String(Math.floor(max(wpm))) },
      { label: 'Средний WPM(std)', value: String(Math.floor(mean(wpm))) },
      { label: 'WPM(std) (посл. 10)', value: String(Math.floor(mean(last10Wpm))) },

      { label: 'Лучшая точн. (слов)', value: `${Math.floor(max(wAcc))}%` },
      { label: 'Средняя точн. (слов)', value: `${Math.floor(mean(wAcc))}%` },
      { label: 'Точн. (слов) (посл. 10)', value: `${Math.floor(mean(last10Acc))}%` },
      { label: 'Средняя точн. (симв)', value: `${Math.floor(mean(cAcc))}%` }
    ];

    blocks.forEach(b => {
      const div = document.createElement('div');
      div.className = 'summary-item';
      div.innerHTML = `<div class="label">${b.label}</div><div class="value">${b.value}</div>`;
      el.summary.appendChild(div);
    });
  }

  // --- chart ---
  let chartInstance = null;

  function renderChart(stats, { showMA }) {
    if (!el.chart) return;

    const labels = stats.map(a => formatDate(a.date));
    const wpmStdData = stats.map(a => a.wpmStd);
    const accWordData = stats.map(a => a.wordAccuracyPercent);
    const accCharData = stats.map(a => a.charAccuracyPercent);

    const datasets = [
      {
        label: 'WPM (std)',
        data: wpmStdData,
        borderColor: '#29bb89',
        backgroundColor: 'rgba(41, 187, 137, 0.2)',
        tension: 0.2,
        yAxisID: 'y'
      }
    ];

    if (showMA) {
      const ma = TypingMetrics.movingAverage(wpmStdData, 5);
      datasets.push({
        label: 'WPM (std) — MA(5)',
        data: ma,
        borderColor: '#6dd6b4',
        backgroundColor: 'rgba(109, 214, 180, 0.12)',
        tension: 0.2,
        borderDash: [6, 4],
        yAxisID: 'y'
      });
    }

    datasets.push(
      {
        label: 'Точность (слов) %',
        data: accWordData,
        borderColor: '#ffd369',
        backgroundColor: 'rgba(255, 211, 105, 0.2)',
        tension: 0.2,
        yAxisID: 'y1'
      },
      {
        label: 'Точность (симв) %',
        data: accCharData,
        borderColor: '#ff9f1c',
        backgroundColor: 'rgba(255, 159, 28, 0.15)',
        tension: 0.2,
        yAxisID: 'y1'
      }
    );

    const data = { labels, datasets };

    const options = {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#eeeeee' } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: {
          ticks: { color: '#eeeeee' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        y: {
          position: 'left',
          ticks: { color: '#eeeeee' },
          grid: { color: 'rgba(255,255,255,0.1)' },
          title: { display: true, text: 'WPM (std)', color: '#eeeeee' }
        },
        y1: {
          position: 'right',
          ticks: { color: '#eeeeee' },
          grid: { drawOnChartArea: false, color: 'rgba(255,255,255,0.1)' },
          title: { display: true, text: 'Точность (%)', color: '#eeeeee' },
          min: 0,
          max: 100
        }
      }
    };

    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(el.chart, { type: 'line', data, options });
  }

  // --- init / interactions ---
  function getFilterState() {
    return {
      difficulty: el.filterDifficulty?.value || 'all',
      durationSec: el.filterDuration?.value || 'all',
      showMA: !!el.toggleMA?.checked
    };
  }

  function rerenderAll() {
    const raw = TypingStorage.getStats();
    const normalized = raw.map(normalizeAttempt);

    const fs = getFilterState();
    const filtered = applyFilters(normalized, { difficulty: fs.difficulty, durationSec: fs.durationSec });

    renderSummary(filtered);
    renderAttemptsList(filtered);
    renderChart(filtered, { showMA: fs.showMA });
  }

  function initStatsPage() {
    rerenderAll();

    el.filterDifficulty?.addEventListener('change', rerenderAll);
    el.filterDuration?.addEventListener('change', rerenderAll);
    el.toggleMA?.addEventListener('change', rerenderAll);

    el.resetFiltersBtn?.addEventListener('click', () => {
      if (el.filterDifficulty) el.filterDifficulty.value = 'all';
      if (el.filterDuration) el.filterDuration.value = 'all';
      if (el.toggleMA) el.toggleMA.checked = true;
      rerenderAll();
    });

    el.clearBtn?.addEventListener('click', () => {
      if (confirm('Очистить всю статистику? Действие нельзя отменить.')) {
        TypingStorage.clearStats();
        rerenderAll();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', initStatsPage);
})();
