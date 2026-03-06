(function () {
  'use strict';

  // --- DOM ---
  const el = {
    test: document.getElementById('textDisplay'),
    input: document.getElementById('textInput'),
    restart: document.getElementById('restartBtn'),

    thirty: document.getElementById('thirty'),
    sixty: document.getElementById('sixty'),
    beg: document.getElementById('beg'),
    pro: document.getElementById('pro'),

    timeName: document.getElementById('timeName'),
    time: document.getElementById('time'),

    cwName: document.getElementById('cwName'),
    cw: document.getElementById('cw'),

    wpmName: document.getElementById('wpmName'),
    wpm: document.getElementById('wpm'),

    accName: document.getElementById('accName'),
    acc: document.getElementById('acc'),

    wpmWords: document.getElementById('wpmWords'),
    accChars: document.getElementById('accChars'),
  };

  function setActive(btnOn, btnOff) {
    btnOn.classList.add('active');
    btnOn.setAttribute('aria-pressed', 'true');
    btnOff.classList.remove('active');
    btnOff.setAttribute('aria-pressed', 'false');
  }

  function nowMs() { return Date.now(); }

  // --- App State (без россыпи глобальных переменных) ---
  const state = {
    durationSec: 30,
    difficulty: 'beginner', // 'beginner' | 'pro'

    running: false,
    startedAt: null,
    endsAt: null,
    tickId: null,

    words: [],
    index: 0,

    // word-level
    wordsSubmitted: 0,
    wordsCorrect: 0,

    // char-level / standard WPM
    charsTyped: 0,              // считаем только подтверждённые слова: len(word)+1 (пробел)
    correctCharPositions: 0,     // совпавшие позиции
    totalCharPositions: 0        // maxLen по словам
  };

  // --- Render helpers ---
  function clearTest() {
    el.test.innerHTML = '';
  }

  function createWordNode(word, idx) {
    const w = document.createElement('span');
    w.className = 'word';
    w.id = `w-${idx}`;

    // каждый символ — отдельный span, чтобы красить по буквам
    for (let i = 0; i < word.length; i++) {
      const ch = document.createElement('span');
      ch.className = 'char';
      ch.textContent = word[i];
      ch.dataset.pos = String(i);
      w.appendChild(ch);
    }
    return w;
  }

  function renderWords(words) {
    clearTest();
    const frag = document.createDocumentFragment();

    words.forEach((word, idx) => {
      const w = createWordNode(word, idx);
      frag.appendChild(w);

      const space = document.createElement('span');
      space.className = 'space';
      space.textContent = ' ';
      frag.appendChild(space);
    });

    el.test.appendChild(frag);
    markCurrentWord();
  }

  function getWordEl(idx) {
    return document.getElementById(`w-${idx}`);
  }

  function resetWordClasses(wordEl) {
    wordEl.classList.remove('correct', 'wrong', 'current', 'over');
    // сброс букв
    wordEl.querySelectorAll('.char').forEach(ch => {
      ch.classList.remove('correct', 'wrong');
    });
  }

  function markCurrentWord() {
    // снять current со всех (дешёво, всего 40 слов)
    for (let i = 0; i < state.words.length; i++) {
      const w = getWordEl(i);
      if (!w) continue;
      w.classList.remove('current');
      w.classList.remove('over');
    }
    const current = getWordEl(state.index);
    if (current) current.classList.add('current');
  }

  function updateLiveLetterHighlight() {
    const current = getWordEl(state.index);
    if (!current) return;

    const typed = el.input.value;
    const target = state.words[state.index] ?? '';

    // overflow marker
    if (typed.length > target.length) current.classList.add('over');
    else current.classList.remove('over');

    const chars = current.querySelectorAll('.char');
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      ch.classList.remove('correct', 'wrong');

      if (i >= typed.length) continue;

      if (typed[i] === target[i]) ch.classList.add('correct');
      else ch.classList.add('wrong');
    }
  }

  // --- Timer ---
  function remainingSec() {
    if (!state.running || !state.endsAt) return state.durationSec;
    const ms = state.endsAt - nowMs();
    return Math.max(0, Math.ceil(ms / 1000));
  }

  function setLimitsEnabled(enabled) {
    const v = enabled ? 'visible' : 'hidden';
    el.thirty.style.visibility = v;
    el.sixty.style.visibility = v;
    el.beg.style.visibility = v;
    el.pro.style.visibility = v;
  }

  function startIfNeeded() {
    if (state.running) return;
    state.running = true;
    state.startedAt = nowMs();
    state.endsAt = state.startedAt + state.durationSec * 1000;

    setLimitsEnabled(false);

    // тик чаще 1с, чтобы показ оставшихся секунд был стабильным
    state.tickId = setInterval(() => {
      const r = remainingSec();
      el.time.innerText = String(r);
      if (r <= 0) {
        endTest();
      }
    }, 200);
  }

  function stopTimer() {
    if (state.tickId) clearInterval(state.tickId);
    state.tickId = null;
    state.running = false;
    state.startedAt = null;
    state.endsAt = null;
  }

  // --- Metrics/UI updates ---
  function updateStatsUIRunning() {
    el.timeName.innerText = 'Время';
    el.time.innerText = String(state.running ? remainingSec() : state.durationSec);

    el.cwName.innerText = 'CW';
    el.cw.innerText = String(state.wordsCorrect);

    // показываем промежуточные метрики, чтобы было интересно
    const std = TypingMetrics.standardWpm(state.charsTyped, state.durationSec);
    const wWpm = TypingMetrics.wordWpm(state.wordsCorrect, state.durationSec);

    el.wpmName.innerText = 'WPM (std)';
    el.wpm.innerText = String(std);

    const wordAcc = TypingMetrics.percent(state.wordsCorrect, state.wordsSubmitted);
    el.accName.innerText = 'Точность (слов)';
    el.acc.innerText = `${wordAcc}%`;

    const charAcc = TypingMetrics.percent(state.correctCharPositions, state.totalCharPositions);
    el.wpmWords.innerText = String(wWpm);
    el.accChars.innerText = `${charAcc}%`;
  }

  function displayFinalScore() {
    const wordAcc = TypingMetrics.percent(state.wordsCorrect, state.wordsSubmitted);
    const charAcc = TypingMetrics.percent(state.correctCharPositions, state.totalCharPositions);

    const stdWpm = TypingMetrics.standardWpm(state.charsTyped, state.durationSec);
    const wWpm = TypingMetrics.wordWpm(state.wordsCorrect, state.durationSec);

    el.timeName.innerText = 'Готово';
    el.time.innerText = '0';

    el.cwName.innerText = 'CW/WS';
    el.cw.innerText = `${state.wordsCorrect}/${state.wordsSubmitted}`;

    el.wpmName.innerText = 'WPM (std)';
    el.wpm.innerText = String(stdWpm);

    el.accName.innerText = 'Точн. (слов)';
    el.acc.innerText = `${wordAcc}%`;

    el.wpmWords.innerText = String(wWpm);
    el.accChars.innerText = `${charAcc}%`;
  }

  // --- Submission logic ---
  function normalizeTyped(s) {
    // Слово: убираем пробелы/переводы строк по краям
    return String(s ?? '').trim();
  }

  function submitCurrentWord({ allowEmpty = false } = {}) {
    const typedRaw = el.input.value;
    const typed = normalizeTyped(typedRaw);
    if (!typed && !allowEmpty) {
      el.input.value = '';
      updateLiveLetterHighlight();
      return;
    }

    const target = state.words[state.index] ?? '';
    const current = getWordEl(state.index);
    if (!current) return;

    // Обновить статистику
    state.wordsSubmitted++;

    const exact = typed === target;
    if (exact) state.wordsCorrect++;

    // char metrics by positions
    const cmp = TypingMetrics.compareWordByPositions(typed, target);
    state.correctCharPositions += cmp.correct;
    state.totalCharPositions += cmp.total;

    // standard WPM char count (учитываем пробел между словами)
    // Берём длину typed (то, что реально набрали) + 1 пробел как разделитель.
    state.charsTyped += (typed.length + 1);

    // оформить слово на экране
    current.classList.remove('current', 'over');
    current.classList.add(exact ? 'correct' : 'wrong');

    // очистка ввода
    el.input.value = '';

    // перейти к следующему слову / следующему набору
    state.index++;

    if (state.index >= state.words.length) {
      // новый блок слов, но накопленная статистика сохраняется
      state.words = WordGenerator.randomWords({ difficulty: state.difficulty, count: 40 });
      state.index = 0;
      renderWords(state.words);
    } else {
      markCurrentWord();
    }

    updateStatsUIRunning();
  }

  function endTest() {
    // остановить таймер один раз
    if (!state.running) return;

    // финально: если в поле что-то есть — отправим как последнее слово (это честнее, чем просто выкинуть)
    if (normalizeTyped(el.input.value).length > 0) {
      submitCurrentWord({ allowEmpty: false });
    }

    stopTimer();
    el.input.disabled = true;
    setLimitsEnabled(true);

    displayFinalScore();

    // Сохранение попытки (v2)
    const wordAcc = TypingMetrics.percent(state.wordsCorrect, state.wordsSubmitted);
    const charAcc = TypingMetrics.percent(state.correctCharPositions, state.totalCharPositions);
    const stdWpm = TypingMetrics.standardWpm(state.charsTyped, state.durationSec);
    const wWpm = TypingMetrics.wordWpm(state.wordsCorrect, state.durationSec);

    const attempt = {
      version: 2,
      date: new Date().toISOString(),
      durationSec: state.durationSec,
      difficulty: state.difficulty,

      // metrics
      wpmStd: stdWpm,
      wpmWords: wWpm,
      wordAccuracyPercent: wordAcc,
      charAccuracyPercent: charAcc,

      wordsCorrect: state.wordsCorrect,
      wordsSubmitted: state.wordsSubmitted,

      charsTyped: state.charsTyped,
      correctCharPositions: state.correctCharPositions,
      totalCharPositions: state.totalCharPositions
    };

    TypingStorage.saveAttempt(attempt);

    // фокус на restart
    el.restart.focus();
  }

  // --- Reset / init ---
  function resetStateAndUI() {
    stopTimer();

    state.wordsSubmitted = 0;
    state.wordsCorrect = 0;
    state.charsTyped = 0;
    state.correctCharPositions = 0;
    state.totalCharPositions = 0;

    state.index = 0;
    state.words = WordGenerator.randomWords({ difficulty: state.difficulty, count: 40 });

    el.input.disabled = false;
    el.input.value = '';
    el.input.focus();

    el.time.innerText = String(state.durationSec);

    renderWords(state.words);
    updateStatsUIRunning();
    setLimitsEnabled(true);
  }

  // --- Event handlers (улучшения UX: paste/off, пробел/enter, backspace) ---
  el.input.addEventListener('paste', (e) => {
    // античит / стабильность метрик
    e.preventDefault();
  });

  el.input.addEventListener('keydown', (e) => {
    // запрет переносов строки
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!state.running) startIfNeeded();
      submitCurrentWord();
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      if (!state.running) startIfNeeded();
      submitCurrentWord();
      return;
    }

    // старт теста по первому "печатному" вводу (кроме модификаторов)
    const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (isPrintable) startIfNeeded();
  });

  el.input.addEventListener('input', () => {
    if (!state.running && el.input.value.length > 0) startIfNeeded();

    // если IME/мобилка вставила пробел в input — отправим слово
    if (/\s/.test(el.input.value)) {
      // берём только до первого пробела как слово, остаток не поддерживаем в этой версии
      const parts = el.input.value.split(/\s+/);
      el.input.value = parts[0] ?? '';
      submitCurrentWord();
      return;
    }

    updateLiveLetterHighlight();
  });

  // limits
  el.thirty.addEventListener('click', () => {
    if (state.running) return;
    state.durationSec = 30;
    setActive(el.thirty, el.sixty);
    resetStateAndUI();
  });

  el.sixty.addEventListener('click', () => {
    if (state.running) return;
    state.durationSec = 60;
    setActive(el.sixty, el.thirty);
    resetStateAndUI();
  });

  el.beg.addEventListener('click', () => {
    if (state.running) return;
    state.difficulty = 'beginner';
    setActive(el.beg, el.pro);
    resetStateAndUI();
  });

  el.pro.addEventListener('click', () => {
    if (state.running) return;
    state.difficulty = 'pro';
    setActive(el.pro, el.beg);
    resetStateAndUI();
  });

  el.restart.addEventListener('click', () => {
    resetStateAndUI();
  });

  // init
  resetStateAndUI();
})();
