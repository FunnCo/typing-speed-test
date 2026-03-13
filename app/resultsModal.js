export class ResultsModal {
  constructor({ modalEl, restartBtnEl, metaEl, fields }) {
    this.modalEl = modalEl;
    this.restartBtnEl = restartBtnEl;
    this.metaEl = metaEl;
    this.fields = fields;

    this._instance = null;
  }

  #getInstance() {
    if (!this.modalEl) return null;
    if (!this._instance) {
      this._instance = new bootstrap.Modal(this.modalEl, { backdrop: 'static', keyboard: true });
    }
    return this._instance;
  }

  hideIfOpen() {
    if (!this._instance) return;
    this._instance.hide();
  }

  show(attempt) {
    const m = this.#getInstance();
    if (!m) return;

    const diffLabel = attempt.difficulty === 'pro' ? 'про' : 'база';
    const langLabel = attempt.language === 'en' ? 'EN' : 'RU';
    const dateLabel = new Date(attempt.date).toLocaleString();

    if (this.metaEl) {
      this.metaEl.textContent = `Язык: ${langLabel} • Режим: ${diffLabel} • Лимит: ${attempt.durationSec}s • ${dateLabel}`;
    }

    const { resWpmStd, resWpmWords, resAccWords, resAccChars } = this.fields || {};
    if (resWpmStd) resWpmStd.textContent = String(attempt.wpmStd);
    if (resWpmWords) resWpmWords.textContent = String(attempt.wpmWords);
    if (resAccWords) resAccWords.textContent = `${attempt.wordAccuracyPercent}%`;
    if (resAccChars) resAccChars.textContent = `${attempt.charAccuracyPercent}%`;

    m.show();

    // уводим фокус в модалку (чтобы пробел/Enter не триггерили элементы под ней)
    setTimeout(() => this.restartBtnEl?.focus(), 0);
  }
}
