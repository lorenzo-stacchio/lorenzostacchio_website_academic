# Lorenzo Stacchio — Academic Website

Static personal/academic website. Pure HTML/CSS/JavaScript — no build step, no
server. Deploys directly on **GitHub Pages**.

> 💡 **All content is data-driven.** You only edit JSON files in `data/` and the
> BibTeX file `publications.bib`. The HTML pages are layout shells — they don't
> contain the actual content.

Live URL (once deployed): `https://<your-username>.github.io/`

## Structure

```
.
├── index.html            ← Home shell (hero, news, selected pubs slots)
├── research.html         ← Research shell
├── publications.html     ← Publications shell — loads from publications.bib
├── teaching.html         ← Teaching shell — loads from data/teaching.json
├── cv.html               ← CV shell
│
├── data/                 ← **Single source of truth for textual content**
│   ├── profile.json      ← Name, role, bio, social links, IDs
│   ├── news.json         ← Homepage news items
│   ├── positions.json    ← Current + past positions (CV)
│   ├── education.json    ← Education timeline (CV)
│   ├── teaching.json     ← Courses (with multi-year support), TA, theses, seminars, outreach
│   ├── research.json     ← Profile paragraphs, interests, theoretical & applied contributions, groups
│   ├── projects.json     ← Funded research projects
│   ├── awards.json       ← Awards list
│   ├── service.json      ← Editorial, chair, memberships
│   └── talks.json        ← Invited talks
│
├── publications.bib      ← Bibliography (auto-rendered with grouping/search/filters)
│
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── render.js         ← Declarative JSON → HTML renderer
│       ├── publications.js   ← Self-contained BibTeX parser + renderer
│       └── main.js           ← Mobile nav + active link
│
├── .nojekyll             ← Tells GitHub Pages to skip Jekyll processing
└── README.md
```

## How the data-driven system works

Each HTML page contains empty placeholder elements with two data attributes:

```html
<div data-render="news"     data-source="data/news.json"></div>
<div data-render="cards"    data-source="data/research.json#interests"></div>
<div data-render="courses"  data-source="data/teaching.json#official_courses"></div>
```

`render.js` scans these on page load, fetches the matching JSON file (and dives
into the optional `#path.to.field`), then renders it using a named template.

### Available templates

| Template          | Expects                                                       |
|-------------------|---------------------------------------------------------------|
| `news`            | `[{date, text}]`                                              |
| `timeline`        | `[{date, title, org}]`                                        |
| `list`            | `[{html}]` or `[{text}]` or `[string]`                        |
| `cards`           | `[{title, body}]`                                             |
| `paragraphs`      | `[string]`                                                    |
| `courses`         | `[{title, cfu?, ssd?, program, institution, academic_years:[], link?, link_label?}]` |
| `course_groups`   | `[{group_title, group_note?, courses:[...]}]`                 |
| `hero`            | `profile.json` (reads name, role, affiliation, lead, social)  |
| `about`           | `profile.json#about` paragraphs                               |
| `profile_contacts`| `profile.json` (email, address, IDs as a `<ul>`)              |
| `brand`           | `profile.json` (sets nav brand text)                          |
| `theses`          | `{intro, items: [string]}`                                    |

### Markdown supported in any text field

`**bold**`, `_italic_`, `` `code` ``, `[label](url)`.

## Multi-year teaching

Each course in `data/teaching.json` has an `academic_years` array — append a
new year when you teach a course again, and the site updates immediately:

```json
{
  "title": "Graphics and Virtual Reality",
  "cfu": "4 CFU",
  "ssd": "L-ART/06",
  "program": "60-CFU teacher qualification programme (Class A060-FI)",
  "institution": "University of Macerata",
  "academic_years": ["2023/2024", "2024/2025", "2025/2026"]
}
```

renders as

> **A.Y. 2023/2024 · A.Y. 2024/2025 · A.Y. 2025/2026 · 4 CFU · SSD L-ART/06**
> Graphics and Virtual Reality
> 60-CFU teacher qualification programme (Class A060-FI) — University of Macerata

Optional fields per course: `link` + `link_label` (e.g., link to the syllabus
page on the university website).

## How publications work

The site reads `publications.bib` directly, parses it client-side, and renders
the list grouped by year with type filters and full-text search. **To add or
update a paper, just edit `publications.bib`** and commit.

### Supported BibTeX entry types

`@article`, `@inproceedings`, `@phdthesis`, `@misc`.

### Custom (non-standard) fields recognised

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

### Why not scrape Scopus or Google Scholar live?

Browsers block cross-origin requests to those services (CORS), so a pure-static
GitHub Pages site cannot scrape them on its own. Three practical options:

1. **Edit `publications.bib` by hand** when you publish (current default).
2. **Periodically export BibTeX** from Scopus / WoS / Scholar and replace the
   file (Scopus → *Export → BibTeX*; Scholar Profile → per-entry export).
3. **Add a GitHub Action** that runs a server-side scraper (e.g., the Python
   `scholarly` library) nightly and commits a fresh `publications.bib`. Ask
   and I'll wire it up — it's an additive change.

## What goes where

| To update…                            | Edit this file                          |
|---------------------------------------|-----------------------------------------|
| Name, bio, lead, social links, IDs    | `data/profile.json`                     |
| Homepage news ticker                  | `data/news.json`                        |
| Current job                           | `data/positions.json` (`current` array) |
| Past jobs                             | `data/positions.json` (`past` array)    |
| Degrees                               | `data/education.json`                   |
| Add a year to an existing course      | `data/teaching.json` → push to that course's `academic_years` |
| Add a new course                      | `data/teaching.json` (`official_courses` or `ta_groups`) |
| Co-supervised theses                  | `data/teaching.json#theses.items`       |
| Seminars / tutoring                   | `data/teaching.json#seminars`           |
| Outreach / third mission              | `data/teaching.json#outreach`           |
| Research-page bio                     | `data/research.json#profile`            |
| Research interests cards (homepage)   | `data/research.json#interests`          |
| Theoretical / applied contributions   | `data/research.json#theoretical` / `#applied` |
| Research groups                       | `data/research.json#groups`             |
| Funded projects                       | `data/projects.json`                    |
| Awards                                | `data/awards.json`                      |
| Editorial / chair / memberships       | `data/service.json`                     |
| Invited talks                         | `data/talks.json`                       |
| **Publications**                      | `publications.bib`                      |
| Colors / typography                   | `assets/css/style.css` (`:root { … }`)  |
| Avatar image                          | Drop a square image to `assets/img/avatar.jpg` and swap the `<div class="avatar-placeholder">` for `<img class="avatar" src="…" alt="…">` |

## Deploying to GitHub Pages

### Option A — Default user/organisation site `<username>.github.io`

1. Create a repository named **`<your-username>.github.io`** on GitHub.
2. Push the contents of this folder to its `main` branch.
3. GitHub Pages serves it automatically at `https://<your-username>.github.io/`.

### Option B — Project site (e.g., `lorenzostacchio_website_academic`)

1. Push to `main` of any repo.
2. On GitHub: **Settings → Pages → Build and deployment**:
   - *Source*: **Deploy from a branch**
   - *Branch*: `main` / `/ (root)`
3. The site appears at `https://<username>.github.io/<repo-name>/`.

The `.nojekyll` file in the repo root disables Jekyll processing so that files
and folders starting with underscores are served as-is.

### Custom domain (optional)

Add a `CNAME` file at the repo root containing your domain (e.g., `lorenzostacchio.it`)
and configure DNS per the
[GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Local preview

No build step. Any static server works:

```powershell
# Python 3
python -m http.server 8000

# or with Node
npx serve
```

Then open <http://localhost:8000>.

> Opening the HTML files directly with `file://` will **not** work because
> `fetch('data/*.json')` and `fetch('publications.bib')` are blocked under the
> `file://` protocol. Use a local server.

## Accessibility &amp; performance

- One CSS file, ~30 KB of vanilla JS total, no external runtime dependencies, no trackers.
- Semantic HTML; sticky nav with mobile-friendly menu.
- Print stylesheet hides nav/footer for clean PDF export of the CV.
- All data files use `cache: 'no-store'`, so edits show up immediately on reload.

## License

Content (text, CV, publication metadata) © Lorenzo Stacchio.
Code (HTML/CSS/JS scaffolding) is MIT-licensed.
