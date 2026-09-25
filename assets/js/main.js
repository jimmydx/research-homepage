// Content and navigation work without JavaScript.
const year = document.getElementById('current-year');
if (year) year.textContent = String(new Date().getFullYear());

// Unsupplied photos are visible only in an explicitly requested local preview.
const isLocalPreview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)
  && new URLSearchParams(location.search).get('preview') === '1';
if (isLocalPreview) {
  document.querySelectorAll('[data-photo-slot], [data-photo-section]').forEach(slot => {
    slot.hidden = false;
  });
  document.querySelector('.hero')?.classList.add('has-portrait');
}
