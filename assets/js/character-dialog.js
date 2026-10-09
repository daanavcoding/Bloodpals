(() => {
  const dialog = document.querySelector('[data-character-dialog]');
  if (!dialog) return;
  const content = dialog.querySelector('[data-dialog-content]');
  const closeButton = dialog.querySelector('[data-dialog-close]');
  const shell = document.querySelector('.site-shell');
  const native = typeof dialog.showModal === 'function';
  const templates = new Map(Array.from(document.querySelectorAll('[data-character-template]'))
    .map((template) => [template.dataset.characterTemplate, template]));
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(overlay, dialog);
  let currentId = null;
  let lastTrigger = null;
  let savedScroll = 0;
  let oldBodyStyle = '';
  let oldAriaHidden = null;
  let gesture = null;
  let closing = false;
  const focusableSelector = 'a[href], button:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';
  const hashId = () => (location.hash.match(/^#personaje=([a-z0-9-]+)$/) || [])[1];
  document.documentElement.classList.add('has-js');

  function open(id, trigger, historyChange) {
    const template = templates.get(id);
    if (!template) return false;
    if (!currentId) {
      savedScroll = window.scrollY;
      oldBodyStyle = document.body.getAttribute('style') || '';
      oldAriaHidden = shell.getAttribute('aria-hidden');
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + savedScroll + 'px';
      document.body.style.width = '100%';
      document.documentElement.classList.add('dialog-open');
      shell.setAttribute('aria-hidden', 'true');
      shell.inert = true;
    }
    lastTrigger = trigger || document.querySelector('[data-character-link="' + id + '"]');
    currentId = id;
    closing = false;
    content.replaceChildren(template.content.cloneNode(true));
    if (historyChange) history.pushState({ ...history.state, bloodpalsCharacter: id }, '', '#personaje=' + id);
    if (native) {
      if (!dialog.open) dialog.showModal();
    } else {
      overlay.hidden = false;
      dialog.setAttribute('open', '');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.classList.add('dialog-fallback');
      document.documentElement.classList.add('dialog-fallback-open');
    }
    closeButton.focus({ preventScroll: true });
    return true;
  }

  function close() {
    if (!currentId) return;
    currentId = null;
    closing = false;
    gesture = null;
    if (native && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
    overlay.hidden = true;
    dialog.classList.remove('dialog-fallback');
    document.documentElement.classList.remove('dialog-open', 'dialog-fallback-open');
    shell.inert = false;
    if (oldAriaHidden === null) shell.removeAttribute('aria-hidden');
    else shell.setAttribute('aria-hidden', oldAriaHidden);
    document.body.setAttribute('style', oldBodyStyle);
    const oldBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, savedScroll);
    document.documentElement.style.scrollBehavior = oldBehavior;
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    content.replaceChildren();
    lastTrigger = null;
  }

  function requestClose() {
    if (!currentId || closing) return;
    closing = true;
    if (history.state && history.state.bloodpalsCharacter === currentId) history.back();
    else {
      history.replaceState(history.state, '', location.pathname + location.search);
      close();
    }
  }
  document.addEventListener('click', (event) => {
    if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('[data-character-link]');
    if (link && open(link.dataset.characterLink, link, true)) event.preventDefault();
  });
  closeButton.addEventListener('click', requestClose);
  overlay.addEventListener('click', requestClose);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); requestClose(); });
  dialog.addEventListener('click', (event) => { if (event.target === dialog) requestClose(); });
  document.addEventListener('focusin', (event) => {
    if (currentId && !dialog.contains(event.target)) closeButton.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', (event) => {
    if (!currentId) return;
    if (event.key === 'Escape') { event.preventDefault(); requestClose(); return; }
    if (event.key !== 'Tab') return;
    const nodes = Array.from(dialog.querySelectorAll(focusableSelector)).filter((node) => node.getClientRects().length);
    const first = nodes[0] || closeButton;
    const last = nodes[nodes.length - 1] || closeButton;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  // Passive touch listeners preserve vertical reading and browser zoom.
  dialog.addEventListener('touchstart', (event) => {
    gesture = event.touches.length === 1 && !event.target.closest('a, button, summary')
      ? { x: event.touches[0].clientX, y: event.touches[0].clientY, at: Date.now() } : null;
  }, { passive: true });
  dialog.addEventListener('touchmove', (event) => {
    if (!gesture || event.touches.length !== 1) { gesture = null; return; }
    if (Math.abs(event.touches[0].clientY - gesture.y) > 55) gesture = null;
  }, { passive: true });
  dialog.addEventListener('touchend', (event) => {
    const start = gesture;
    gesture = null;
    if (!start || event.touches.length || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (dx < -80 && Math.abs(dx) > Math.abs(dy) * 2 && Math.abs(dy) < 55 && Date.now() - start.at < 1000
      && !String(window.getSelection())) requestClose();
  }, { passive: true });
  dialog.addEventListener('touchcancel', () => { gesture = null; }, { passive: true });
  const sync = () => {
    const id = hashId();
    if (id && templates.has(id)) { if (currentId !== id) open(id, null, false); }
    else close();
  };
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
  sync();
})();
