# Professional Research Homepage

Single-page static site for a research-focused professional homepage, ready for GitHub Pages project-site deployment.

## Files

- `index.html` - Canonical content source and page structure
- `assets/css/style.css` - Visual system, layout, responsive behavior, accessibility styling
- `assets/js/main.js` - Mobile nav behavior, reveal animations, footer year update
- `assets/images/*` - Local SVG visuals (hero, project graphics, social preview)
- `assets/docs/CV.pdf` - Placeholder CV PDF (replace with your real CV while keeping filename)
- `assets/docs/AGU-2025-abstract.pdf` - AGU abstract PDF used in selected outputs
- `assets/docs/CEDAR-2025-slides.pdf` - CEDAR presentation slides used in selected outputs

## Publish On GitHub Pages (Project Site)

1. Create a GitHub repository (any name, for example `research-homepage`).
2. Push this folder contents to the repository root.
3. In GitHub, open `Settings` -> `Pages`.
4. Set Source to `Deploy from a branch`.
5. Choose branch `main`, folder `/ (root)`, then click Save.
6. Wait for GitHub Pages to build, then open:
   `https://<username>.github.io/<repo>/`

Current `index.html` metadata is configured for:

- `https://jimmydx.github.io/research-homepage/`

## Before Going Live

Update these placeholders in `index.html`:

- ORCID profile link (`https://orcid.org/` placeholder)
- Google Scholar profile link (currently placeholder)
- Any project media embeds you want to replace

Replace this file with your real CV:

- `assets/docs/CV.pdf`

## Notes

- All asset paths are relative, so the site works for GitHub project URLs.
- Embedded video sources are currently demo links.
- No tracking scripts are included.
