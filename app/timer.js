export class CountdownTimer {
  #now;
  #tickMs;

  constructor({ durationSec, onTick, onDone, tickMs = 200, now = () => Date.now() }) {
    this.durationSec = durationSec;
    this.onTick = onTick;
    this.onDone = onDone;

    this.#tickMs = tickMs;
    this.#now = now;

    this.running = false;
    this.startedAt = null;
    this.endsAt = null;
    this._id = null;
  }

  setDuration(durationSec) {
    this.durationSec = durationSec;
  }

  remainingSec() {
    if (!this.running || !this.endsAt) return this.durationSec;
    const ms = this.endsAt - this.#now();
    return Math.max(0, Math.ceil(ms / 1000));
  }

  start() {
    if (this.running) return;

    this.running = true;
    this.startedAt = this.#now();
    this.endsAt = this.startedAt + this.durationSec * 1000;

    const tick = () => {
      const r = this.remainingSec();
      this.onTick?.(r);
      if (r <= 0) this.onDone?.();
    };

    tick();
    this._id = setInterval(tick, this.#tickMs);
  }

  stop() {
    if (this._id) clearInterval(this._id);
    this._id = null;

    this.running = false;
    this.startedAt = null;
    this.endsAt = null;
  }
}
