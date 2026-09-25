# Jaime Aguilar Guerrero — Research portfolio

Responsive static HTML/CSS portfolio for `https://jimmydx.github.io/research-homepage/`. No build, backend, API keys, or JavaScript dependency for navigation and content. The existing MIT license is preserved.

## Local preview

Serve the parent directory so the site is tested with its GitHub Pages project prefix:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory ..
```

Open `http://localhost:8765/research-homepage/?preview=1`. The `preview=1` option shows the three unsupplied photo slots **on loopback hosts only**. Without that option, or without JavaScript, the placeholders stay hidden and all research content remains available.

## Before publishing

- Supply the portrait, CEDAR 2026, and COSPAR 2026 photographs. Keep full-resolution originals outside the deployment directory. Create optimized website derivatives, preserve natural colors, and confirm captions, photographer credits, alt text, and crop focal points.
- Portrait frame: 4:5. Conference frames: 3:2. Accept originals in either orientation; do not overwrite them.
- Replace each `.photo-pending` figure with a responsive `<picture>` and its real caption. Keep `.hero.has-portrait` in the static HTML and remove `hidden` from the conference section. Remove the loopback-only placeholder code from `assets/js/main.js` when all photos are supplied.
- No CV download is linked. The September 16 PDF remains an unconfirmed draft, and the obsolete website copy has been removed (it remains in Git history). Add a download only after reviewing a confirmed final PDF.
- Run `python3 scripts/check_site.py`, then `python3 scripts/check_site.py --publish`. The publication check intentionally fails while photos are pending.
- Check desktop/mobile, keyboard focus, reduced motion, and JavaScript-disabled rendering. Review image crops, every external link, and any PDF downloads.
- Merge the completed work into `main`. Configure GitHub Pages to deploy from `main` / root, then check the live homepage, images, and links under `/research-homepage/`.
- Use the homepage URL in the NASA reviewer form only after the live deployment is verified.

## Editing

- `index.html`: biography, research features, selected publications, contact links.
- `assets/css/style.css`: shared colors, type, layouts, breakpoints, focus, and reduced-motion behavior.
- `assets/js/main.js`: optional year update and temporary local photo preview.
- `CONTENT_SOURCES.md`: public references and scientific image provenance.

No demo video, generated scientific illustration, or unverified final CV is presented in the page.
