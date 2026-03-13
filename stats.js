// stats.js (ES module)
import { TypingStorage } from './storage.js';
import { TypingMetrics } from './metrics.js';

function formatDate(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return String(iso ?? '');
  }
}

function toNumber(x, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDifficulty(raw) {
  if (raw === 'база') return 'beginner';
  if (raw === 'про') return 'pro';
  if (raw === 'beginner' || raw === 'pro') return raw;
  return 'unknown';
}

function normalizeAttempt(a) {
  const durationSec = toNumber(a?.durationSec, 30);
  const difficulty = normalizeDifficulty(a?.difficulty);
  const language = (a?.language === 'en' || a?.language === 'ru') ? a.language : 'ru';

  // legacy поля из старых попыток (на всякий случай, но storage legacy уже убрали)
  const wpmStd = (a?.wpmStd != null)
    ? toNumber(a.wpmStd, 0)
    : (a?.wpm != null ? toNumber(a.wpm, 0) : 0);

  const wpmWords = (a?.wpmWords != null) ? toNumber(a.wpmWords, 0) : 0;

  const wordAccuracyPercent = (a?.wordAccuracyPercent != null)
    ? toNumber(a.wordAccuracyPercent, 0)
    : (a?.accuracyPercent != null ? toNumber(a.accuracyPercent, 0) : 0);

  const charAccuracyPercent = (a?.charAccuracyPercent != null) ? toNumber(a.charAccuracyPercent, 0) : 0;

  return {
    raw: a,
    version: a?.version || 1,
    date: a?.date,

    durationSec,
    difficulty,
    language,

    wpmStd,
    wpmWords,
    wordAccuracyPercent,
    charAccuracyPercent,

    wordsCorrect: toNumber(a?.wordsCorrect, 0),
    wordsSubmitted: toNumber(a?.wordsSubmitted, 0),
  };
}

function applyFilters(attempts, { difficulty, durationSec, language }) {
  return attempts.filter(a => {
    const okLang = (language === 'all') || (a.language === language);
    const okDiff = (difficulty === 'all') || (a.difficulty === difficulty);
    const okDur = (durationSec === 'all') || (String(a.durationSec) === String(durationSec));
    return okLang && okDiff && okDur;
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

function el(tag, { className, text } = {}) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text != null) n.textContent = String(text);
  return n;
}

// --- DOM ---
const dom = {
  list: document.getElementById('attemptsList'),
  chart: document.getElementById('statsChart'),
  clearBtn: document.getElementById('clearStatsBtn'),

  filterLanguage: document.getElementById('filterLanguage'),
  filterDifficulty: document.getElementById('filterDifficulty'),
  filterDuration: document.getElementById('filterDuration'),
  toggleMA: document.getElementById('toggleMA'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),

  summary: document.getElementById('summary'),

  exportBtn: document.getElementById('exportBtn'),
  importBtn: document.getElementById('importBtn'),
  dataModal: document.getElementById('dataModal'),
  dataModalTitle: document.getElementById('dataModalTitle'),
  dataTextarea: document.getElementById('dataTextarea'),
  dataHint: document.getElementById('dataHint'),
  copyBtn: document.getElementById('copyBtn'),
  applyBtn: document.getElementById('applyBtn'),
};

// --- list ---
function renderAttemptsList(stats) {
  dom.list.textContent = '';

  if (!stats.length) {
    const empty = el('div', { className: 'list-group-item', text: 'Пока нет данных (или ничего не подходит под фильтры).' });
    empty.style.background = '#212121';
    empty.style.borderColor = '#52575d';
    dom.list.appendChild(empty);
    return;
  }

  stats.forEach((a, idx) => {
    const item = el('div', { className: 'list-group-item d-flex justify-content-between align-items-start flex-wrap gap-2' });
    item.style.background = '#212121';
    item.style.borderColor = '#52575d';

    const left = el('div');
    const title = el('div', { className: 'basic-text' });
    const num = el('span', { className: 'yellow', text: `#${idx + 1}` });
    title.appendChild(num);
    title.appendChild(document.createTextNode(` — ${formatDate(a.date)}`));

    const meta = el('div', {
      className: 'small basic-text',
      text: `Язык: ${String(a.language).toUpperCase()}, Режим: ${a.difficulty}, Лимит: ${a.durationSec}s`,
    });

    left.appendChild(title);
    left.appendChild(meta);

    const right = el('div');

    const badges = [
      { cls: 'badge bg-success me-2', text: `WPM(std): ${a.wpmStd}` },
      { cls: 'badge bg-secondary me-2', text: `WPM(слов): ${a.wpmWords}` },
      { cls: 'badge bg-info text-dark me-2', text: `Слова: ${a.wordAccuracyPercent}%` },
      { cls: 'badge bg-warning text-dark me-2', text: `Симв: ${a.charAccuracyPercent}%` },
      { cls: 'badge bg-primary', text: `CW/WS: ${a.wordsCorrect}/${a.wordsSubmitted}` },
    ];

    badges.forEach(b => right.appendChild(el('span', { className: b.cls, text: b.text })));

    item.appendChild(left);
    item.appendChild(right);
    dom.list.appendChild(item);
  });
}

// --- summary ---
function renderSummary(stats) {
  dom.summary.textContent = '';

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
    { label: 'Средняя точн. (симв)', value: `${Math.floor(mean(cAcc))}%` },
  ];

  blocks.forEach(b => {
    const div = el('div', { className: 'summary-item' });
    div.appendChild(el('div', { className: 'label', text: b.label }));
    div.appendChild(el('div', { className: 'value', text: b.value }));
    dom.summary.appendChild(div);
  });
}

// --- chart ---
let chartInstance = null;
let dataModalInstance = null;

function getDataModal() {
  if (!dom.dataModal) return null;
  if (!dataModalInstance) dataModalInstance = new bootstrap.Modal(dom.dataModal);
  return dataModalInstance;
}

function renderChart(stats, { showMA }) {
  if (!dom.chart) return;

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
      yAxisID: 'y',
    }
  ];

  if (showMA) {
    datasets.push({
      label: 'WPM (std) — MA(5)',
      data: TypingMetrics.movingAverage(wpmStdData, 5),
      borderColor: '#6dd6b4',
      backgroundColor: 'rgba(109, 214, 180, 0.12)',
      tension: 0.2,
      borderDash: [6, 4],
      yAxisID: 'y',
    });
  }

  datasets.push(
    {
      label: 'Точность (слов) %',
      data: accWordData,
      borderColor: '#ffd369',
      backgroundColor: 'rgba(255, 211, 105, 0.2)',
      tension: 0.2,
      yAxisID: 'y1',
    },
    {
      label: 'Точность (симв) %',
      data: accCharData,
      borderColor: '#ff9f1c',
      backgroundColor: 'rgba(255, 159, 28, 0.15)',
      tension: 0.2,
      yAxisID: 'y1',
    }
  );

  const data = { labels, datasets };

  const options = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#eeeeee' } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { ticks: { color: '#eeeeee' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      y: {
        position: 'left',
        ticks: { color: '#eeeeee' },
        grid: { color: 'rgba(255,255,255,0.1)' },
        title: { display: true, text: 'WPM (std)', color: '#eeeeee' },
      },
      y1: {
        position: 'right',
        ticks: { color: '#eeeeee' },
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Точность (%)', color: '#eeeeee' },
        min: 0,
        max: 100,
      },
    },
  };

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(dom.chart, { type: 'line', data, options });
}

// --- import/export ---
function safeParseJson(raw) {
  try { return JSON.parse(raw); } catch { return null; }
}

function openExport() {
  const stats = TypingStorage.getStats();
  dom.dataModalTitle.textContent = 'Экспорт статистики (JSON)';
  dom.dataTextarea.value = JSON.stringify(stats, null, 2);
  dom.dataHint.textContent = 'Скопируйте JSON и сохраните у себя.';

  dom.applyBtn.style.display = 'none';
  dom.copyBtn.style.display = '';

  getDataModal()?.show();
}

function openImport() {
  dom.dataModalTitle.textContent = 'Импорт статистики (JSON)';
  dom.dataTextarea.value = '';
  dom.dataHint.textContent = 'Вставьте JSON массива попыток. После импорта страница обновит графики.';

  dom.applyBtn.style.display = '';
  dom.copyBtn.style.display = 'none';

  getDataModal()?.show();
}

function validateAttemptLike(x) {
  return x && typeof x === 'object' && ('date' in x);
}

function applyImport() {
  const raw = dom.dataTextarea.value ?? '';
  const parsed = safeParseJson(raw);

  if (!Array.isArray(parsed)) {
    alert('Ошибка: ожидается JSON-массив попыток.');
    return;
  }

  if (!parsed.every(validateAttemptLike)) {
    if (!confirm('Формат данных выглядит необычно (не у всех элементов есть поле date). Всё равно импортировать?')) return;
  }

  try {
    localStorage.setItem(TypingStorage.KEY, JSON.stringify(parsed));
  } catch {
    alert('Не удалось сохранить данные (возможно, превышен лимит localStorage).');
    return;
  }

  getDataModal()?.hide();
  rerenderAll();
}

async function copyExportToClipboard() {
  const text = dom.dataTextarea.value ?? '';
  try {
    await navigator.clipboard.writeText(text);
    alert('Скопировано в буфер обмена.');
  } catch {
    // fallback (да, execCommand legacy, но это только запасной вариант)
    dom.dataTextarea.focus();
    dom.dataTextarea.select();
    document.execCommand('copy');
    alert('Скопировано (fallback).');
  }
}

// --- init / interactions ---
function getFilterState() {
  return {
    language: dom.filterLanguage?.value || 'all',
    difficulty: dom.filterDifficulty?.value || 'all',
    durationSec: dom.filterDuration?.value || 'all',
    showMA: !!dom.toggleMA?.checked,
  };
}

function rerenderAll() {
  const raw = TypingStorage.getStats();
  const normalized = raw.map(normalizeAttempt);

  const fs = getFilterState();
  const filtered = applyFilters(normalized, {
    difficulty: fs.difficulty,
    durationSec: fs.durationSec,
    language: fs.language,
  });

  renderSummary(filtered);
  renderAttemptsList(filtered);
  renderChart(filtered, { showMA: fs.showMA });
}

function initStatsPage() {
  rerenderAll();

  dom.filterDifficulty?.addEventListener('change', rerenderAll);
  dom.filterDuration?.addEventListener('change', rerenderAll);
  dom.toggleMA?.addEventListener('change', rerenderAll);
  dom.filterLanguage?.addEventListener('change', rerenderAll);

  dom.resetFiltersBtn?.addEventListener('click', () => {
    if (dom.filterDifficulty) dom.filterDifficulty.value = 'all';
    if (dom.filterDuration) dom.filterDuration.value = 'all';
    if (dom.toggleMA) dom.toggleMA.checked = true;
    if (dom.filterLanguage) dom.filterLanguage.value = 'all';
    rerenderAll();
  });

  dom.clearBtn?.addEventListener('click', () => {
    if (confirm('Очистить всю статистику? Действие нельзя отменить.')) {
      TypingStorage.clearStats();
      rerenderAll();
    }
  });

  dom.exportBtn?.addEventListener('click', openExport);
  dom.importBtn?.addEventListener('click', openImport);
  dom.applyBtn?.addEventListener('click', applyImport);
  dom.copyBtn?.addEventListener('click', copyExportToClipboard);
}

document.addEventListener('DOMContentLoaded', initStatsPage);
