# Jaime Aguilar Guerrero — Research portfolio

Responsive static HTML/CSS portfolio for `https://jimmydx.github.io/research-homepage/`. No build, backend, API keys, or JavaScript dependency for navigation and content. The existing MIT license is preserved.

## Local preview

Serve the parent directory so the site is tested with its GitHub Pages project prefix:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory ..
```

Open `http://localhost:8765/research-homepage/`. All supplied portrait and conference photographs are included; no preview-only photo slots remain.

## Publishing

- The portrait and conference photographs are supplied by Jaime; optimized responsive derivatives are stored in `assets/images/`. Full-resolution originals remain outside the deployment directory.
- The unfinished CV draft is not linked for download.
- Run `python3 scripts/check_site.py` and `python3 scripts/check_site.py --publish` before release. Check desktop/mobile layouts, keyboard navigation, reduced motion, and JavaScript-disabled content.
- GitHub Pages serves the project from `main` at the repository root. Verify the homepage and image assets under `/research-homepage/` after deployment.

## Editing

- `index.html`: biography, research features, selected publications, contact links.
- `assets/css/style.css`: shared colors, type, layouts, breakpoints, focus, and reduced-motion behavior.
- `assets/js/main.js`: optional year update and temporary local photo preview.
- `CONTENT_SOURCES.md`: public references and scientific image provenance.

No demo video, generated scientific illustration, or unverified final CV is presented in the page.
