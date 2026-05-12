# Static Portfolio for GitHub Pages

This folder contains a fully static version of the portfolio and CV pages, ready to deploy directly to GitHub Pages.

## Included files

- `index.html` — landing page for the portfolio
- `cv.html` — CV page with browser-friendly print / save-as-PDF flow
- `styles.css` — shared styles
- `script.js` — mobile menu, reveal animation, contact mailto flow, CV print action
- `avatar.jpeg` — portfolio image asset

## Automatic deploy with GitHub Pages

This repository includes the workflow:

- `.github/workflows/deploy-pages.yml`

It automatically deploys the contents of `site/` when you push changes to:

- `main`
- `master`

It also supports manual deploy from the GitHub Actions tab with `workflow_dispatch`.

## One-time GitHub setup

1. Open the repository on GitHub.
2. Go to `Settings` -> `Pages`.
3. In `Build and deployment`, set `Source` to `GitHub Actions`.
4. Push any change inside `site/` or run the workflow manually.

After the first successful run, GitHub Pages will publish the static site at:

```text
https://<your-github-username>.github.io/<repository-name>/
```

## Notes

- The static page does not depend on the backend in `apps/api`.
- The contact form uses `mailto:` so it still works on GitHub Pages.
- The CV download button opens the browser print dialog so visitors can save the page as PDF.
- If your default branch is not `main` or `master`, update `.github/workflows/deploy-pages.yml`.
