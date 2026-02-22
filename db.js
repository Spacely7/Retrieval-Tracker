// ============================================================
// RETRIEVAL TRACK — Shared Database (localStorage-based)
// ============================================================

const DB = {
  // ---- KEYS ----
  KEYS: {
    DEVICES: 'rt_devices',
    USERS: 'rt_users',
    ISSUANCES: 'rt_issuances',
    NOTIFICATIONS: 'rt_notifications',
    SMS_LOG: 'rt_sms_log',
    SLA: 'rt_sla',
    SESSION: 'rt_session',
    AUDIT: 'rt_audit',
  },

  // ---- HELPERS ----
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },
  update(key, fn) {
    const v = this.get(key);
    const updated = fn(v);
    this.set(key, updated);
    return updated;
  },

  // ---- SESSION ----
  getSession() { return this.get(this.KEYS.SESSION); },
  setSession(user) { this.set(this.KEYS.SESSION, user); },
  clearSession() { localStorage.removeItem(this.KEYS.SESSION); },
  requireAuth() {
    const s = this.getSession();
    if (!s) { window.location.href = 'index.html'; return null; }
    return s;
  },

  // ---- USERS ----
  getUsers() { return this.get(this.KEYS.USERS) || []; },
  setUsers(u) { this.set(this.KEYS.USERS, u); },
  getUserByCredentials(username, password) {
    return this.getUsers().find(u => u.username === username && u.password === password && u.active);
  },
  addUser(user) {
    const users = this.getUsers();
    user.id = 'u_' + Date.now();
    user.active = true;
    user.createdAt = new Date().toISOString();
    users.push(user);
    this.setUsers(users);
    return user;
  },
  updateUser(id, data) {
    const users = this.getUsers().map(u => u.id === id ? { ...u, ...data } : u);
    this.setUsers(users);
  },
  deleteUser(id) {
    const users = this.getUsers().filter(u => u.id !== id);
    this.setUsers(users);
  },

  // ---- DEVICES ----
  getDevices() { return this.get(this.KEYS.DEVICES) || []; },
  setDevices(d) { this.set(this.KEYS.DEVICES, d); },
  addDevice(device) {
    const devices = this.getDevices();
    device.id = device.id || 'DEV_' + Date.now();
    device.createdAt = new Date().toISOString();
    device.auditLog = device.auditLog || [];
    devices.push(device);
    this.setDevices(devices);
    return device;
  },
  updateDevice(id, data) {
    const devices = this.getDevices().map(d => d.id === id ? { ...d, ...data } : d);
    this.setDevices(devices);
    return devices.find(d => d.id === id);
  },
  getDevice(id) { return this.getDevices().find(d => d.id === id); },
  appendAudit(deviceId, entry) {
    const d = this.getDevice(deviceId);
    if (!d) return;
    d.auditLog = [...(d.auditLog || []), entry];
    this.updateDevice(deviceId, { auditLog: d.auditLog });
  },

  // ---- ISSUANCES ----
  getIssuances() { return this.get(this.KEYS.ISSUANCES) || []; },
  addIssuance(rec) {
    const list = this.getIssuances();
    rec.id = 'iss_' + Date.now();
    rec.createdAt = new Date().toISOString();
    list.push(rec);
    this.set(this.KEYS.ISSUANCES, list);
    return rec;
  },

  // ---- NOTIFICATIONS ----
  getNotifications() { return this.get(this.KEYS.NOTIFICATIONS) || []; },
  addNotification(n) {
    const list = this.getNotifications();
    n.id = 'notif_' + Date.now() + Math.random();
    n.createdAt = new Date().toISOString();
    n.unread = true;
    list.unshift(n);
    this.set(this.KEYS.NOTIFICATIONS, list.slice(0, 200));
    return n;
  },
  markRead(id) {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, unread: false } : n);
    this.set(this.KEYS.NOTIFICATIONS, list);
  },
  markAllRead() {
    const list = this.getNotifications().map(n => ({ ...n, unread: false }));
    this.set(this.KEYS.NOTIFICATIONS, list);
  },
  getUnreadCount() { return this.getNotifications().filter(n => n.unread).length; },

  // ---- SMS LOG ----
  getSMSLog() { return this.get(this.KEYS.SMS_LOG) || []; },
  addSMS(rec) {
    const list = this.getSMSLog();
    rec.id = 'sms_' + Date.now();
    rec.sentAt = new Date().toISOString();
    list.unshift(rec);
    this.set(this.KEYS.SMS_LOG, list.slice(0, 100));
  },

  // ---- SLA ----
  getSLA() {
    return this.get(this.KEYS.SLA) || {
      Warehouse: 3, Freezones: 2, 'Re-Export': 5, Transit: 5, Petroleum: 3,
      alertDays: 3, alertActive: true
    };
  },
  setSLA(sla) { this.set(this.KEYS.SLA, sla); },

  // ---- AUDIT TRAIL (global) ----
  logAudit(action, details, user) {
    const log = this.get(this.KEYS.AUDIT) || [];
    log.unshift({ action, details, user: user?.name || 'System', ts: new Date().toISOString() });
    this.set(this.KEYS.AUDIT, log.slice(0, 500));
  },
  getAuditLog() { return this.get(this.KEYS.AUDIT) || []; },
};

// ---- CONSTANTS ----
const OFFICERS_DATA = {
  'Yaw Boateng':   { phone: '233597563674', color: '#1a2b5c', init: 'YB', username: 'yaw.boateng' },
  'Kojo Rexford':  { phone: '233206748677', color: '#007a67', init: 'KR', username: 'kojo.rexford' },
  'Elias Brown':   { phone: '233244675874', color: '#b45309', init: 'EB', username: 'elias.brown' },
  'Kofi Brew':     { phone: '233509765467', color: '#6d28d9', init: 'KB', username: 'kofi.brew' },
};
const AGENCIES = ['COMPASS POWER AFRICA LTD','KOMENDA SUGAR FACTORY','RONOR MOTORS','WEB HELP GHANA','DAILY FOOD','WESTERN BEVERAGES LTD','CAVE AND GARDEN','GLOBAL POLY GHANA','MIRO TIMBER','KING RECYCLING SOLUTIONS LTD'];
const DESTINATIONS = ['Elubo','Daily food Limited','Sunda Ghana Ltd','Spaceplast Gh Ltd','Newrest','Paga','Keda','Kumasi','Tema','Takoradi'];
const REGIMES = ['Warehouse','Freezones','Re-Export','Transit','Petroleum'];
const REGIME_COLORS = { Warehouse:'#1e3a5f', Freezones:'#00c5a3', 'Re-Export':'#d97706', Transit:'#ea580c', Petroleum:'#dc2626' };
const REGIME_ICONS = { Warehouse:'🏭', Freezones:'❄️', 'Re-Export':'📤', Transit:'🚛', Petroleum:'⛽' };
const ROLE_PERMISSIONS = {
  Administrator: ['dashboard','issue','officer','fieldconfirm','retrieval','delayed','timeline','reports','analytics','performance','roles','sla','bulkimport','sms','mapview','notifications'],
  Supervisor:    ['dashboard','issue','officer','fieldconfirm','retrieval','delayed','timeline','reports','analytics','performance','notifications'],
  'Field Officer':       ['dashboard','fieldconfirm','timeline','notifications'],
  'Retrieval Officer':   ['dashboard','retrieval','delayed','timeline','notifications'],
};
const TODAY = new Date('2026-02-19');

// ---- UTILS ----
function fmtDate(d) { return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
function fmtDateShort(d) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
function fmtISO(d) { return new Date(d).toISOString().split('T')[0]; }
function addDays(d, n) { let r = new Date(d); r.setDate(r.getDate() + n); return r; }
function daysBetween(a, b) { return Math.floor((new Date(a) - new Date(b)) / (1000 * 86400)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function ri(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function regBadge(r) {
  const cls = { Warehouse:'reg-warehouse', Freezones:'reg-freezones', 'Re-Export':'reg-reexport', Transit:'reg-transit', Petroleum:'reg-petroleum' };
  return `<span class="reg ${cls[r]||''}">${r}</span>`;
}
function statusBadge(status) {
  const m = { 'Awaiting Retrieval':'badge-waiting', 'Retrieved':'badge-retrieved', 'Delayed':'badge-delayed' };
  return `<span class="badge ${m[status]||'badge-waiting'}">${status}</span>`;
}
function avatarHTML(name, color, size=34) {
  const init = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${Math.floor(size*0.35)}px;flex-shrink:0;">${init}</div>`;
}
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm ago';
  if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
  return Math.floor(diff/86400) + 'd ago';
}
function canAccess(page) {
  const s = DB.getSession();
  if (!s) return false;
  const perms = ROLE_PERMISSIONS[s.role] || [];
  return perms.includes(page);
}

// ---- INIT DEFAULT DATA ----
function initDefaultData() {
  if (DB.getUsers().length) return; // already initialized

  // Default users
  const users = [
    { id:'u1', username:'admin', password:'admin123', name:'Admin User', role:'Administrator', phone:'admin@retrievaltrack.com', color:'#1e3a5f', active:true, createdAt: new Date().toISOString() },
    { id:'u2', username:'ama.owusu', password:'sup123', name:'Ama Owusu', role:'Supervisor', phone:'233201234567', color:'#dc2626', active:true, createdAt: new Date().toISOString() },
    { id:'u3', username:'yaw.boateng', password:'ret123', name:'Yaw Boateng', role:'Retrieval Officer', phone:'233597563674', color:'#1a2b5c', active:true, createdAt: new Date().toISOString() },
    { id:'u4', username:'kojo.rexford', password:'ret123', name:'Kojo Rexford', role:'Retrieval Officer', phone:'233206748677', color:'#007a67', active:true, createdAt: new Date().toISOString() },
    { id:'u5', username:'elias.brown', password:'field123', name:'Elias Brown', role:'Field Officer', phone:'233244675874', color:'#b45309', active:true, createdAt: new Date().toISOString() },
    { id:'u6', username:'kofi.brew', password:'ret123', name:'Kofi Brew', role:'Retrieval Officer', phone:'233509765467', color:'#6d28d9', active:true, createdAt: new Date().toISOString() },
  ];
  DB.setUsers(users);

  // Default SLA
  DB.setSLA({ Warehouse:3, Freezones:2, 'Re-Export':5, Transit:5, Petroleum:3, alertDays:3, alertActive:true });

  // Generate seed devices
  _seedDevices();

  // Seed a few notifications
  _seedNotifications();
}

function _seedDevices() {
  const seeded = [
    { id:'8294402634', regime:'Warehouse',  agency:'COMPASS POWER AFRICA LTD', dest:'Elubo',            daysIssued:-3,  returnDays:14, fc:true },
    { id:'8294402610', regime:'Warehouse',  agency:'KOMENDA SUGAR FACTORY',    dest:'Daily food Limited',daysIssued:-5,  returnDays:14, fc:true },
    { id:'8294402587', regime:'Warehouse',  agency:'RONOR MOTORS',             dest:'Sunda Ghana Ltd',   daysIssued:-3,  returnDays:14, fc:true },
    { id:'8294402577', regime:'Warehouse',  agency:'WEB HELP GHANA',           dest:'Spaceplast Gh Ltd', daysIssued:-3,  returnDays:8,  fc:true },
    { id:'8150640211', regime:'Freezones',  agency:'CAVE AND GARDEN',          dest:'Newrest',           daysIssued:-3,  returnDays:7,  fc:true },
    { id:'81506402562',regime:'Warehouse',  agency:'COMPASS POWER AFRICA LTD', dest:'Elubo',            daysIssued:-16, returnDays:5,  fc:true },
    { id:'8150640374', regime:'Petroleum',  agency:'DAILY FOOD',               dest:'Paga',              daysIssued:-25, returnDays:5,  fc:true },
    { id:'8150640436', regime:'Transit',    agency:'MIRO TIMBER',              dest:'Keda',              daysIssued:-6,  returnDays:5,  fc:false },
    { id:'8294402562', regime:'Warehouse',  agency:'WESTERN BEVERAGES LTD',   dest:'Tema',              daysIssued:-2,  returnDays:12, fc:true },
    { id:'8294402557', regime:'Freezones',  agency:'GLOBAL POLY GHANA',        dest:'Takoradi',          daysIssued:-4,  returnDays:10, fc:false },
  ];
  const extraIds = ['8294402553','8294402545','8294402511','8294402446','8294402404','8294402378','8294402349','8294402340','8294402303','8294402274','8294402256','8294402229','8294402204','8294402182','8294402149','8294402123','8294402093','8294402016','8150640478','8025134271','8025134378','8025134394','8025134410','8025134474','8025134495','8025134625','8150640057','8150640085','8150640177','8150640232','8150640258','8150640306','8150640351','8150640415','8150640417','8150640423','8150640436b','8150640466'];
  const officerNames = Object.keys(OFFICERS_DATA);
  const sla = DB.getSLA();

  const devices = [];
  const allSeeds = [...seeded];
  extraIds.forEach(id => allSeeds.push({ id, regime: pick(REGIMES), agency: pick(AGENCIES), dest: pick(DESTINATIONS), daysIssued: -ri(1,20), returnDays: ri(7,21), fc: Math.random() > 0.2 }));

  allSeeds.forEach((s, idx) => {
    const issued = addDays(TODAY, s.daysIssued);
    const expectedReturn = addDays(issued, s.returnDays);
    const daysOverdue = Math.max(0, Math.floor((TODAY - expectedReturn) / (1000*86400)));
    const threshold = sla[s.regime] || 3;
    const isDelayed = daysOverdue >= threshold;
    const fcOfficer = s.fc ? pick(officerNames) : null;
    const retOfficer = idx < 4 ? pick(officerNames) : null;

    const audit = [
      { event:'Device Issued', detail:`Assigned to ${s.agency} – ${s.dest} (${s.regime})`, time:fmtDate(issued), color:'#1e3a5f' },
      { event: s.fc ? 'Field Confirmed' : 'Pending Confirmation', detail: s.fc ? `Confirmed by ${fcOfficer}` : 'Awaiting field officer', time: fmtDate(addDays(issued,1)), color: s.fc ? '#007a67' : '#d97706' },
    ];
    if (idx < 4) {
      audit.push({ event:'Retrieved', detail:`Collected by ${retOfficer}`, time: fmtDate(TODAY), color:'#00c5a3' });
    }

    devices.push({
      id: s.id,
      regime: s.regime,
      agency: s.agency,
      dest: s.dest,
      issued: fmtISO(issued),
      expectedReturn: fmtISO(expectedReturn),
      fieldConfirmed: s.fc,
      fieldConfirmedBy: fcOfficer,
      status: idx < 4 ? 'Retrieved' : isDelayed ? 'Delayed' : 'Awaiting Retrieval',
      daysOverdue,
      isDelayed: idx < 4 ? false : isDelayed,
      retrievalOfficer: retOfficer,
      retrievalTime: idx < 4 ? new Date().toISOString() : null,
      auditLog: audit,
      createdAt: issued.toISOString(),
    });
  });

  DB.setDevices(devices);
}

function _seedNotifications() {
  const notifs = [
    { type:'upcoming', title:'Upcoming – COMPASS POWER AFRICA LTD', desc:'3 devices at Elubo (Warehouse) are due March 3rd. Assign officer promptly.', tag:'upcoming', extra:'Expected: March 3rd, 2026 · Warehouse · 3 devices', officer:null },
    { type:'delayed',  title:'Device Overdue – CAVE AND GARDEN', desc:'Device 8150640211 at Newrest (Freezones) is 8 days overdue.', tag:'delayed', extra:'Device ID: 8150640211 · Overdue: 8 days', officer:null },
    { type:'delayed',  title:'Device Overdue – MIRO TIMBER', desc:'Device 8150640436 at Keda (Transit) is 9 days overdue. Field confirmation pending.', tag:'delayed', extra:'Device ID: 8150640436 · Overdue: 9 days', officer:null },
    { type:'assign',   title:'Assignment – Yaw Boateng', desc:'Yaw Boateng assigned to RONOR MOTORS at Sunda Ghana Ltd.', tag:'assignment', officer:'Yaw Boateng', extra:'Regime: Warehouse · Expected: March 3rd' },
    { type:'retrieved',title:'Retrieved – Kojo Rexford', desc:'Kojo Rexford retrieved 2 devices from WESTERN BEVERAGES LTD.', tag:'retrieved', officer:'Kojo Rexford' },
  ];
  const stored = [];
  notifs.forEach((n, i) => {
    const dt = new Date(TODAY);
    dt.setHours(dt.getHours() - i * 3);
    stored.push({ ...n, id:'notif_seed_'+i, createdAt: dt.toISOString(), unread: i < 2 });
  });
  DB.set(DB.KEYS.NOTIFICATIONS, stored);
}

// Re-evaluate delayed status based on SLA
function reEvaluateDelays() {
  const sla = DB.getSLA();
  const devices = DB.getDevices().map(d => {
    if (d.status === 'Retrieved') return d;
    const daysOverdue = Math.max(0, Math.floor((TODAY - new Date(d.expectedReturn)) / (1000*86400)));
    const threshold = sla[d.regime] || 3;
    const isDelayed = daysOverdue >= threshold;
    return { ...d, daysOverdue, isDelayed, status: isDelayed ? 'Delayed' : (d.status === 'Delayed' ? 'Awaiting Retrieval' : d.status) };
  });
  DB.setDevices(devices);
}

// Init on load
initDefaultData();
