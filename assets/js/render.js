/* =========================================================
   render.js — declarative content loader for the site.

   Add an HTML element with `data-render="<template>"` and
   `data-source="<path>[#<key>]"`. On DOMContentLoaded the
   script fetches the JSON, walks the key path, and renders
   using the matching template.

   Supported templates:
     news, timeline, list, cards, courses, course_groups,
     about, hero, social, profile_contacts, profile_ids,
     theses, selected_pubs_placeholder

   Markdown subset supported in text fields:
     **bold**  _italic_  [label](url)  `code`
   ========================================================= */

(function () {
  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  /* Minimal markdown: links, bold, italic, code. Order matters. */
  function md(s) {
    if (s == null) return '';
    let out = esc(s);
    // Links [label](url)
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
      (_, label, href) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`);
    // **bold**
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // _italic_  (avoid matching inside HTML attributes; we already escaped quotes)
    out = out.replace(/(^|[\s(>])_([^_]+)_(?=[\s.,;:)!?\-]|$)/g, '$1<em>$2</em>');
    // `code`
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    return out;
  }

  async function loadJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.json();
  }

  /* Resolve "path/foo.json#key.subkey" → fetch foo.json, then dive into key.subkey */
  function splitSource(src) {
    const [path, frag] = src.split('#');
    return { path, frag: frag || null };
  }
  function dive(obj, frag) {
    if (!frag) return obj;
    return frag.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  }

  /* ---------- templates ---------- */

  const T = {
    /* News list:  [{date, text}] */
    news(items) {
      if (!Array.isArray(items)) return '';
      return `<ul class="news-list">${items.map(it => `
        <li class="news-item">
          <span class="news-date">${esc(it.date || '')}</span>
          <span class="news-text">${md(it.text || '')}</span>
        </li>`).join('')}</ul>`;
    },

    /* Timeline: [{date, title, org}] */
    timeline(items) {
      if (!Array.isArray(items)) return '';
      return `<div class="timeline">${items.map(it => `
        <div class="timeline-item">
          <span class="timeline-date">${esc(it.date || '')}</span>
          <div class="timeline-title">${md(it.title || '')}</div>
          <div class="timeline-org">${md(it.org || '')}</div>
        </div>`).join('')}</div>`;
    },

    /* Bullet list: array of strings or {html} or {text} */
    list(items) {
      if (!Array.isArray(items)) return '';
      return `<ul>${items.map(it => {
        if (typeof it === 'string') return `<li>${md(it)}</li>`;
        if (it.html) return `<li>${md(it.html)}</li>`;
        return `<li>${md(it.text || '')}</li>`;
      }).join('')}</ul>`;
    },

    /* Cards grid: [{title, body}] */
    cards(items) {
      if (!Array.isArray(items)) return '';
      return `<div class="cards">${items.map(it => `
        <div class="card">
          <h3>${md(it.title || '')}</h3>
          <p>${md(it.body || '')}</p>
        </div>`).join('')}</div>`;
    },

    /* Paragraph block: array of paragraph strings */
    paragraphs(items) {
      if (!Array.isArray(items)) return '';
      return items.map(p => `<p>${md(p)}</p>`).join('');
    },

    /* Course list — each course can list MULTIPLE academic years.
       courses: [{title, cfu?, ssd?, program, institution, academic_years:[], link?, link_label?}] */
    courses(items) {
      if (!Array.isArray(items)) return '';
      return `<div class="timeline">${items.map(renderCourse).join('')}</div>`;
    },

    /* Grouped courses: [{group_title, group_note?, courses:[...]}] */
    course_groups(items) {
      if (!Array.isArray(items)) return '';
      return items.map(g => `
        <h3>${md(g.group_title || '')}</h3>
        ${g.group_note ? `<p class="muted">${md(g.group_note)}</p>` : ''}
        <div class="timeline">${(g.courses || []).map(renderCourse).join('')}</div>
      `).join('');
    },

    /* Hero block reads profile.json directly */
    hero(profile) {
      const social = (profile.social || []).map(s =>
        `<a class="social-link" href="${esc(s.href)}" target="_blank" rel="noopener">${esc(s.label)}</a>`
      ).join('');
      return `
        <div class="container hero-grid">
          <div class="avatar-placeholder" aria-label="${esc(profile.name || '')}">${esc(profile.initials || '')}</div>
          <div>
            <h1>${esc(profile.name || '')}</h1>
            <p class="role">${md(profile.role || '')}</p>
            <p class="affil">${md(profile.affiliation || '')}</p>
            <p class="lead">${md(profile.lead || '')}</p>
            <div class="social-row">${social}</div>
          </div>
        </div>`;
    },

    /* About paragraphs */
    about(profile) {
      return T.paragraphs(profile.about || []);
    },

    /* Profile contact list (cv.html) */
    profile_contacts(profile) {
      const orcid  = profile.ids?.orcid;
      const scopus = profile.ids?.scopus;
      const wos    = profile.ids?.wos;
      const rows = [];
      if (profile.affiliation) rows.push(`<li><strong>Affiliation:</strong> ${md(profile.affiliation)}</li>`);
      if (profile.address)     rows.push(`<li><strong>Address:</strong> ${esc(profile.address)}</li>`);
      if (profile.email)       rows.push(`<li><strong>Email:</strong> <a href="mailto:${esc(profile.email)}">${esc(profile.email)}</a></li>`);
      if (profile.pec)         rows.push(`<li><strong>PEC:</strong> ${esc(profile.pec)}</li>`);
      if (orcid)  rows.push(`<li><strong>ORCID:</strong> <a href="https://orcid.org/${esc(orcid)}" target="_blank" rel="noopener">${esc(orcid)}</a></li>`);
      if (scopus) rows.push(`<li><strong>Scopus ID:</strong> <a href="https://www.scopus.com/authid/detail.uri?authorId=${esc(scopus)}" target="_blank" rel="noopener">${esc(scopus)}</a></li>`);
      if (wos)    rows.push(`<li><strong>WoS ID:</strong> <a href="https://www.webofscience.com/wos/author/record/${esc(wos)}" target="_blank" rel="noopener">${esc(wos)}</a></li>`);
      return `<ul>${rows.join('')}</ul>`;
    },

    /* Brand element (top-left nav) — just the name */
    brand(profile) {
      return esc(profile.name || '');
    },

    /* Page <title> override — sets document title to "<role part> — <name>" */
    page_title(profile, el) {
      const suffix = el.dataset.suffix || '';
      document.title = `${suffix ? suffix + ' — ' : ''}${profile.name || ''}`;
      return ''; // nothing rendered into the element itself
    },

    /* Theses sub-template: {intro, items:[]} */
    theses(data) {
      if (!data) return '';
      const intro = data.intro ? `<p>${md(data.intro)}</p>` : '';
      const items = (data.items || []).map(t => `<li>${md(t)}</li>`).join('');
      return `${intro}<ul>${items}</ul>`;
    }
  };

  function renderCourse(c) {
    const meta = [c.cfu, c.ssd ? `SSD ${c.ssd}` : null].filter(Boolean).join(' · ');
    const years = [...new Set(c.academic_years || [])].sort().map(y => `A.Y. ${esc(y)}`).join(' · ');
    const link = c.link ? ` · <a href="${esc(c.link)}" target="_blank" rel="noopener">${esc(c.link_label || 'official page')}</a>` : '';
    return `
      <div class="timeline-item">
        <span class="timeline-date">${esc(years)}${meta ? ' · ' + esc(meta) : ''}</span>
        <div class="timeline-title">${md(c.title || '')}</div>
        <div class="timeline-org">${md(c.program || '')}${c.institution ? ' — ' + md(c.institution) : ''}${link}</div>
      </div>`;
  }

  /* ---------- main scan ---------- */

  async function renderAll() {
    const nodes = Array.from(document.querySelectorAll('[data-render]'));
    // Group nodes by source so each JSON is fetched once
    const cache = new Map();

    await Promise.all(nodes.map(async (el) => {
      const tmpl = el.dataset.render;
      const src  = el.dataset.source;
      if (!tmpl) return;
      if (!T[tmpl]) {
        console.warn(`Unknown template: ${tmpl}`);
        return;
      }
      let data = null;
      if (src) {
        const { path, frag } = splitSource(src);
        try {
          if (!cache.has(path)) cache.set(path, loadJSON(path));
          const full = await cache.get(path);
          data = dive(full, frag);
        } catch (err) {
          console.error(err);
          el.innerHTML = `<div class="empty">Could not load <code>${esc(src)}</code>.</div>`;
          return;
        }
      }
      const html = T[tmpl](data, el);
      // If template returned non-empty string set innerHTML.
      // (page_title returns "" but mutates document.title.)
      if (html !== '') el.innerHTML = html;
    }));

    /* After data renders, re-run main.js side-effects that depend on DOM */
    document.dispatchEvent(new CustomEvent('content:rendered'));
  }

  document.addEventListener('DOMContentLoaded', renderAll);
})();
