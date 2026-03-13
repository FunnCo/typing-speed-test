export class WordView {
  constructor({ rootEl }) {
    this.rootEl = rootEl;
    this.words = [];
    this.wordEls = [];
    this.currentIndex = 0;
    this.prevIndex = null;
  }

  render(words) {
    this.words = Array.isArray(words) ? words : [];
    this.wordEls = [];
    this.currentIndex = 0;
    this.prevIndex = null;

    this.rootEl.textContent = '';

    const frag = document.createDocumentFragment();

    this.words.forEach((word, idx) => {
      const w = document.createElement('span');
      w.className = 'word';

      for (let i = 0; i < word.length; i++) {
        const ch = document.createElement('span');
        ch.className = 'char';
        ch.textContent = word[i];
        w.appendChild(ch);
      }

      this.wordEls[idx] = w;
      frag.appendChild(w);

      const space = document.createElement('span');
      space.className = 'space';
      space.textContent = ' ';
      frag.appendChild(space);
    });

    this.rootEl.appendChild(frag);
    this.setCurrentIndex(0);
  }

  setCurrentIndex(idx) {
    const prev = this.prevIndex;
    if (prev != null && this.wordEls[prev]) {
      this.wordEls[prev].classList.remove('current', 'over');
    }

    this.currentIndex = idx;
    this.prevIndex = idx;

    const cur = this.wordEls[idx];
    if (cur) cur.classList.add('current');
  }

  markSubmitted({ index, exact }) {
    const el = this.wordEls[index];
    if (!el) return;

    el.classList.remove('current', 'over');
    el.classList.toggle('correct', !!exact);
    el.classList.toggle('wrong', !exact);
  }

  updateLiveHighlight({ typed, target }) {
    const cur = this.wordEls[this.currentIndex];
    if (!cur) return;

    const t = String(typed ?? '');
    const s = String(target ?? '');

    cur.classList.toggle('over', t.length > s.length);

    const chars = cur.querySelectorAll('.char');
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      ch.classList.remove('correct', 'wrong');

      if (i >= t.length) continue;
      ch.classList.add(t[i] === s[i] ? 'correct' : 'wrong');
    }
  }
}
