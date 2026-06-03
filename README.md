# Lorenzo Stacchio — Academic Website

Static personal/academic website. Pure HTML/CSS/JavaScript — no build step, no
server. Deploys directly on **GitHub Pages**.

Live URL (once deployed): `https://<your-username>.github.io/`

## Structure

```
.
├── index.html            ← Home (hero, news, selected publications)
├── research.html         ← Research profile, projects, awards, service
├── publications.html     ← Full list — auto-loaded from publications.bib
├── teaching.html         ← Courses, TA, seminars, thesis co-supervision
├── cv.html               ← Curriculum vitae
├── publications.bib      ← **Single source of truth for publications**
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── main.js
│       └── publications.js   ← Self-contained BibTeX parser + renderer
├── .nojekyll             ← Tells GitHub Pages to skip Jekyll processing
└── README.md
```

## How publications work

The site reads `publications.bib` directly at page load, parses it client-side
and renders the list grouped by year, with type filters and full-text search.

To add or update a publication, **just edit `publications.bib`** and commit.
No rebuild is needed — opening the page re-reads the file.

### Supported entry types

`@article`, `@inproceedings`, `@phdthesis`, `@misc`.

### Custom (non-standard) fields recognised by the renderer

| Field      | Purpose                                                                  |
|------------|--------------------------------------------------------------------------|
| `selected` | `selected = {true}` → highlighted on the homepage *Selected* section     |
| `award`    | Free-text award badge shown under the title                              |
| `tags`     | Comma-separated chips (e.g., `tags = {XR, AI, Cultural Heritage}`)       |
| `pdf`      | URL — adds a PDF link                                                    |
| `url`      | URL — adds a generic Link                                                |
| `code`     | URL — adds a Code link                                                   |
| `project`  | URL — adds a Project link                                                |
| `video`    | URL — adds a Video link                                                  |
| `doi`      | DOI without prefix — rendered as `https://doi.org/<doi>`                 |
| `cv_id`    | Identifier used in the printed CV (e.g., `[J25a]`)                       |
| `note`     | Free-text note (e.g., "Co-first authors")                                |

### Why not scrape Scopus or Google Scholar?

Browsers block cross-origin requests to those domains (CORS), so a static
GitHub Pages site cannot scrape them on its own. There are three practical
options for keeping the BibTeX up to date:

1. **Edit `publications.bib` by hand** when you publish (current setup).
2. **Export BibTeX from Scopus / WoS / Scholar** periodically and replace
   `publications.bib` (Scopus → *Export → BibTeX*; Scholar Profile → per-entry
   export). The site re-renders automatically.
3. (Advanced) Add a small **GitHub Action** that uses a server-side scraper
   (e.g., `scholarly` Python lib) and commits a fresh `publications.bib`
   nightly. This is optional and lives outside the static site — let me know
   if you want me to wire it up.

## Deploying to GitHub Pages

### Option A — Default user/organisation site `<username>.github.io`

1. Create a repository named **`<your-username>.github.io`** on GitHub.
2. Push the contents of this folder to its `main` branch.
3. GitHub Pages will serve it automatically at `https://<your-username>.github.io/`.

### Option B — Project site (e.g., `lorenzostacchio_website_academic`)

1. Push to `main` of any repo.
2. On GitHub: **Settings → Pages → Build and deployment**:
   - *Source*: **Deploy from a branch**
   - *Branch*: `main` / `/ (root)`
3. The site appears at `https://<username>.github.io/<repo-name>/`.

The `.nojekyll` file in the repo root disables Jekyll processing so that
files/folders starting with underscores are served as-is.

### Custom domain (optional)

Add a `CNAME` file at the repo root containing your domain (e.g., `lorenzostacchio.it`)
and configure DNS as described in
[GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Local preview

No build step. Any static server works:

```powershell
# Python 3
python -m http.server 8000

# Or with Node
npx serve
```

Then open <http://localhost:8000>.

> Opening `index.html` directly with `file://` will **not** work for the
> publications page because `fetch('publications.bib')` is blocked under the
> `file://` protocol. Use a local server.

## Updating content

| What                              | Where                                                       |
|-----------------------------------|-------------------------------------------------------------|
| Add a publication                 | `publications.bib`                                          |
| Feature it on the homepage        | Add `selected = {true}` to its BibTeX entry                 |
| Add a news item                   | `index.html` → `<ul class="news-list">`                     |
| Update bio / contact              | `index.html` (hero) and `cv.html` (contact section)         |
| Update teaching courses           | `teaching.html`                                             |
| Update research projects / awards | `research.html` and/or `cv.html`                            |
| Replace avatar placeholder        | Drop a square image into `assets/img/avatar.jpg` and swap   |
|                                   | the `<div class="avatar-placeholder">` for `<img class="avatar" src="assets/img/avatar.jpg" alt="…">` |
| Edit colors / typography          | `assets/css/style.css` (`:root { … }`)                      |

## Accessibility &amp; performance

- Single 14 KB CSS file, ~10 KB of JS, no external dependencies, no trackers.
- Semantic HTML; sticky nav with mobile-friendly menu.
- Print stylesheet hides nav/footer so the CV prints cleanly to PDF.

## License

Content (text, CV, publication metadata) © Lorenzo Stacchio.
Code (HTML/CSS/JS scaffolding) is MIT-licensed.
