# RC Portfolio

Personal portfolio of Riccardo Cammarata, a financial and data engineer. The site shows real work where fragile manual workflows and scanned paperwork were rebuilt into dependable Python and SQL pipelines, clean dashboards, and clear financial analysis.

**Live site:** https://ris8-it.github.io/RC_Portfolio/

## Overview

The site is a static Quarto project. It is built from Markdown and HTML, styled with a single SCSS theme, and uses a small amount of vanilla JavaScript for the animations. There is no front-end framework. The output is plain HTML hosted on GitHub Pages.

## Structure

```
.
├── _quarto.yml            # Site config: navbar, theme, listing, favicon
├── index.qmd              # Landing page (hero, KPIs, featured tiles)
├── about.qmd              # About and workflow
├── projects/
│   ├── index.qmd          # Projects listing (auto-generated grid)
│   ├── sap-dashboard.qmd      # Revenue and Expenditure pipeline
│   ├── email-pipeline.qmd     # Email pipeline and submission dashboard
│   ├── invoice-checker.qmd    # Invoice reconciliation and dashboard
│   ├── docs-system.qmd        # Living documentation system
│   ├── crypto-regulation.qmd  # Crypto regulation analysis (Fama-French)
│   └── cinema-model.qmd       # Financial analysis from scanned statements
├── templates/             # Documentation template and sample output
├── styles/
│   └── theme.scss         # Design system: colours, fonts, animations
├── assets/
│   ├── site.js            # Hexagon field, reveals, lightbox, code tour
│   ├── head.html          # Fonts and head includes
│   └── after-body.html    # End-of-body includes
├── images/                # Screenshots, diagrams, SVGs, favicon
└── .github/workflows/
    └── publish.yml        # Builds and deploys to GitHub Pages
```

## Tech stack

- **Quarto** for the static site
- **SCSS** for the design system (dark navy to violet gradient, Fraunces and DM Sans, JetBrains Mono)
- **Vanilla JavaScript** for animations and interactions
- **GitHub Pages** for hosting, deployed through GitHub Actions

## Run it locally

You need Quarto installed. Then, from the project root:

```bash
quarto preview
```

This serves the site with live reload. If the styles look stale after an edit, hard refresh the browser (Ctrl+F5). If a change still does not show, stop the preview, delete the `.quarto/` and `_site/` folders, and run `quarto preview` again to clear the build cache.

To produce the static output without serving it:

```bash
quarto render
```

## Publish

The repository includes a GitHub Actions workflow, so publishing is a normal push:

```bash
git add -A
git commit -m "Update site"
git push origin main
```

The workflow renders the site and deploys it to the `gh-pages` branch. Progress is visible in the **Actions** tab. The live site updates after the run completes.

One-time setup, if Pages is not configured yet:

- **Settings → Pages → Build and deployment → Source: GitHub Actions**
- **Settings → Actions → General → Workflow permissions → Read and write permissions**

As an alternative to the workflow, you can render and push in one step:

```bash
quarto publish gh-pages
```

## Adding a new case study

1. Copy an existing file in `projects/` as a starting point.
2. Set the front matter: `title`, `description`, `date`, `categories`, and `image`.
3. Write the case as problem, then approach, then outcome. Lead with the result.
4. Add any images to `images/` and reference them with `../images/your-file.png`.

The new page appears automatically in the Projects listing, sorted by date.

## Notes

- All screenshots are sanitized. Logos, names, team references, file paths, and identifying codes are removed before anything is published.
- Figures and numbers in the two analysis case studies are illustrative placeholders unless stated otherwise.

## Contact

- GitHub: https://github.com/Ris8-it
- LinkedIn: https://www.linkedin.com/in/riccardo-cammarata-00s
- Email: riccardocammarata00@gmail.com
