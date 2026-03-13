import { setActivePair, setDisabled } from './dom.js';
import { CountdownTimer } from './timer.js';
import { WordView } from './wordView.js';
import { ResultsModal } from './resultsModal.js';

import { TypingMetrics } from '../metrics.js';
import { TypingStorage } from '../storage.js';
import { WordGenerator } from '../words.js';

function normalizeTyped(s) {
  return String(s ?? '').trim();
}

function computeAttempt(state) {
  const wordAcc = TypingMetrics.percent(state.wordsCorrect, state.wordsSubmitted);
  const charAcc = TypingMetrics.percent(state.correctCharPositions, state.totalCharPositions);

  const stdWpm = TypingMetrics.standardWpm(state.charsTyped, state.durationSec);
  const wWpm = TypingMetrics.wordWpm(state.wordsCorrect, state.durationSec);

  return {
    version: 2,
    date: new Date().toISOString(),
    durationSec: state.durationSec,
    difficulty: state.difficulty,
    language: state.language,

    wpmStd: stdWpm,
    wpmWords: wWpm,
    wordAccuracyPercent: wordAcc,
    charAccuracyPercent: charAcc,

    wordsCorrect: state.wordsCorrect,
    wordsSubmitted: state.wordsSubmitted,

    charsTyped: state.charsTyped,
    correctCharPositions: state.correctCharPositions,
    totalCharPositions: state.totalCharPositions,
  };
}

export class TypingTestApp {
  constructor(dom) {
    this.el = dom;

    this.state = {
      durationSec: 30,
      language: 'ru',        // 'ru' | 'en'
      difficulty: 'beginner', // 'beginner' | 'pro'

      running: false,

      words: [],
      index: 0,

      wordsSubmitted: 0,
      wordsCorrect: 0,

      charsTyped: 0,
      correctCharPositions: 0,
      totalCharPositions: 0,
    };

    this.wordView = new WordView({ rootEl: this.el.test });

    this.timer = new CountdownTimer({
      durationSec: this.state.durationSec,
      onTick: (r) => { this.el.time.textContent = String(r); },
      onDone: () => this.end(),
      tickMs: 200,
    });

    this.resultsModal = new ResultsModal({
      modalEl: this.el.resultsModal,
      restartBtnEl: this.el.modalRestartBtn,
      metaEl: this.el.resultsMeta,
      fields: {
        resWpmStd: this.el.resWpmStd,
        resWpmWords: this.el.resWpmWords,
        resAccWords: this.el.resAccWords,
        resAccChars: this.el.resAccChars,
      },
    });
  }

  #setModesEnabled(enabled) {
    setDisabled(
      [this.el.thirty, this.el.sixty, this.el.beg, this.el.pro, this.el.langRu, this.el.langEn],
      !enabled
    );
  }

  #updateStatsUIRunning() {
    const s = this.state;

    this.el.timeName.textContent = 'Время';
    this.el.time.textContent = String(this.timer.running ? this.timer.remainingSec() : s.durationSec);

    this.el.cwName.textContent = 'CW';
    this.el.cw.textContent = String(s.wordsCorrect);

    this.el.wpmName.textContent = 'WPM (std)';
    this.el.wpm.textContent = String(TypingMetrics.standardWpm(s.charsTyped, s.durationSec));

    this.el.accName.textContent = 'Точность (слов)';
    this.el.acc.textContent = `${TypingMetrics.percent(s.wordsCorrect, s.wordsSubmitted)}%`;

    this.el.wpmWords.textContent = String(TypingMetrics.wordWpm(s.wordsCorrect, s.durationSec));
    this.el.accChars.textContent = `${TypingMetrics.percent(s.correctCharPositions, s.totalCharPositions)}%`;
  }

  #displayFinalScore() {
    const a = computeAttempt(this.state);

    this.el.timeName.textContent = 'Готово';
    this.el.time.textContent = '0';

    this.el.cwName.textContent = 'CW/WS';
    this.el.cw.textContent = `${this.state.wordsCorrect}/${this.state.wordsSubmitted}`;

    this.el.wpmName.textContent = 'WPM (std)';
    this.el.wpm.textContent = String(a.wpmStd);

    this.el.accName.textContent = 'Точн. (слов)';
    this.el.acc.textContent = `${a.wordAccuracyPercent}%`;

    this.el.wpmWords.textContent = String(a.wpmWords);
    this.el.accChars.textContent = `${a.charAccuracyPercent}%`;
  }

  #refillWordsIfNeeded() {
    if (this.state.index < this.state.words.length) return;

    this.state.words = WordGenerator.randomWords({
      language: this.state.language,
      difficulty: this.state.difficulty,
      count: 40,
    });
    this.state.index = 0;
    this.wordView.render(this.state.words);
  }

  startIfNeeded() {
    if (this.timer.running) return;

    this.state.running = true;
    this.timer.setDuration(this.state.durationSec);
    this.timer.start();
    this.#setModesEnabled(false);
  }

  submitCurrentWord({ allowEmpty = false, addTrailingSpace = true } = {}) {
    const typedRaw = this.el.input.value;
    const typed = normalizeTyped(typedRaw);

    if (!typed && !allowEmpty) {
      this.el.input.value = '';
      this.wordView.updateLiveHighlight({
        typed: this.el.input.value,
        target: this.state.words[this.state.index] ?? '',
      });
      return;
    }

    const target = this.state.words[this.state.index] ?? '';
    const index = this.state.index;

    this.state.wordsSubmitted += 1;

    const exact = typed === target;
    if (exact) this.state.wordsCorrect += 1;

    const cmp = TypingMetrics.compareWordByPositions(typed, target);
    this.state.correctCharPositions += cmp.correct;
    this.state.totalCharPositions += cmp.total;

    this.state.charsTyped += typed.length + (addTrailingSpace ? 1 : 0);

    this.wordView.markSubmitted({ index, exact });

    this.el.input.value = '';
    this.state.index += 1;

    this.#refillWordsIfNeeded();
    this.wordView.setCurrentIndex(this.state.index);

    this.#updateStatsUIRunning();
  }

  end() {
    if (!this.timer.running) return;

    // если пользователь что-то набрал — отправим как последнее слово (без пробела)
    if (normalizeTyped(this.el.input.value).length > 0) {
      this.submitCurrentWord({ allowEmpty: false, addTrailingSpace: false });
    }

    this.timer.stop();
    this.state.running = false;

    this.el.input.disabled = true;
    this.#setModesEnabled(true);

    this.#displayFinalScore();

    const attempt = computeAttempt(this.state);
    TypingStorage.saveAttempt(attempt);

    this.resultsModal.show(attempt);
  }

  reset() {
    this.resultsModal.hideIfOpen();
    this.timer.stop();

    this.state.running = false;
    this.state.wordsSubmitted = 0;
    this.state.wordsCorrect = 0;
    this.state.charsTyped = 0;
    this.state.correctCharPositions = 0;
    this.state.totalCharPositions = 0;

    this.state.index = 0;
    this.state.words = WordGenerator.randomWords({
      language: this.state.language,
      difficulty: this.state.difficulty,
      count: 40,
    });

    this.el.input.disabled = false;
    this.el.input.value = '';
    this.el.input.focus();

    this.el.time.textContent = String(this.state.durationSec);

    this.wordView.render(this.state.words);
    this.#updateStatsUIRunning();
    this.#setModesEnabled(true);
  }

  // ---- wiring helpers ----

  bindEvents() {
    this.el.input.addEventListener('paste', (e) => e.preventDefault());

    this.el.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.startIfNeeded();
        this.submitCurrentWord();
        return;
      }

      const isPrintable = e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
      if (isPrintable) this.startIfNeeded();
    });

    this.el.input.addEventListener('input', () => {
      if (!this.timer.running && this.el.input.value.length > 0) this.startIfNeeded();

      this.wordView.updateLiveHighlight({
        typed: this.el.input.value,
        target: this.state.words[this.state.index] ?? '',
      });
    });

    // modes
    this.el.thirty.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.durationSec = 30;
      setActivePair(this.el.thirty, this.el.sixty);
      this.reset();
    });

    this.el.sixty.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.durationSec = 60;
      setActivePair(this.el.sixty, this.el.thirty);
      this.reset();
    });

    this.el.beg.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.difficulty = 'beginner';
      setActivePair(this.el.beg, this.el.pro);
      this.reset();
    });

    this.el.pro.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.difficulty = 'pro';
      setActivePair(this.el.pro, this.el.beg);
      this.reset();
    });

    this.el.langRu?.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.language = 'ru';
      setActivePair(this.el.langRu, this.el.langEn);
      this.reset();
    });

    this.el.langEn?.addEventListener('click', () => {
      if (this.timer.running) return;
      this.state.language = 'en';
      setActivePair(this.el.langEn, this.el.langRu);
      this.reset();
    });

    // restart
    this.el.restart.addEventListener('click', () => this.reset());
    this.el.modalRestartBtn?.addEventListener('click', () => this.reset());
  }
}
