// Чтение статистики из localStorage
function getTypingStats() {
  const key = 'typingStats';
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Ошибка чтения статистики:', e);
    return [];
  }
}

// Очистка статистики
function clearTypingStats() {
  localStorage.removeItem('typingStats');
}

// Форматирование даты для отображения
function formatDate(iso) {
  try {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

// Рендер списка попыток
function renderAttemptsList(stats) {
  const list = document.getElementById('attemptsList');
  list.innerHTML = '';
  if (!stats.length) {
    const empty = document.createElement('div');
    empty.className = 'list-group-item';
    empty.style.background = '#212121';
    empty.style.borderColor = '#52575d';
    empty.textContent = 'Пока нет данных. Выполните тренировку на главной странице.';
    list.appendChild(empty);
    return;
  }

  stats.forEach((a, idx) => {
    const item = document.createElement('div');
    item.className = 'list-group-item d-flex justify-content-between align-items-center';
    item.style.background = '#212121';
    item.style.borderColor = '#52575d';

    const left = document.createElement('div');
    left.innerHTML = `
      <div><span class="yellow">#${idx + 1}</span> — ${formatDate(a.date)}</div>
      <div class="small text-muted">Режим: ${a.difficulty}, Лимит: ${a.durationSec}s</div>
    `;

    const right = document.createElement('div');
    right.innerHTML = `
      <span class="badge bg-success me-2">WPM: ${a.wpm}</span>
      <span class="badge bg-info text-dark me-2">Точность: ${a.accuracyPercent}%</span>
      <span class="badge bg-secondary">CW/WS: ${a.wordsCorrect}/${a.wordsSubmitted}</span>
    `;

    item.appendChild(left);
    item.appendChild(right);
    list.appendChild(item);
  });
}

// Построение графика Chart.js
let chartInstance = null;
function renderChart(stats) {
  const ctx = document.getElementById('statsChart');
  if (!ctx) return;

  const labels = stats.map(a => formatDate(a.date));
  const wpmData = stats.map(a => a.wpm);
  const accData = stats.map(a => a.accuracyPercent);

  const data = {
    labels,
    datasets: [
      {
        label: 'WPM',
        data: wpmData,
        borderColor: '#29bb89',
        backgroundColor: 'rgba(41, 187, 137, 0.2)',
        tension: 0.2,
        yAxisID: 'y'
      },
      {
        label: 'Точность (%)',
        data: accData,
        borderColor: '#ffd369',
        backgroundColor: 'rgba(255, 211, 105, 0.2)',
        tension: 0.2,
        yAxisID: 'y1'
      }
    ]
  };

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
        title: { display: true, text: 'WPM', color: '#eeeeee' }
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

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, { type: 'line', data, options });
}

// Инициализация страницы
function initStatsPage() {
  const stats = getTypingStats();
  renderAttemptsList(stats);
  renderChart(stats);

  const clearBtn = document.getElementById('clearStatsBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Очистить всю статистику? Действие нельзя отменить.')) {
        clearTypingStats();
        const empty = [];
        renderAttemptsList(empty);
        renderChart(empty);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initStatsPage);
