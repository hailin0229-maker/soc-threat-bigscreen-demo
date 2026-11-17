(() => {
  const buttons = Array.from(document.querySelectorAll('[data-map-mode]'));
  if (!buttons.length) return;
  let mode = '3d';
  let initStarted = false;

  const sync = (next) => {
    buttons.forEach((b) => {
      const on = b.dataset.mapMode === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };

  const show2d = () => {
    if (!window.__SOC_INIT_2D__) {
      window.setTimeout(show2d, 100);
      return;
    }
    if (!initStarted) {
      initStarted = true;
      document.body.classList.add('map-2d-loading');
      Promise.resolve(window.__SOC_INIT_2D__()).catch(() => {}).finally(() => {
        document.body.classList.remove('map-2d-loading');
        if (mode === '2d' && window.__SOC_2D__) requestAnimationFrame(() => window.__SOC_2D__.show());
      });
    }
    const reveal = () => {
      if (!window.__SOC_2D__) {
        window.setTimeout(reveal, 100);
        return;
      }
      requestAnimationFrame(() => window.__SOC_2D__.show());
    };
    reveal();
  };

  const setMode = (next) => {
    mode = next;
    document.body.classList.toggle('map-2d', next === '2d');
    sync(next);
    if (next === '2d') show2d();
    else window.__SOC_2D__?.hide?.();
  };

  buttons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mapMode)));
  sync(mode);
})();
