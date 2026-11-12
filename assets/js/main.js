// Content and navigation work without JavaScript.
const year = document.getElementById('current-year');
if (year) year.textContent = String(new Date().getFullYear());

// Unsupplied photos are visible only in an explicitly requested local preview.
const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  && new URLSearchParams(location.search).get('preview') === '1';
if (isLocalPreview) {
  document.querySelectorAll('[data-photo-slot], [data-content-pending]').forEach(slot => {
    slot.hidden = false;
  });
  document.querySelector('.hero')?.classList.add('has-portrait');
}

// Native horizontal scrolling remains available without JavaScript; no autoplay.
const track = document.getElementById('conference-track');
if (track) {
  const slides = [...track.querySelectorAll('.conference-slide')].filter(slide => !slide.hidden);
  const controls = document.querySelector('.carousel-controls');
  const previous = controls.querySelector('[data-carousel-prev]');
  const next = controls.querySelector('[data-carousel-next]');
  const status = controls.querySelector('.carousel-status');
  const tolerance = 2;
  const offset = slide => slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  // The final two cards share a stop on desktop; never navigate to it twice.
  function stops() {
    return slides.map(slide => Math.min(offset(slide), maxScroll()))
      .filter((position, i, positions) => i === 0 || position - positions[i - 1] > tolerance);
  }
  function update() {
    previous.disabled = track.scrollLeft <= tolerance;
    next.disabled = track.scrollLeft >= maxScroll() - tolerance;
    const bounds = track.getBoundingClientRect();
    const visible = slides.map((slide, index) => ({index, bounds: slide.getBoundingClientRect()}))
      .filter(slide => slide.bounds.left >= bounds.left - tolerance && slide.bounds.right <= bounds.right + tolerance);
    // During a resize or manual drag there may be no fully visible card yet.
    if (!visible.length) return;
    const first = visible[0].index + 1;
    const last = visible[visible.length - 1].index + 1;
    const label = `${first === last ? first : `${first}–${last}`} / ${slides.length}`;
    if (status.textContent !== label) status.textContent = label;
  }
  function move(step) {
    const positions = stops();
    const current = positions.reduce((best, position, i) => Math.abs(position - track.scrollLeft) < Math.abs(positions[best] - track.scrollLeft) ? i : best, 0);
    const target = Math.max(0, Math.min(positions.length - 1, current + step));
    track.scrollTo({left: positions[target], behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
  });
  let settle;
  track.addEventListener('scroll', () => { clearTimeout(settle); settle = setTimeout(update, 120); }, {passive: true});
  window.addEventListener('resize', update);
  controls.hidden = slides.length < 2;
  update();
}

// Select the asset before importing the viewer so mobile never fetches the desktop GLB.
const xrModel = document.getElementById('xr-awe-model');
if (xrModel) {
  const status = document.getElementById('xr-model-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px), (pointer: coarse)').matches;
  let visible = false;
  let started = false;
  let failed = false;
  if (!mobile) xrModel.setAttribute('src', xrModel.dataset.desktopSrc);
  if (mobile) xrModel.setAttribute('shadow-intensity', '0');
  const syncMotion = () => {
    const animate = visible && !document.hidden && !reducedMotion.matches && !failed;
    xrModel.toggleAttribute('auto-rotate', animate);
    xrModel.toggleAttribute('autoplay', animate);
    if (animate) xrModel.play?.();
    else xrModel.pause?.();
  };
  const showFallback = () => {
    failed = true;
    status.hidden = false;
    syncMotion();
    xrModel.showPoster?.();
  };
  syncMotion();
  reducedMotion.addEventListener?.('change', syncMotion);
  document.addEventListener('visibilitychange', syncMotion);
  xrModel.addEventListener('load', syncMotion);
  xrModel.addEventListener('pause', () => { xrModel.dataset.playback = 'paused'; });
  xrModel.addEventListener('play', () => { xrModel.dataset.playback = 'playing'; });
  xrModel.addEventListener('error', showFallback);
  const loadViewer = async () => {
    if (started) return;
    started = true;
    self.ModelViewerElement = self.ModelViewerElement || {};
    self.ModelViewerElement.meshoptDecoderLocation = 'https://cdn.jsdelivr.net/npm/meshoptimizer@0.25.0/meshopt_decoder.js';
    if (mobile) self.ModelViewerElement.powerPreference = 'low-power';
    try {
      const {ModelViewerElement} = await import('https://cdn.jsdelivr.net/npm/@google/model-viewer@4.3.1/dist/model-viewer.min.js');
      ModelViewerElement.modelCacheSize = 0;
      if (mobile) ModelViewerElement.minimumRenderScale = 0.25;
      syncMotion();
    } catch {
      showFallback();
    }
  };
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) loadViewer();
      syncMotion();
    });
    observer.observe(xrModel);
  } else {
    visible = true;
    loadViewer();
  }
}
