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

// Keep native anchor links clear of the actual, possibly wrapped, sticky header.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const links = [...siteHeader.querySelectorAll('nav a[href^="#"]')];
  const sections = links.map(link => ({link, section: document.querySelector(link.getAttribute('href'))}))
    .filter(item => item.section);
  let navFrame = 0;
  function updateNavigation() {
    navFrame = 0;
    const threshold = siteHeader.getBoundingClientRect().height + 32;
    let current;
    for (const item of sections) {
      if (item.section.getBoundingClientRect().top <= threshold) current = item.link;
    }
    if (scrollY > 0 && scrollY + innerHeight >= document.documentElement.scrollHeight - 2) {
      current = sections.at(-1)?.link;
    }
    for (const link of links) {
      if (link === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  function scheduleNavigation() {
    if (!navFrame) navFrame = requestAnimationFrame(updateNavigation);
  }
  function measureHeader() {
    document.documentElement.style.setProperty('--header-height', `${siteHeader.getBoundingClientRect().height}px`);
    scheduleNavigation();
  }
  if ('ResizeObserver' in window) new ResizeObserver(measureHeader).observe(siteHeader);
  window.addEventListener('resize', measureHeader);
  window.addEventListener('scroll', scheduleNavigation, {passive: true});
  window.addEventListener('load', measureHeader, {once: true});
  measureHeader();
}

// Native dialogs provide Escape dismissal, modal focus, and a larger view of the data.
const mediaDialog = document.getElementById('media-dialog');
if (mediaDialog && typeof mediaDialog.showModal === 'function') {
  const body = mediaDialog.querySelector('.media-dialog-body');
  const title = mediaDialog.querySelector('#media-dialog-title');
  let opener;
  let movedFigure;
  let placeholder;
  const announceView = () => document.dispatchEvent(new Event('media-view-change'));
  function openMedia(trigger, label) {
    opener = trigger;
    title.textContent = label;
    document.body.classList.add('has-media-dialog');
    mediaDialog.showModal();
    announceView();
  }
  document.querySelectorAll('[data-enlarge-image]').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', 'media-dialog');
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const source = link.closest('figure');
      const figure = document.createElement('figure');
      const image = document.createElement('img');
      image.src = link.href;
      image.alt = source.querySelector('img').alt;
      figure.append(image, source.querySelector('figcaption').cloneNode(true));
      body.replaceChildren(figure);
      openMedia(link, 'AWE observations and weather context');
    });
  });
  const enlargeModel = document.querySelector('[data-enlarge-model]');
  if (enlargeModel) {
    enlargeModel.hidden = false;
    enlargeModel.addEventListener('click', () => {
      movedFigure = enlargeModel.closest('figure');
      const size = movedFigure.getBoundingClientRect();
      placeholder = document.createElement('div');
      placeholder.className = 'xr-model-figure';
      placeholder.style.width = `${size.width}px`;
      placeholder.style.height = `${size.height}px`;
      placeholder.setAttribute('aria-hidden', 'true');
      movedFigure.before(placeholder);
      // Move the existing viewer; never create a second WebGL model/context.
      body.replaceChildren(movedFigure);
      openMedia(enlargeModel, 'Interactive AWE visualization');
    });
  }
  mediaDialog.querySelector('[data-close-media]').addEventListener('click', () => mediaDialog.close());
  mediaDialog.addEventListener('click', event => {
    const bounds = mediaDialog.getBoundingClientRect();
    if (event.target === mediaDialog && (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom)) mediaDialog.close();
  });
  mediaDialog.addEventListener('close', () => {
    if (movedFigure) placeholder.replaceWith(movedFigure);
    movedFigure = placeholder = null;
    body.replaceChildren();
    document.body.classList.remove('has-media-dialog');
    announceView();
    opener?.focus({preventScroll: true});
  });
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
  // Cards in the final visible group share a stop; never navigate to it twice.
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
  const motionButton = document.querySelector('[data-motion-toggle]');
  document.querySelector('.model-controls').hidden = false;
  let visible = false;
  let started = false;
  let failed = false;
  let ready = false;
  // An explicit Play choice can override reduced motion; a changed preference resets it.
  let motionChoice = null;
  if (!mobile) xrModel.setAttribute('src', xrModel.dataset.desktopSrc);
  if (mobile) xrModel.setAttribute('shadow-intensity', '0');
  const syncMotion = () => {
    const paused = motionChoice ?? reducedMotion.matches;
    const obscured = mediaDialog?.open && !mediaDialog.contains(xrModel);
    const animate = visible && !document.hidden && !paused && !failed && !obscured;
    xrModel.toggleAttribute('auto-rotate', animate);
    xrModel.toggleAttribute('autoplay', animate);
    if (animate) xrModel.play?.();
    else xrModel.pause?.();
    motionButton.textContent = paused ? 'Play' : 'Pause';
    motionButton.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} model animation`);
    motionButton.disabled = !ready || failed;
  };
  const showFallback = () => {
    failed = true;
    status.hidden = false;
    syncMotion();
    xrModel.showPoster?.();
  };
  syncMotion();
  motionButton.addEventListener('click', () => {
    motionChoice = !(motionChoice ?? reducedMotion.matches);
    syncMotion();
  });
  reducedMotion.addEventListener?.('change', () => { motionChoice = null; syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);
  document.addEventListener('media-view-change', syncMotion);
  xrModel.addEventListener('load', () => { ready = true; syncMotion(); });
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
