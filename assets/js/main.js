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
  let current = 0;
  const offset = slide => slide.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
  function update() {
    current = slides.reduce((best, slide, i) => Math.abs(offset(slide) - track.scrollLeft) < Math.abs(offset(slides[best]) - track.scrollLeft) ? i : best, 0);
    // The last slide can stop short of the left edge when it is narrower than the track.
    if (track.scrollLeft > 0 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 2) current = slides.length - 1;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    status.textContent = `${current + 1} / ${slides.length}`;
  }
  function move(step) {
    const target = Math.max(0, Math.min(slides.length - 1, current + step));
    track.scrollTo({left: offset(slides[target]), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
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
