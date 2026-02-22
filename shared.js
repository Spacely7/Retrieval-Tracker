// ============================================================
// RETRIEVAL TRACK — Shared UI Utilities
// ============================================================

// ---- TOAST ----
function showToast(msg, type='success') {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = type + ' show';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3400);
}

// ---- MODAL ----
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function closeModalOverlay(e) { if (e.target === e.currentTarget) closeModal(e.currentTarget.id); }

// ---- DARK MODE ----
function toggleDark() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('rt_dark', dark ? '1' : '');
}
function applyDarkPref() {
  if (localStorage.getItem('rt_dark')) document.body.classList.add('dark');
}

// ---- SIDEBAR ----
const NAV_ITEMS = [
  { section: 'Overview' },
  { id:'dashboard',      icon:'🏠', label:'Dashboard',           page:'dashboard.html' },
  { section: 'Operations' },
  { id:'issue',          icon:'📤', label:'Issue Device',         page:'issue-device.html' },
  { id:'officer',        icon:'👤', label:'Officer Tracker',      page:'officer-tracker.html' },
  { id:'fieldconfirm',   icon:'✅', label:'Field Confirmation',   page:'field-confirm.html', badge:'fc' },
  { section: 'Device Status' },
  { id:'retrieval',      icon:'📥', label:'Retrieval',            page:'retrieval.html',      badge:'ret' },
  { id:'delayed',        icon:'⚠️', label:'Delayed',              page:'delayed.html',         badge:'del', badgeClass:'red' },
  { id:'timeline',       icon:'🕐', label:'Device Timeline',      page:'timeline.html' },
  { section: 'Insights' },
  { id:'reports',        icon:'📋', label:'Reports',              page:'reports.html' },
  { id:'analytics',      icon:'📊', label:'Analytics',            page:'analytics.html' },
  { id:'performance',    icon:'🏆', label:'Performance',          page:'performance.html' },
  { section: 'Admin' },
  { id:'roles',          icon:'🔐', label:'Roles & Users',        page:'admin-roles.html' },
  { id:'sla',            icon:'⏱️', label:'SLA Rules',            page:'admin-sla.html' },
  { id:'bulkimport',     icon:'📁', label:'Bulk Import',          page:'admin-import.html' },
  { id:'sms',            icon:'💬', label:'SMS / Alerts',         page:'admin-sms.html' },
  { id:'mapview',        icon:'🗺️', label:'Map View',             page:'map-view.html' },
  { section: 'Alerts' },
  { id:'notifications',  icon:'🔔', label:'Notifications',        page:'notifications.html', badge:'notif', badgeClass:'orange' },
];

function renderSidebar(activePage) {
  const session = DB.getSession();
  if (!session) return;
  const perms = ROLE_PERMISSIONS[session.role] || [];
  const unread = DB.getUnreadCount();
  const delayed = DB.getDevices().filter(d => d.isDelayed && d.status !== 'Retrieved').length;
  const awaiting = DB.getDevices().filter(d => d.status === 'Awaiting Retrieval' && d.fieldConfirmed && !d.isDelayed).length;
  const unconfirmed = DB.getDevices().filter(d => !d.fieldConfirmed && d.status !== 'Retrieved').length;
  const badgeCounts = { fc: unconfirmed, ret: awaiting, del: delayed, notif: unread };

  let html = '';
  NAV_ITEMS.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section">${item.section}</div>`;
      return;
    }
    const allowed = perms.includes(item.id);
    const isActive = item.id === activePage;
    const badgeVal = item.badge ? badgeCounts[item.badge] : 0;
    const badgeCls = item.badgeClass === 'orange' ? 'o' : item.badgeClass === 'red' ? '' : 'g';
    html += `
      <a class="nav-item${isActive ? ' active' : ''}${!allowed ? ' disabled' : ''}" href="${allowed ? item.page : '#'}">
        <span class="nav-icon">${item.icon}</span>
        ${item.label}
        ${badgeVal > 0 ? `<span class="nav-badge ${badgeCls}">${badgeVal}</span>` : ''}
      </a>`;
  });

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">📦</div>
      <div>
        <div class="logo-text">Retrieval Track</div>
        <div class="logo-sub">Port Device Mgmt</div>
      </div>
    </div>
    <nav class="sidebar-nav">${html}</nav>
    <div class="sidebar-footer">
      <div class="sidebar-avatar" style="background:${session.color||'#1e3a5f'}">${(session.name||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}</div>
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div class="sidebar-uname">${session.name}</div>
        <div class="sidebar-urole">${session.role}</div>
      </div>
      <div class="sidebar-actions">
        <button class="icon-btn" onclick="toggleDark()" title="Toggle dark mode">🌙</button>
        <button class="icon-btn" onclick="logout()" title="Logout">🚪</button>
      </div>
    </div>`;
}

function logout() {
  DB.clearSession();
  window.location.href = 'index.html';
}

function initHamburger() {
  const btn = document.querySelector('.hamburger');
  const sidebar = document.getElementById('sidebar');
  if (btn && sidebar) {
    btn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btn.contains(e.target))
        sidebar.classList.remove('open');
    });
  }
}

// ---- DONUT CHART ----
function drawDonut(svgId, legendId, segs, total) {
  const svg = document.getElementById(svgId);
  if (!svg) return;
  const cx=65, cy=65, r=48, stroke=20, circ=2*Math.PI*r;
  let off=0, paths='';
  segs.forEach(s => {
    const pct = total > 0 ? s.val / total : 0;
    const dash = pct * circ;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${s.color}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(2)} ${circ.toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90,${cx},${cy})"/>`;
    off += dash;
  });
  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r+stroke/2+1}" fill="var(--bg)"/>
    <circle cx="${cx}" cy="${cy}" r="${r-stroke/2-1}" fill="var(--card)"/>
    ${paths}
    <text x="${cx}" y="${cy-2}" text-anchor="middle" fill="var(--text)" font-family="Syne,sans-serif" font-weight="800" font-size="18">${total}</text>
    <text x="${cx}" y="${cy+13}" text-anchor="middle" fill="var(--text-muted)" font-size="9">devices</text>`;
  const leg = document.getElementById(legendId);
  if (leg) leg.innerHTML = segs.map(s => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <span>${s.label}: <strong>${total>0?(s.val/total*100).toFixed(0):0}%</strong> (${s.val})</span>
    </div>`).join('');
}

// ---- BAR CHART ----
function drawBars(containerId, items, colorFn) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const max = Math.max(...items.map(x => x.val), 1);
  el.innerHTML = items.map(item => `
    <div class="bar-row">
      <div class="bar-label" title="${item.label}">${item.label.length > 18 ? item.label.slice(0,18)+'…' : item.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.val/max*100).toFixed(1)}%;background:${colorFn(item)};"></div></div>
      <div class="bar-count">${item.val}</div>
    </div>`).join('');
}

// ---- MONTH CHART ----
function drawMonthChart(canvasId, data) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const months = [];
  for (let i=5; i>=0; i--) {
    let d = new Date(TODAY); d.setMonth(d.getMonth()-i);
    months.push({ label: d.toLocaleDateString('en-US',{month:'short'}), key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
  }
  const ret = months.map(m => data.filter(d => d.status==='Retrieved' && d.issued?.startsWith(m.key)).length);
  const del = months.map(m => data.filter(d => d.isDelayed && d.issued?.startsWith(m.key)).length);
  const maxV = Math.max(...ret, ...del, 1);
  const W=canvas.width, H=canvas.height, pad={t:16,r:10,b:28,l:28};
  const cW=W-pad.l-pad.r, cH=H-pad.t-pad.b;
  const dark = document.body.classList.contains('dark');
  ctx.fillStyle = dark ? '#0f1828' : '#f8f9ff';
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = dark ? '#1e2d48' : '#e2e6f0'; ctx.lineWidth=1;
  for (let i=0;i<=4;i++) { const y=pad.t+cH*(1-i/4); ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(W-pad.r,y); ctx.stroke(); }
  const bw = cW/months.length/3;
  months.forEach((m,i) => {
    const x = pad.l + i*(cW/months.length) + (cW/months.length-bw*2.5)/2;
    const rh = ret[i]/maxV*cH; ctx.fillStyle='#00c5a3'; ctx.fillRect(x, pad.t+cH-rh, bw, rh);
    const dh = del[i]/maxV*cH; ctx.fillStyle='#e84040'; ctx.fillRect(x+bw+2, pad.t+cH-dh, bw, dh);
    ctx.fillStyle = dark ? '#7484aa' : '#6b7494';
    ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign='center';
    ctx.fillText(m.label, x+bw, H-6);
  });
  ctx.fillStyle='#00c5a3'; ctx.fillRect(W-90,8,8,8);
  ctx.fillStyle=dark?'#7484aa':'#6b7494'; ctx.font='10px DM Sans'; ctx.textAlign='left'; ctx.fillText('Retrieved',W-78,16);
  ctx.fillStyle='#e84040'; ctx.fillRect(W-90,22,8,8); ctx.fillText('Delayed',W-78,30);
}

// ---- PAGINATION ----
function renderPagination(type, total, cur, renderFn) {
  const pagesEl = document.getElementById(type+'-pages');
  const infoEl  = document.getElementById(type+'-info');
  if (!pagesEl) return;
  const pages = Math.ceil(total/10);
  const start = (cur-1)*10;
  pagesEl.innerHTML = Array.from({length:pages},(_,i) =>
    `<button class="page-btn${i+1===cur?' active':''}" onclick="${renderFn}(${i+1})">${i+1}</button>`).join('');
  if (infoEl) infoEl.textContent = total ? `${Math.min(start+1,total)}–${Math.min(start+10,total)} of ${total}` : '0 records';
}

// ---- STANDARD PAGE SHELL ----
function buildPageShell(activePage, title, subtitle) {
  return `
  <button class="hamburger" id="hamburger-btn">☰</button>
  <div class="app-layout">
    <aside class="sidebar" id="sidebar"></aside>
    <div class="main">
      <div class="topbar">
        <div class="topbar-title">${title}</div>
        <div class="topbar-actions" id="topbar-actions"></div>
      </div>
      <div class="page-inner" id="page-inner"></div>
    </div>
  </div>
  <div id="toast"></div>`;
}

// ---- REQUIRE AUTH ----
function pageInit(activePage) {
  applyDarkPref();
  const session = DB.requireAuth();
  if (!session) return null;
  if (!canAccess(activePage)) {
    showToast('Access denied for your role', 'error');
    setTimeout(() => window.location.href = 'dashboard.html', 1500);
    return null;
  }
  renderSidebar(activePage);
  initHamburger();
  return session;
}

// ---- Prevent double submit ----
let submitting = false;
function safeSubmit(fn) {
  if (submitting) return;
  submitting = true;
  try { fn(); } finally { setTimeout(() => submitting=false, 800); }
}
