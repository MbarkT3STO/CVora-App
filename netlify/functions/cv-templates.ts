import type { CVBuiltData, CVTemplate } from '../../src/types';

export function renderTemplate(data: CVBuiltData, template: CVTemplate, pageTitle: string): string {
  const styles = getStyles(template);
  const body = getBody(data, template);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(pageTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"/>
<style>${styles}${downloadBarCSS}</style>
</head>
<body>
${downloadBar(pageTitle)}
${body}
<script>
  document.getElementById('cv-print-btn').addEventListener('click',function(){window.print()});
</script>
</body>
</html>`;
}

const downloadBarCSS = `
.cv-dl-bar{position:fixed;bottom:1.5rem;right:1.5rem;display:flex;align-items:center;gap:.5rem;z-index:1000;animation:dlBarIn .4s cubic-bezier(.34,1.4,.64,1)}
@keyframes dlBarIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.cv-dl-btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.25rem;border-radius:999px;font-family:'Inter',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;border:none;transition:all .2s ease;box-shadow:0 4px 20px rgba(0,0,0,.18);white-space:nowrap}
.cv-dl-btn--primary{background:#6c63ff;color:#fff}
.cv-dl-btn--primary:hover{background:#5a52d5;transform:translateY(-2px);box-shadow:0 6px 24px rgba(108,99,255,.4)}
.cv-dl-btn--ghost{background:#fff;color:#475569;border:1px solid #e2e8f0}
.cv-dl-btn--ghost:hover{background:#f8fafc;transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.12)}
.cv-dl-btn:active{transform:scale(.97)}
@media print{.cv-dl-bar{display:none}}
@media(max-width:480px){.cv-dl-bar{bottom:1rem;right:1rem;left:1rem;justify-content:center}}
`;

function downloadBar(title: string): string {
  return `<div class="cv-dl-bar">
  <button class="cv-dl-btn cv-dl-btn--primary" id="cv-print-btn">
    <i class="fa-solid fa-file-arrow-down"></i> Download PDF
  </button>
</div>`;
}

function esc(s: string): string {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Shared base ─────────────────────────────────────────────────────────────
const BASE = `
*{box-sizing:border-box;margin:0;padding:0;min-width:0}
html{background:#f1f5f9}
body{font-family:'Inter',sans-serif;line-height:1.6;color:#1e293b;background:#f1f5f9;padding:2rem 1rem;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{background:#fff;width:100%;max-width:794px;margin:0 auto;box-shadow:0 4px 32px rgba(0,0,0,.12);border-radius:4px;overflow:hidden;word-break:break-word;overflow-wrap:break-word;min-height:1123px}
@media(max-width:860px){body{padding:1rem .5rem}}
@media(max-width:600px){body{padding:.5rem 0}.page{border-radius:0;box-shadow:none;min-height:auto}}
@media print{html,body{background:#fff;padding:0}@page{margin:0;size:A4 portrait}.page{box-shadow:none;max-width:100%;border-radius:0;min-height:1123px}}
`;

function getStyles(t: CVTemplate): string {
  if (t === 'modern')       return BASE + modernCSS;
  if (t === 'minimal')      return BASE + minimalCSS;
  if (t === 'bold')         return BASE + boldCSS;
  if (t === 'elegant')      return BASE + elegantCSS;
  if (t === 'professional') return BASE + professionalCSS;
  if (t === 'nova')         return BASE + novaCSS;
  return BASE + modernCSS;
}

function getBody(d: CVBuiltData, t: CVTemplate): string {
  if (t === 'modern')       return `<div class="page">${modernBody(d)}</div>`;
  if (t === 'minimal')      return `<div class="page">${minimalBody(d)}</div>`;
  if (t === 'bold')         return `<div class="page">${boldBody(d)}</div>`;
  if (t === 'elegant')      return `<div class="page">${elegantBody(d)}</div>`;
  if (t === 'professional') return `<div class="page">${professionalBody(d)}</div>`;
  if (t === 'nova')         return `<div class="page">${novaBody(d)}</div>`;
  return `<div class="page">${modernBody(d)}</div>`;
}

// ─── Modern CSS ───────────────────────────────────────────────────────────────
const modernCSS = `
.page{display:grid;grid-template-columns:260px 1fr}
.sidebar{background:linear-gradient(170deg,#1e1b4b 0%,#312e81 100%);color:#e2e8f0;padding:2.5rem 1.75rem;display:flex;flex-direction:column;gap:2rem;min-height:1123px}
.sidebar h1{font-family:'Outfit',sans-serif;font-size:1.5rem;font-weight:900;color:#fff;line-height:1.2;word-break:break-word;overflow-wrap:break-word}
.sidebar .job-title{font-size:.78rem;font-weight:700;color:#a78bfa;text-transform:uppercase;letter-spacing:.1em;margin-top:.35rem;word-break:break-word}
.sidebar-section h3{font-size:.65rem;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:#a78bfa;margin-bottom:.65rem;padding-bottom:.35rem;border-bottom:1px solid rgba(167,139,250,.25)}
.contact-item{display:flex;align-items:flex-start;gap:.5rem;font-size:.78rem;margin-bottom:.45rem;color:#cbd5e1;word-break:break-all;overflow-wrap:anywhere}
.contact-item .icon{opacity:.6;flex-shrink:0;margin-top:.1rem}
.skill-group{margin-bottom:.7rem}
.skill-group-name{font-size:.72rem;font-weight:700;color:#c4b5fd;margin-bottom:.35rem;word-break:break-word}
.skill-tags{display:flex;flex-wrap:wrap;gap:.25rem}
.skill-tag{background:rgba(167,139,250,.15);color:#ddd6fe;padding:.18rem .55rem;border-radius:20px;font-size:.68rem;font-weight:600;word-break:break-word}
.lang-item{display:flex;justify-content:space-between;gap:.5rem;font-size:.76rem;margin-bottom:.3rem;color:#cbd5e1}
.lang-level{color:#a78bfa;font-weight:600;flex-shrink:0}
.main{padding:2.5rem 2rem;display:flex;flex-direction:column;gap:2rem;min-width:0}
.summary-text{font-size:.875rem;color:#475569;line-height:1.75;background:#f8faff;padding:1.1rem 1.25rem;border-radius:10px;border-left:4px solid #6c63ff;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Outfit',sans-serif;font-size:1rem;font-weight:900;color:#1e1b4b;margin-bottom:1.1rem;display:flex;align-items:center;gap:.6rem}
.section-title::after{content:'';flex:1;height:2px;background:linear-gradient(to right,#e2e8f0,transparent)}
.entry{margin-bottom:1.1rem;padding-bottom:1.1rem;border-bottom:1px solid #f1f5f9}
.entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;overflow-wrap:break-word;word-break:break-word}
.entry-title{font-weight:700;font-size:.9rem;color:#1e293b;word-break:break-word}
.entry-sub{font-size:.82rem;color:#6c63ff;font-weight:600;margin-top:.1rem;word-break:break-word}
.entry-date{font-size:.74rem;color:#94a3b8;font-weight:600;white-space:nowrap;background:#f1f5f9;padding:.18rem .55rem;border-radius:20px;flex-shrink:0}
.entry-desc{font-size:.82rem;color:#64748b;margin-top:.45rem;line-height:1.65;word-break:break-word;overflow-wrap:break-word}
`;

// ─── Minimal CSS ──────────────────────────────────────────────────────────────
const minimalCSS = `
.page{padding:3rem 3.5rem}
header{border-bottom:2.5px solid #0f172a;padding-bottom:1.5rem;margin-bottom:2rem}
header h1{font-family:'Outfit',sans-serif;font-size:2rem;font-weight:900;letter-spacing:-.04em;color:#0f172a;word-break:break-word}
.job-title{font-size:.9rem;color:#64748b;font-weight:500;margin-top:.25rem;word-break:break-word}
.contact-row{display:flex;flex-wrap:wrap;gap:1.25rem;margin-top:.75rem}
.contact-item{font-size:.8rem;color:#475569;word-break:break-all;overflow-wrap:anywhere}
.summary-text{font-size:.875rem;color:#475569;line-height:1.75;margin-bottom:2rem;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Outfit',sans-serif;font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#94a3b8;margin-bottom:1rem;margin-top:2rem}
.entry{margin-bottom:1.4rem}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
.entry-title{font-weight:700;font-size:.9rem;color:#0f172a;word-break:break-word}
.entry-sub{font-size:.82rem;color:#475569;margin-top:.1rem;word-break:break-word}
.entry-date{font-size:.76rem;color:#94a3b8;flex-shrink:0;white-space:nowrap}
.entry-desc{font-size:.82rem;color:#64748b;margin-top:.4rem;line-height:1.65;word-break:break-word;overflow-wrap:break-word}
.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.85rem}
.skill-group-name{font-size:.76rem;font-weight:700;color:#0f172a;margin-bottom:.3rem;word-break:break-word}
.skill-tags{display:flex;flex-wrap:wrap;gap:.3rem}
.skill-tag{background:#f1f5f9;color:#475569;padding:.18rem .55rem;border-radius:4px;font-size:.7rem;font-weight:600;word-break:break-word}
.lang-row{display:flex;justify-content:space-between;gap:.5rem;font-size:.82rem;padding:.4rem 0;border-bottom:1px solid #f1f5f9}
.lang-level{color:#64748b;flex-shrink:0}
`;

// ─── Bold CSS ─────────────────────────────────────────────────────────────────
const boldCSS = `
header{background:#dc2626;color:#fff;padding:2.5rem 3rem;position:relative;overflow:hidden}
header::before{content:'';position:absolute;right:-80px;top:-80px;width:260px;height:260px;background:rgba(255,255,255,.06);border-radius:50%}
header h1{font-family:'Outfit',sans-serif;font-size:2.2rem;font-weight:900;letter-spacing:-.04em;position:relative;word-break:break-word;overflow-wrap:break-word}
.job-title{font-size:.9rem;font-weight:600;opacity:.85;margin-top:.3rem;position:relative;word-break:break-word}
.contact-row{display:flex;flex-wrap:wrap;gap:1.25rem;margin-top:.9rem;position:relative}
.contact-item{font-size:.8rem;opacity:.9;word-break:break-all;overflow-wrap:anywhere}
.content{padding:2.5rem 3rem;display:grid;grid-template-columns:1fr 240px;gap:2.5rem}
.main-col{min-width:0}
.summary-text{font-size:.875rem;color:#374151;line-height:1.75;margin-bottom:2rem;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Outfit',sans-serif;font-size:.9rem;font-weight:900;color:#dc2626;text-transform:uppercase;letter-spacing:.08em;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.section-title::before{content:'';width:4px;height:1em;background:#dc2626;border-radius:2px;flex-shrink:0}
.entry{margin-bottom:1.1rem}
.entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
.entry-title{font-weight:700;font-size:.9rem;color:#111827;word-break:break-word}
.entry-sub{font-size:.82rem;color:#dc2626;font-weight:600;margin-top:.1rem;word-break:break-word}
.entry-date{font-size:.74rem;color:#9ca3af;font-weight:600;flex-shrink:0;white-space:nowrap}
.entry-desc{font-size:.82rem;color:#6b7280;margin-top:.4rem;line-height:1.65;word-break:break-word;overflow-wrap:break-word}
.sidebar-col{display:flex;flex-direction:column;gap:1.75rem;min-width:0}
.skill-group-name{font-size:.76rem;font-weight:700;color:#374151;margin-bottom:.35rem;word-break:break-word}
.skill-tags{display:flex;flex-wrap:wrap;gap:.3rem}
.skill-tag{background:#fee2e2;color:#dc2626;padding:.18rem .5rem;border-radius:4px;font-size:.7rem;font-weight:700;word-break:break-word}
.lang-item{display:flex;justify-content:space-between;gap:.5rem;font-size:.8rem;padding:.35rem 0;border-bottom:1px solid #f3f4f6}
.lang-level{color:#dc2626;font-weight:600;flex-shrink:0}
`;

// ─── Elegant CSS ──────────────────────────────────────────────────────────────
const elegantCSS = `
.page{padding:3.5rem 3.5rem}
header{text-align:center;margin-bottom:2.5rem;padding-bottom:2rem;border-bottom:1px solid #e7d5b3}
header h1{font-family:'Playfair Display',serif;font-size:2.4rem;font-weight:900;color:#1c1917;letter-spacing:-.02em;word-break:break-word}
.job-title{font-size:.88rem;color:#92400e;font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin-top:.4rem;word-break:break-word}
.contact-row{display:flex;justify-content:center;flex-wrap:wrap;gap:1.5rem;margin-top:.85rem}
.contact-item{font-size:.78rem;color:#78716c;word-break:break-all;overflow-wrap:anywhere}
.summary-text{font-size:.875rem;color:#57534e;line-height:1.8;text-align:center;font-style:italic;margin-bottom:2.5rem;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:#1c1917;text-align:center;margin-bottom:1.25rem;margin-top:2rem;display:flex;align-items:center;gap:.75rem;justify-content:center}
.section-title::before,.section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,#d97706)}
.section-title::after{background:linear-gradient(to left,transparent,#d97706)}
.entry{margin-bottom:1.5rem;padding-bottom:1.5rem;border-bottom:1px solid #fef3c7}
.entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.entry-header{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
.entry-title{font-family:'Playfair Display',serif;font-weight:700;font-size:.9rem;color:#1c1917;word-break:break-word}
.entry-sub{font-size:.82rem;color:#92400e;font-weight:600;margin-top:.1rem;word-break:break-word}
.entry-date{font-size:.76rem;color:#a8a29e;font-style:italic;flex-shrink:0;white-space:nowrap}
.entry-desc{font-size:.82rem;color:#78716c;margin-top:.45rem;line-height:1.7;word-break:break-word;overflow-wrap:break-word}
.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.skill-group-name{font-size:.76rem;font-weight:700;color:#92400e;margin-bottom:.35rem;text-transform:uppercase;letter-spacing:.08em;word-break:break-word}
.skill-tags{display:flex;flex-wrap:wrap;gap:.35rem}
.skill-tag{background:#fef3c7;color:#92400e;padding:.18rem .6rem;border-radius:20px;font-size:.7rem;font-weight:600;word-break:break-word}
.lang-row{display:flex;justify-content:space-between;gap:.5rem;font-size:.82rem;padding:.4rem 0;border-bottom:1px solid #fef3c7}
.lang-level{color:#92400e;font-style:italic;flex-shrink:0}
`;

// ─── Professional CSS ─────────────────────────────────────────────────────────
const professionalCSS = `
.page{padding:0}
.prof-header{padding:2.25rem 2.75rem 1.75rem;border-bottom:3px solid #2563eb}
.prof-header h1{font-family:'Outfit',sans-serif;font-size:2rem;font-weight:900;color:#1e293b;letter-spacing:-.03em;word-break:break-word;overflow-wrap:break-word}
.prof-header .job-title{font-size:.88rem;color:#2563eb;font-weight:600;margin-top:.2rem;word-break:break-word}
.contact-row{display:flex;flex-wrap:wrap;gap:1.25rem;margin-top:.75rem}
.contact-item{font-size:.8rem;color:#475569;display:flex;align-items:center;gap:.35rem;word-break:break-all;overflow-wrap:anywhere}
.contact-item .ci-icon{color:#2563eb;font-size:.75rem;flex-shrink:0}
.prof-body{padding:1.75rem 2.75rem;display:flex;flex-direction:column;gap:1.75rem}
.summary-text{font-size:.875rem;color:#475569;line-height:1.75;padding:.9rem 1.1rem;background:#eff6ff;border-radius:6px;border-left:3px solid #2563eb;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Outfit',sans-serif;font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:#2563eb;margin-bottom:.9rem;display:flex;align-items:center;gap:.6rem;padding-bottom:.5rem;border-bottom:1.5px solid #dbeafe}
.section-icon{width:22px;height:22px;background:#2563eb;border-radius:4px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:.65rem;flex-shrink:0}
.entry{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #f1f5f9}
.entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
.entry-title{font-weight:700;font-size:.9rem;color:#1e293b;word-break:break-word}
.entry-sub{font-size:.82rem;color:#2563eb;font-weight:600;margin-top:.1rem;word-break:break-word}
.entry-date{font-size:.74rem;color:#94a3b8;font-weight:600;flex-shrink:0;white-space:nowrap}
.entry-desc{font-size:.82rem;color:#64748b;margin-top:.4rem;line-height:1.65;word-break:break-word;overflow-wrap:break-word}
.skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
.skill-group-name{font-size:.76rem;font-weight:800;color:#1e293b;margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.06em;word-break:break-word}
.skill-list{list-style:none;padding:0}
.skill-list li{font-size:.8rem;color:#475569;padding:.2rem 0;display:flex;align-items:flex-start;gap:.4rem;word-break:break-word;overflow-wrap:break-word}
.skill-list li::before{content:'•';color:#2563eb;font-weight:900;flex-shrink:0;margin-top:.1rem}
.lang-row{display:flex;justify-content:space-between;gap:.5rem;font-size:.82rem;padding:.4rem 0;border-bottom:1px solid #f1f5f9}
.lang-level{color:#2563eb;font-weight:600;flex-shrink:0}
`;

// ─── Body builders ────────────────────────────────────────────────────────────
function modernBody(d: CVBuiltData): string {
  return `
  <div class="sidebar">
    <div>
      <h1>${esc(d.name)}</h1>
      <div class="job-title">${esc(d.title)}</div>
    </div>
    <div class="sidebar-section">
      <h3>Contact</h3>
      ${d.email    ? `<div class="contact-item"><span class="icon">✉</span>${esc(d.email)}</div>` : ''}
      ${d.phone    ? `<div class="contact-item"><span class="icon">✆</span>${esc(d.phone)}</div>` : ''}
      ${d.location ? `<div class="contact-item"><span class="icon">⌖</span>${esc(d.location)}</div>` : ''}
      ${d.website  ? `<div class="contact-item"><span class="icon">⊕</span>${esc(d.website)}</div>` : ''}
    </div>
    ${d.skills.length ? `<div class="sidebar-section"><h3>Skills</h3>${d.skills.map(g =>
      `<div class="skill-group"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${
        g.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')
      }</div></div>`).join('')}</div>` : ''}
    ${d.languages?.length ? `<div class="sidebar-section"><h3>Languages</h3>${d.languages.map(l =>
      `<div class="lang-item"><span>${esc(l.language)}</span><span class="lang-level">${esc(l.level)}</span></div>`).join('')}</div>` : ''}
  </div>
  <div class="main">
    ${d.summary ? `<div class="summary-text">${esc(d.summary)}</div>` : ''}
    ${d.experience.length ? `<div><div class="section-title">Experience</div>${d.experience.map(e =>
      `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><div class="entry-date">${esc(e.startDate)} — ${e.current ? 'Present' : esc(e.endDate)}</div></div>${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ''}</div>`
    ).join('')}</div>` : ''}
    ${d.education.length ? `<div><div class="section-title">Education</div>${d.education.map(e =>
      `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.degree)}${e.field ? ` in ${esc(e.field)}` : ''}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${esc(e.startDate)} — ${e.current ? 'Present' : esc(e.endDate)}</div></div></div>`
    ).join('')}</div>` : ''}
  </div>`;
}

function minimalBody(d: CVBuiltData): string {
  return `
  <header>
    <h1>${esc(d.name)}</h1>
    <div class="job-title">${esc(d.title)}</div>
    <div class="contact-row">${[d.email,d.phone,d.location,d.website].filter(Boolean).map(v =>
      `<span class="contact-item">${esc(v!)}</span>`).join('')}</div>
  </header>
  ${d.summary ? `<p class="summary-text">${esc(d.summary)}</p>` : ''}
  ${d.experience.length ? `<div class="section-title">Experience</div>${d.experience.map(e =>
    `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><span class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</span></div>${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ''}</div>`
  ).join('')}` : ''}
  ${d.education.length ? `<div class="section-title">Education</div>${d.education.map(e =>
    `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.degree)}${e.field ? ` — ${esc(e.field)}` : ''}</div><div class="entry-sub">${esc(e.institution)}</div></div><span class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</span></div></div>`
  ).join('')}` : ''}
  ${d.skills.length ? `<div class="section-title">Skills</div><div class="skills-grid">${d.skills.map(g =>
    `<div><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${g.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')}</div></div>`
  ).join('')}</div>` : ''}
  ${d.languages?.length ? `<div class="section-title">Languages</div>${d.languages.map(l =>
    `<div class="lang-row"><span>${esc(l.language)}</span><span class="lang-level">${esc(l.level)}</span></div>`).join('')}` : ''}`;
}

function boldBody(d: CVBuiltData): string {
  return `
  <header>
    <h1>${esc(d.name)}</h1>
    <div class="job-title">${esc(d.title)}</div>
    <div class="contact-row">${[d.email,d.phone,d.location,d.website].filter(Boolean).map(v =>
      `<span class="contact-item">${esc(v!)}</span>`).join('')}</div>
  </header>
  <div class="content">
    <div class="main-col">
      ${d.summary ? `<p class="summary-text">${esc(d.summary)}</p>` : ''}
      ${d.experience.length ? `<div class="section-title">Experience</div>${d.experience.map(e =>
        `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><div class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</div></div>${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ''}</div>`
      ).join('')}` : ''}
      ${d.education.length ? `<div class="section-title">Education</div>${d.education.map(e =>
        `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.degree)}${e.field ? ` in ${esc(e.field)}` : ''}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</div></div></div>`
      ).join('')}` : ''}
    </div>
    <div class="sidebar-col">
      ${d.skills.length ? `<div><div class="section-title">Skills</div>${d.skills.map(g =>
        `<div style="margin-bottom:.75rem"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${g.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')}</div></div>`
      ).join('')}</div>` : ''}
      ${d.languages?.length ? `<div><div class="section-title">Languages</div>${d.languages.map(l =>
        `<div class="lang-item"><span>${esc(l.language)}</span><span class="lang-level">${esc(l.level)}</span></div>`).join('')}</div>` : ''}
    </div>
  </div>`;
}

function elegantBody(d: CVBuiltData): string {
  return `
  <header>
    <h1>${esc(d.name)}</h1>
    <div class="job-title">${esc(d.title)}</div>
    <div class="contact-row">${[d.email,d.phone,d.location,d.website].filter(Boolean).map(v =>
      `<span class="contact-item">${esc(v!)}</span>`).join('')}</div>
  </header>
  ${d.summary ? `<p class="summary-text">${esc(d.summary)}</p>` : ''}
  ${d.experience.length ? `<div class="section-title">Experience</div>${d.experience.map(e =>
    `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><div class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</div></div>${e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : ''}</div>`
  ).join('')}` : ''}
  ${d.education.length ? `<div class="section-title">Education</div>${d.education.map(e =>
    `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.degree)}${e.field ? ` in ${esc(e.field)}` : ''}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${esc(e.startDate)} – ${e.current ? 'Present' : esc(e.endDate)}</div></div></div>`
  ).join('')}` : ''}
  ${d.skills.length ? `<div class="section-title">Skills</div><div class="skills-grid">${d.skills.map(g =>
    `<div><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${g.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('')}</div></div>`
  ).join('')}</div>` : ''}
  ${d.languages?.length ? `<div class="section-title">Languages</div>${d.languages.map(l =>
    `<div class="lang-row"><span>${esc(l.language)}</span><span class="lang-level">${esc(l.level)}</span></div>`).join('')}` : ''}`;
}

function professionalBody(d: CVBuiltData): string {
  const icon = (i: string) => `<span class="section-icon">${i}</span>`;
  return `
  <div class="prof-header">
    <h1>${esc(d.name)}</h1>
    <div class="job-title">${esc(d.title)}</div>
    <div class="contact-row">
      ${d.email    ? `<span class="contact-item"><span class="ci-icon">✉</span>${esc(d.email)}</span>` : ''}
      ${d.phone    ? `<span class="contact-item"><span class="ci-icon">✆</span>${esc(d.phone)}</span>` : ''}
      ${d.location ? `<span class="contact-item"><span class="ci-icon">⌖</span>${esc(d.location)}</span>` : ''}
      ${d.website  ? `<span class="contact-item"><span class="ci-icon">⊕</span>${esc(d.website)}</span>` : ''}
    </div>
  </div>
  <div class="prof-body">
    ${d.summary ? `<div><div class="section-title">${icon('★')} Profil</div><div class="summary-text">${esc(d.summary)}</div></div>` : ''}
    ${d.experience.length ? `<div><div class="section-title">${icon('▶')} Expériences Professionnelles</div>${d.experience.map(e =>
      `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}, <em style="font-weight:400;font-style:italic">${esc(e.company)}</em></div><div class="entry-sub">${e.description ? esc(e.description) : ''}</div></div><div class="entry-date">${esc(e.startDate)}${e.endDate || e.current ? ` – ${e.current ? 'Present' : esc(e.endDate)}` : ''}</div></div></div>`
    ).join('')}</div>` : ''}
    ${d.education.length ? `<div><div class="section-title">${icon('▶')} Formations</div>${d.education.map(e =>
      `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.degree)}${e.field ? `, ${esc(e.field)}` : ''}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${esc(e.startDate)}${e.endDate || e.current ? ` – ${e.current ? 'Present' : esc(e.endDate)}` : ''}</div></div></div>`
    ).join('')}</div>` : ''}
    ${d.skills.length ? `<div><div class="section-title">${icon('◆')} Compétences Clés</div><div class="skills-grid">${d.skills.map(g =>
      `<div><div class="skill-group-name">${esc(g.category)}</div><ul class="skill-list">${g.skills.split(',').map(s => `<li>${esc(s.trim())}</li>`).join('')}</ul></div>`
    ).join('')}</div></div>` : ''}
    ${d.languages?.length ? `<div><div class="section-title">${icon('◆')} Langues</div>${d.languages.map(l =>
      `<div class="lang-row"><span>${esc(l.language)}</span><span class="lang-level">${esc(l.level)}</span></div>`).join('')}</div>` : ''}
  </div>`;
}

// ─── Nova CSS ─────────────────────────────────────────────────────────────────
const novaCSS = `
.nova-hero{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0c4a6e 100%);padding:2.5rem 2.75rem 2rem;position:relative;overflow:hidden}
.nova-hero::before{content:'';position:absolute;top:-80px;right:-80px;width:300px;height:300px;background:radial-gradient(circle,rgba(14,165,233,.22) 0%,transparent 70%);border-radius:50%}
.nova-hero::after{content:'';position:absolute;bottom:-50px;left:25%;width:200px;height:200px;background:radial-gradient(circle,rgba(139,92,246,.18) 0%,transparent 70%);border-radius:50%}
.nova-name{font-family:'Outfit',sans-serif;font-size:2rem;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1.1;word-break:break-word;position:relative;z-index:1}
.nova-title{font-size:.8rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-top:.35rem;background:linear-gradient(90deg,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;position:relative;z-index:1;word-break:break-word}
.nova-contact{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.1rem;position:relative;z-index:1}
.nova-chip{display:inline-flex;align-items:center;gap:.35rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:20px;padding:.25rem .75rem;font-size:.72rem;color:rgba(255,255,255,.88);font-weight:600;word-break:break-all;overflow-wrap:anywhere}
.nova-body{display:grid;grid-template-columns:1fr 220px;gap:0}
.nova-main{padding:2rem 2.25rem;display:flex;flex-direction:column;gap:1.75rem;border-right:1px solid #f1f5f9;min-width:0}
.nova-side{padding:2rem 1.5rem;background:#fafbff;display:flex;flex-direction:column;gap:1.75rem;min-width:0}
.nova-summary{font-size:.875rem;color:#475569;line-height:1.75;padding:.9rem 1.1rem;background:linear-gradient(135deg,#f0f9ff,#faf5ff);border-radius:10px;border-left:3px solid #0ea5e9;word-break:break-word;overflow-wrap:break-word}
.section-title{font-family:'Outfit',sans-serif;font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#0ea5e9;margin-bottom:.9rem;display:flex;align-items:center;gap:.5rem}
.section-title::after{content:'';flex:1;height:1.5px;background:linear-gradient(to right,#bae6fd,transparent)}
.side-section-title{font-family:'Outfit',sans-serif;font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#8b5cf6;margin-bottom:.8rem;display:flex;align-items:center;gap:.5rem}
.side-section-title::after{content:'';flex:1;height:1.5px;background:linear-gradient(to right,#ddd6fe,transparent)}
.entry{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #f1f5f9;position:relative;padding-left:1rem}
.entry::before{content:'';position:absolute;left:0;top:.38rem;width:6px;height:6px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);flex-shrink:0}
.entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;flex-wrap:wrap}
.entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
.entry-title{font-weight:800;font-size:.9rem;color:#0f172a;word-break:break-word}
.entry-sub{font-size:.78rem;color:#0ea5e9;font-weight:700;margin-top:.08rem;word-break:break-word}
.entry-date{font-size:.7rem;color:#94a3b8;font-weight:600;flex-shrink:0;white-space:nowrap;background:#f1f5f9;padding:.15rem .5rem;border-radius:20px}
.entry-desc{font-size:.8rem;color:#64748b;margin-top:.4rem;line-height:1.65;word-break:break-word;overflow-wrap:break-word}
.skill-group-name{font-size:.7rem;font-weight:800;color:#1e293b;margin-bottom:.35rem;margin-top:.6rem;word-break:break-word}
.skill-group-name:first-child{margin-top:0}
.skill-pill{display:inline-flex;background:linear-gradient(135deg,#eff6ff,#faf5ff);border:1px solid #e0e7ff;border-radius:20px;padding:.2rem .6rem;font-size:.68rem;font-weight:700;color:#4f46e5;margin:.15rem .1rem;word-break:break-word}
.lang-item{display:flex;justify-content:space-between;align-items:center;gap:.5rem;padding:.35rem 0;border-bottom:1px solid #f1f5f9}
.lang-item:last-child{border-bottom:none}
.lang-name{font-size:.78rem;font-weight:700;color:#1e293b}
.lang-badge{font-size:.66rem;font-weight:700;color:#0ea5e9;background:#f0f9ff;border:1px solid #bae6fd;border-radius:20px;padding:.12rem .5rem;flex-shrink:0}
`;

// ─── Nova body ────────────────────────────────────────────────────────────────
function novaBody(d: CVBuiltData): string {
  const chips = [d.email,d.phone,d.location,d.website].filter(Boolean)
    .map(v => `<span class="nova-chip">${esc(v!)}</span>`).join('');

  const expItems = d.experience.map(e => {
    const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
    const desc = e.description ? `<div class="entry-desc">${esc(e.description)}</div>` : '';
    return `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><div class="entry-date">${date}</div></div>${desc}</div>`;
  }).join('');

  const eduItems = d.education.map(e => {
    const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
    const deg = e.field ? `${esc(e.degree)} in ${esc(e.field)}` : esc(e.degree);
    return `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${deg}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${date}</div></div></div>`;
  }).join('');

  const sideSkills = d.skills.map(g =>
    `<div class="skill-group-name">${esc(g.category)}</div>${
      g.skills.split(',').map(s => `<span class="skill-pill">${esc(s.trim())}</span>`).join('')
    }`).join('');

  const sideLangs = (d.languages||[]).map(l =>
    `<div class="lang-item"><span class="lang-name">${esc(l.language)}</span><span class="lang-badge">${esc(l.level)}</span></div>`).join('');

  return `
  <div class="nova-hero">
    <div class="nova-name">${esc(d.name)}</div>
    <div class="nova-title">${esc(d.title)}</div>
    <div class="nova-contact">${chips}</div>
  </div>
  <div class="nova-body">
    <div class="nova-main">
      ${d.summary ? `<div><div class="section-title">About</div><div class="nova-summary">${esc(d.summary)}</div></div>` : ''}
      ${d.experience.length ? `<div><div class="section-title">Experience</div>${expItems}</div>` : ''}
      ${d.education.length ? `<div><div class="section-title">Education</div>${eduItems}</div>` : ''}
    </div>
    <div class="nova-side">
      ${d.skills.length ? `<div><div class="side-section-title">Skills</div>${sideSkills}</div>` : ''}
      ${d.languages?.length ? `<div><div class="side-section-title">Languages</div>${sideLangs}</div>` : ''}
    </div>
  </div>`;
}
