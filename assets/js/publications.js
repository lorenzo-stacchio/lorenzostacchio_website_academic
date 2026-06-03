/* =========================================================
   publications.js — fetches publications.bib, parses it,
   renders a grouped/filtered/searchable list of entries.

   Self-contained (no external deps) so it runs anywhere
   GitHub Pages serves static files.
   ========================================================= */

const ME_REGEX = /^stacchio(,?\s*l(orenzo)?\.?)?$/i;

const TYPE_LABELS = {
  article:       'Journal',
  inproceedings: 'Conference',
  phdthesis:     'PhD Thesis',
  misc:          'Misc'
};

/* ------------------ BibTeX parser ------------------ */
/* Minimal but robust enough for the entries used here. */

function parseBibtex(text) {
  const entries = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    // find next @
    while (i < n && text[i] !== '@') i++;
    if (i >= n) break;
    i++; // skip @

    // read type
    let type = '';
    while (i < n && /[A-Za-z]/.test(text[i])) { type += text[i++]; }
    type = type.toLowerCase();
    if (type === 'comment' || type === 'preamble' || type === 'string') {
      // skip braced block
      i = skipBraced(text, i);
      continue;
    }
    // skip whitespace
    while (i < n && /\s/.test(text[i])) i++;
    if (text[i] !== '{') continue;
    i++; // skip {

    // read citation key up to first comma
    let key = '';
    while (i < n && text[i] !== ',' && text[i] !== '}') { key += text[i++]; }
    key = key.trim();
    if (text[i] === ',') i++;

    // read fields
    const fields = { _type: type, _key: key };
    while (i < n) {
      // skip ws/commas
      while (i < n && /[\s,]/.test(text[i])) i++;
      if (text[i] === '}') { i++; break; }

      // field name
      let name = '';
      while (i < n && /[A-Za-z0-9_-]/.test(text[i])) { name += text[i++]; }
      name = name.toLowerCase();
      while (i < n && /\s/.test(text[i])) i++;
      if (text[i] !== '=') break;
      i++;
      while (i < n && /\s/.test(text[i])) i++;

      // value: either {...}, "...", or bare number
      let value = '';
      if (text[i] === '{') {
        i++; // skip outer {
        let depth = 1;
        while (i < n && depth > 0) {
          const c = text[i];
          if (c === '{') depth++;
          else if (c === '}') {
            depth--;
            if (depth === 0) { i++; break; }
          }
          value += c;
          i++;
        }
      } else if (text[i] === '"') {
        i++;
        while (i < n && text[i] !== '"') { value += text[i++]; }
        if (text[i] === '"') i++;
      } else {
        while (i < n && /[^,\s}]/.test(text[i])) { value += text[i++]; }
      }
      fields[name] = cleanLatex(value.trim());
    }
    entries.push(fields);
  }

  return entries;
}

function skipBraced(text, i) {
  while (i < text.length && text[i] !== '{') i++;
  if (i >= text.length) return i;
  let depth = 0;
  do {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    i++;
  } while (i < text.length && depth > 0);
  return i;
}

/* Strip a subset of common LaTeX constructs */
function cleanLatex(s) {
  return s
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\textbackslash/g, '\\')
    .replace(/\\'\{?([aeiouAEIOU])\}?/g, '$1́'.normalize('NFC'))
    .replace(/\{\\'([aeiouAEIOU])\}/g, (_, c) => ({ a:'á',e:'é',i:'í',o:'ó',u:'ú',A:'Á',E:'É',I:'Í',O:'Ó',U:'Ú' }[c] || c))
    .replace(/\{\\`([aeiouAEIOU])\}/g, (_, c) => ({ a:'à',e:'è',i:'ì',o:'ò',u:'ù' }[c] || c))
    .replace(/\\`\{?([aeiou])\}?/g, (_, c) => ({ a:'à',e:'è',i:'ì',o:'ò',u:'ù' }[c] || c))
    .replace(/\\"?\{?([aeiouAEIOU])\}?/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/--/g, '–')
    .replace(/\{|\}/g, '')
    .trim();
}

/* ------------------ Authors helpers ------------------ */

function splitAuthors(authorString) {
  if (!authorString) return [];
  return authorString.split(/\s+and\s+/i).map(a => a.trim()).filter(Boolean);
}

/* Renders an author list with "me" bolded */
function renderAuthors(authorString) {
  const authors = splitAuthors(authorString);
  return authors.map(a => {
    // normalize "Last, First" -> "F. Last", "First Last" -> "F. Last"
    const display = formatAuthorShort(a);
    if (isMe(a)) return `<span class="me">${escapeHtml(display)}</span>`;
    return escapeHtml(display);
  }).join(', ');
}

function formatAuthorShort(a) {
  // "Stacchio, Lorenzo"  -> "L. Stacchio"
  // "Stacchio, L."       -> "L. Stacchio"
  // "Lorenzo Stacchio"   -> "L. Stacchio"
  // "L. Stacchio"        -> "L. Stacchio"
  let last = '', first = '';
  if (a.includes(',')) {
    [last, first] = a.split(',', 2).map(s => s.trim());
  } else {
    const parts = a.split(/\s+/);
    if (parts.length === 1) return parts[0];
    last = parts[parts.length - 1];
    first = parts.slice(0, -1).join(' ');
  }
  const initials = first.split(/[\s.]+/)
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + '.')
    .join(' ');
  return initials ? `${initials} ${last}` : last;
}

function isMe(a) {
  // Accept "Stacchio, Lorenzo", "Stacchio, L.", "Lorenzo Stacchio", "L. Stacchio"
  const norm = a.toLowerCase().replace(/\./g, '').trim();
  return /(^|[\s,])stacchio($|[\s,])/.test(', ' + norm + ', ');
}

/* ------------------ Rendering ------------------ */

function entryYear(e) {
  const y = parseInt(e.year, 10);
  return isNaN(y) ? 0 : y;
}

function entryVenue(e) {
  if (e._type === 'article') return e.journal || '';
  if (e._type === 'inproceedings') return e.booktitle || '';
  if (e._type === 'phdthesis') return e.school ? `PhD Thesis, ${e.school}` : 'PhD Thesis';
  return e.howpublished || '';
}

function entryHtml(e) {
  const cvid = e.cv_id ? `<span class="muted small">${escapeHtml(e.cv_id)} </span>` : '';
  const venue = entryVenue(e);
  const venueLine = venue
    ? `<div class="pub-venue">${escapeHtml(venue)}${e.volume ? `, vol. ${escapeHtml(e.volume)}` : ''}${e.pages ? `, pp. ${escapeHtml(e.pages)}` : ''} (${escapeHtml(e.year || '')})</div>`
    : '';

  const tagChips = (e.tags ? e.tags.split(/[,;]/).map(t => t.trim()).filter(Boolean) : [])
    .map(t => `<span class="pub-tag">${escapeHtml(t)}</span>`).join('');
  const award = e.award ? `<span class="pub-tag award">★ ${escapeHtml(e.award)}</span>` : '';

  const links = [];
  if (e.pdf)     links.push(`<a href="${escapeAttr(e.pdf)}" target="_blank" rel="noopener">PDF</a>`);
  if (e.url)     links.push(`<a href="${escapeAttr(e.url)}" target="_blank" rel="noopener">Link</a>`);
  if (e.code)    links.push(`<a href="${escapeAttr(e.code)}" target="_blank" rel="noopener">Code</a>`);
  if (e.project) links.push(`<a href="${escapeAttr(e.project)}" target="_blank" rel="noopener">Project</a>`);
  if (e.video)   links.push(`<a href="${escapeAttr(e.video)}" target="_blank" rel="noopener">Video</a>`);
  if (e.doi)     links.push(`<a href="https://doi.org/${escapeAttr(e.doi)}" target="_blank" rel="noopener">DOI</a>`);

  const noteHtml = e.note ? `<div class="muted small">${escapeHtml(e.note)}</div>` : '';

  return `
  <div class="pub-item" data-type="${escapeAttr(e._type)}" data-year="${escapeAttr(e.year || '')}">
    <div class="pub-title">${cvid}${escapeHtml(e.title || '')}</div>
    <div class="pub-authors">${renderAuthors(e.author || '')}</div>
    ${venueLine}
    ${noteHtml}
    ${tagChips || award ? `<div class="pub-tags">${award}${tagChips}</div>` : ''}
    ${links.length ? `<div class="pub-links">${links.join('')}</div>` : ''}
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

/* ------------------ Page wiring ------------------ */

const state = {
  entries: [],
  query: '',
  type: 'all'
};

function applyFilters() {
  const q = state.query.trim().toLowerCase();
  return state.entries.filter(e => {
    if (state.type !== 'all' && e._type !== state.type) return false;
    if (!q) return true;
    const hay = [
      e.title, e.author, e.journal, e.booktitle, e.tags, e.year, e.cv_id, e.award, e.school
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}

function renderInto(container) {
  const list = applyFilters();
  if (!list.length) {
    container.innerHTML = '<div class="empty">No publications match your filters.</div>';
    return;
  }
  // group by year desc
  const byYear = {};
  list.forEach(e => {
    const y = e.year || 'n.d.';
    (byYear[y] = byYear[y] || []).push(e);
  });
  const years = Object.keys(byYear).sort((a, b) => (b === 'n.d.' ? -1 : a === 'n.d.' ? 1 : (b - a)));
  container.innerHTML = years.map(y => `
    <div class="pub-year-group">
      <div class="pub-year">${escapeHtml(y)}</div>
      ${byYear[y].map(entryHtml).join('')}
    </div>
  `).join('');
}

function renderStats(container) {
  if (!container) return;
  const totals = { article: 0, inproceedings: 0, phdthesis: 0, misc: 0 };
  state.entries.forEach(e => { totals[e._type] = (totals[e._type] || 0) + 1; });
  const total = state.entries.length;
  const firstYear = Math.min(...state.entries.map(entryYear).filter(Boolean));
  container.innerHTML = `
    <div class="pub-stat"><span class="pub-stat-num">${total}</span><span class="pub-stat-label">Total publications</span></div>
    <div class="pub-stat"><span class="pub-stat-num">${totals.article || 0}</span><span class="pub-stat-label">Journal papers</span></div>
    <div class="pub-stat"><span class="pub-stat-num">${totals.inproceedings || 0}</span><span class="pub-stat-label">Conference papers</span></div>
    <div class="pub-stat"><span class="pub-stat-num">${isFinite(firstYear) ? firstYear : '–'}</span><span class="pub-stat-label">Active since</span></div>
  `;
}

function wireControls(container) {
  const search = document.getElementById('pub-search');
  if (search) {
    search.addEventListener('input', e => {
      state.query = e.target.value;
      renderInto(container);
    });
  }
  document.querySelectorAll('.pub-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pub-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.type = btn.dataset.type;
      renderInto(container);
    });
  });
}

/* Render selected highlights on homepage */
function renderSelected(container, n = 4) {
  if (!container) return;
  const selected = state.entries
    .filter(e => (e.selected || '').toLowerCase() === 'true')
    .sort((a, b) => entryYear(b) - entryYear(a))
    .slice(0, n);
  if (!selected.length) {
    container.innerHTML = '<p class="muted">Add <code>selected = {true}</code> to BibTeX entries to feature them here.</p>';
    return;
  }
  container.innerHTML = selected.map(entryHtml).join('');
}

/* ------------------ Boot ------------------ */

async function loadPublications(path) {
  const res = await fetch(path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const text = await res.text();
  return parseBibtex(text)
    .sort((a, b) => entryYear(b) - entryYear(a));
}

document.addEventListener('DOMContentLoaded', async () => {
  const pubList = document.getElementById('pub-list');
  const pubStats = document.getElementById('pub-stats');
  const selectedBox = document.getElementById('selected-pubs');

  if (!pubList && !selectedBox) return; // page has no pub container

  try {
    state.entries = await loadPublications('publications.bib');
    if (pubStats) renderStats(pubStats);
    if (pubList) { renderInto(pubList); wireControls(pubList); }
    if (selectedBox) renderSelected(selectedBox, 4);
  } catch (err) {
    console.error(err);
    const msg = '<div class="empty">Could not load publications. Verify <code>publications.bib</code> is present.</div>';
    if (pubList) pubList.innerHTML = msg;
    if (selectedBox) selectedBox.innerHTML = msg;
  }
});
