export function byId(id, { required = true } = {}) {
  const node = document.getElementById(id);
  if (!node && required) throw new Error(`Missing required element #${id}`);
  return node;
}

export function setPressed(el, pressed) {
  if (!el) return;
  el.classList.toggle('active', pressed);
  el.setAttribute('aria-pressed', String(pressed));
}

export function setActivePair(btnOn, btnOff) {
  setPressed(btnOn, true);
  setPressed(btnOff, false);
}

export function setDisabled(elements, disabled) {
  elements.filter(Boolean).forEach((el) => {
    el.disabled = disabled;
    el.setAttribute('aria-disabled', String(disabled));
  });
}

export function getDom() {
  return {
    test: byId('textDisplay'),
    input: byId('textInput'),
    restart: byId('restartBtn'),

    thirty: byId('thirty'),
    sixty: byId('sixty'),
    beg: byId('beg'),
    pro: byId('pro'),

    langRu: byId('langRu', { required: false }),
    langEn: byId('langEn', { required: false }),

    timeName: byId('timeName'),
    time: byId('time'),

    cwName: byId('cwName'),
    cw: byId('cw'),

    wpmName: byId('wpmName'),
    wpm: byId('wpm'),

    accName: byId('accName'),
    acc: byId('acc'),

    wpmWords: byId('wpmWords'),
    accChars: byId('accChars'),

    // Results modal
    resultsModal: byId('resultsModal', { required: false }),
    modalRestartBtn: byId('modalRestartBtn', { required: false }),
    resultsMeta: byId('resultsMeta', { required: false }),
    resWpmStd: byId('resWpmStd', { required: false }),
    resWpmWords: byId('resWpmWords', { required: false }),
    resAccWords: byId('resAccWords', { required: false }),
    resAccChars: byId('resAccChars', { required: false }),
  };
}
