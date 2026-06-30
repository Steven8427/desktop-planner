// ===== UI layer / tiny page router =====
const pageTitle = document.getElementById('pageTitle');
const headerDate = document.getElementById('headerDate');
const backBtn = document.getElementById('backBtn');
const fab = document.getElementById('fab');

const TITLE_KEY = { today: 'title_today', add: 'title_add', manage: 'title_manage', log: 'title_log', settings: 'title_settings' };
let editingId = null;     // non-null means "edit mode"
let currentView = 'today';

function showView(name) {
  currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.view === name));

  pageTitle.textContent = (name === 'add' && editingId) ? t('title_edit') : t(TITLE_KEY[name]);
  headerDate.textContent = name === 'today' ? todayLabel() : '';
  backBtn.classList.toggle('hidden', name !== 'add');
  fab.classList.toggle('hidden', name !== 'today');

  if (name === 'today') renderToday();
  else if (name === 'manage') renderManage();
  else if (name === 'log') renderLog();
  else if (name === 'settings') initSettingsControls();
}

function todayLabel() {
  const lang = Store.settings.lang || 'en';
  const d = new Date();
  if (lang === 'zh') {
    const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 星期${wd}`;
  }
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function timeText(task) {
  if (task.startTime && task.endTime) return `${task.startTime} - ${task.endTime}`;
  return task.startTime || task.endTime || '';
}
function checkinText(task) {
  return t('checkin_days').replace('%d', Store.checkinCount(task));
}

// ---------- Today ----------
const todayList = document.getElementById('todayList');
const todayEmpty = document.getElementById('todayEmpty');

function renderToday() {
  const tasks = Store.tasks.filter(t => Store.isToday(t));
  todayList.innerHTML = '';
  todayEmpty.classList.toggle('hidden', tasks.length > 0);
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'card' + (task.done ? ' done' : '');
    const time = timeText(task);
    li.innerHTML = `
      <button class="check" data-id="${task.id}" title="Done">${task.done ? '✓' : ''}</button>
      <div class="card-body">
        <div class="card-name">${escapeHtml(task.name)}</div>
        ${time ? `<div class="card-time">🕐 ${time}</div>` : ''}
        ${task.checkin ? `<div class="card-checkin">🔥 ${checkinText(task)}</div>` : ''}
        ${task.notes ? `<div class="card-notes">${escapeHtml(task.notes)}</div>` : ''}
      </div>`;
    todayList.appendChild(li);
  });
}

todayList.addEventListener('click', e => {
  const btn = e.target.closest('.check');
  if (!btn) return;
  Store.toggleTask(Number(btn.dataset.id));
  renderToday();
});

// ---------- Add / Edit ----------
const addForm = document.getElementById('addForm');
const fName = document.getElementById('f-name');
const fDate = document.getElementById('f-date');
const fStart = document.getElementById('f-start');
const fEnd = document.getElementById('f-end');
const fRepeat = document.getElementById('f-repeat');
const fNotes = document.getElementById('f-notes');
const fCheckin = document.getElementById('f-checkin');
const checkinInfo = document.getElementById('checkinInfo');

function openAdd() {
  editingId = null;
  addForm.reset();
  fDate.value = todayDateStr();
  fCheckin.checked = !!Store.settings.defaultCheckin;   // "check-in on by default" setting
  checkinInfo.classList.add('hidden');
  showView('add');
}

function openEdit(id) {
  const task = Store.tasks.find(x => x.id === id);
  if (!task) return;
  editingId = id;
  fName.value = task.name;
  fDate.value = task.date || todayDateStr();
  fStart.value = task.startTime || '';
  fEnd.value = task.endTime || '';
  fRepeat.value = task.repeat || 'none';
  fNotes.value = task.notes || '';
  fCheckin.checked = !!task.checkin;
  if (task.checkin) {
    checkinInfo.textContent = '🔥 ' + checkinText(task);
    checkinInfo.classList.remove('hidden');
  } else {
    checkinInfo.classList.add('hidden');
  }
  showView('add');
}

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const data = {
    name: fName.value.trim(),
    date: fDate.value,
    startTime: fStart.value,
    endTime: fEnd.value,
    repeat: fRepeat.value,
    notes: fNotes.value.trim(),
    checkin: fCheckin.checked,
  };
  if (!data.name) return;
  if (editingId) Store.editTask(editingId, data);
  else Store.addTask(data);
  editingId = null;
  showView('today');
});

// ---------- Manage ----------
const manageList = document.getElementById('manageList');
const manageEmpty = document.getElementById('manageEmpty');

function renderManage() {
  manageList.innerHTML = '';
  manageEmpty.classList.toggle('hidden', Store.tasks.length > 0);
  const tasks = [...Store.tasks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  tasks.forEach(task => {
    const repeatTxt = task.repeat === 'daily' ? ' · 🔁' + t('repeat_daily')
      : task.repeat === 'weekly' ? ' · 🔁' + t('repeat_weekly') : '';
    const checkinTxt = task.checkin ? ' · 🔥' + checkinText(task) : '';
    const time = timeText(task);
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="card-body">
        <div class="card-name">${escapeHtml(task.name)}</div>
        <div class="card-sub">${task.date || ''}${time ? ' · ' + time : ''}${repeatTxt}${checkinTxt}</div>
      </div>
      <div class="card-actions">
        <button class="cal-btn" data-id="${task.id}" title="${t('add_calendar')}">📅</button>
        <button class="edit-btn" data-id="${task.id}">${t('btn_edit')}</button>
        <button class="del-btn" data-id="${task.id}">${t('btn_delete')}</button>
      </div>`;
    manageList.appendChild(li);
  });
}

manageList.addEventListener('click', e => {
  const calB = e.target.closest('.cal-btn');
  const editB = e.target.closest('.edit-btn');
  const delB = e.target.closest('.del-btn');
  if (calB) {
    const task = Store.tasks.find(x => x.id === Number(calB.dataset.id));
    if (task) {
      window.windowApi.addToCalendar({
        id: task.id, name: task.name, date: task.date,
        startTime: task.startTime, endTime: task.endTime, notes: task.notes,
      }).then(r => { if (!r || !r.ok) alert(t('cal_failed')); });
    }
  } else if (editB) {
    openEdit(Number(editB.dataset.id));
  } else if (delB) {
    const task = Store.tasks.find(x => x.id === Number(delB.dataset.id));
    if (task && confirm(t('confirm_delete').replace('%s', task.name))) {
      Store.deleteTask(task.id);
      renderManage();
    }
  }
});

// ---------- Activity log ----------
const logList = document.getElementById('logList');
const logEmpty = document.getElementById('logEmpty');
const LOG_CODES = ['create', 'complete', 'uncomplete', 'edit', 'delete', 'checkin'];

function renderLog() {
  logList.innerHTML = '';
  logEmpty.classList.toggle('hidden', Store.logs.length > 0);
  [...Store.logs].reverse().forEach(log => {   // newest first
    const phrase = LOG_CODES.includes(log.action) ? t('log_' + log.action) : log.action;
    let line = `${fmtDateTime(log.time)} ${phrase}${t('colon')}${log.name}`;
    if (log.action === 'checkin' && log.n != null) line += t('checkin_suffix').replace('%d', log.n);
    const li = document.createElement('li');
    li.className = 'log-item';
    li.textContent = line;
    logList.appendChild(li);
  });
}

// ---------- Settings / theme / language ----------
const sNotify = document.getElementById('s-notify');
const sLead = document.getElementById('s-lead');
const sDefCheckin = document.getElementById('s-defcheckin');
const sOpacity = document.getElementById('s-opacity');
const sBg = document.getElementById('s-bg');
const sLang = document.getElementById('s-lang');
const bgPresets = document.querySelectorAll('.bg-preset');
const testNotifyBtn = document.getElementById('testNotifyBtn');
const testTaskBtn = document.getElementById('testTaskBtn');

function initSettingsControls() {
  sNotify.checked = Store.settings.notifications !== false;
  sLead.value = String(Store.settings.reminderLead ?? 0);
  sDefCheckin.checked = !!Store.settings.defaultCheckin;
  sOpacity.value = Store.settings.opacity ?? 1;
  sBg.value = Store.settings.bg || '#1e1e28';
  sLang.value = Store.settings.lang || 'en';
  updatePresetActive();
}

function updatePresetActive() {
  const cur = (Store.settings.bg || '#1e1e28').toLowerCase();
  bgPresets.forEach(b => b.classList.toggle('active', b.dataset.bg.toLowerCase() === cur));
}

sNotify.onchange = () => Store.setNotifications(sNotify.checked);
sLead.onchange = () => Store.setReminderLead(parseInt(sLead.value, 10));
sDefCheckin.onchange = () => Store.setDefaultCheckin(sDefCheckin.checked);
sOpacity.oninput = () => { Store.setOpacity(parseFloat(sOpacity.value)); applyTheme(); };
sBg.oninput = () => { Store.setBg(sBg.value); applyTheme(); updatePresetActive(); };
sLang.onchange = () => { Store.setLang(sLang.value); applyLang(); showView(currentView); };
bgPresets.forEach(b => b.addEventListener('click', () => {
  Store.setBg(b.dataset.bg); sBg.value = b.dataset.bg; applyTheme(); updatePresetActive();
}));

// Test notification: fire one now; prompt to enable if notifications are off
testNotifyBtn.onclick = () => {
  if (Store.settings.notifications === false) { alert(t('enable_notify_first')); return; }
  new Notification(t('test_notif_title'), { body: t('test_notif_body') });
};

// Create a task that reminds in ~1 minute (accounts for the "remind before" offset)
testTaskBtn.onclick = () => {
  if (Store.settings.notifications === false) { alert(t('enable_notify_first')); return; }
  const lead = Number(Store.settings.reminderLead) || 0;
  const d = new Date(Date.now() + (1 + lead) * 60000);
  const p = n => String(n).padStart(2, '0');
  Store.addTask({
    name: t('test_task_name'), date: todayDateStr(),
    startTime: `${p(d.getHours())}:${p(d.getMinutes())}`, repeat: 'none', notes: '', checkin: false,
  });
  alert(t('test_task_created'));
  if (currentView === 'today') renderToday();
};

// Push the background color + opacity into CSS variables; text color auto-inverts by
// background luminance so it stays readable.
function applyTheme() {
  const s = Store.settings;
  const bg = s.bg || '#1e1e28';
  const alpha = s.opacity ?? 1;
  const root = document.documentElement;
  root.style.setProperty('--app-bg', hexToRgba(bg, alpha));
  const dark = isDark(bg);
  root.style.setProperty('--text', dark ? '#e8e8ee' : '#222');
  root.style.setProperty('--text-dim', dark ? '#9a9aac' : '#666');
  root.style.setProperty('--card-bg', dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)');
  root.style.setProperty('--topbar-bg', dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)');
  root.style.setProperty('--nav-bg', dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)');
  root.style.setProperty('--border', dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)');
  root.style.setProperty('--check-border', dark ? '#666' : '#aaa');
}

// Translate every static element marked with data-i18n / data-i18n-ph
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
}

// ---------- Navigation / window controls ----------
document.querySelectorAll('.nav-item').forEach(n =>
  n.addEventListener('click', () => showView(n.dataset.view)));
fab.addEventListener('click', openAdd);
backBtn.addEventListener('click', () => { editingId = null; showView('today'); });

document.getElementById('minBtn').onclick = () => window.windowApi.minimize();
document.getElementById('closeBtn').onclick = () => window.windowApi.close();

// ---------- Helpers ----------
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function hexToRgb(hex) {
  hex = String(hex).replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function hexToRgba(hex, a) { const { r, g, b } = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }
function isDark(hex) { const { r, g, b } = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55; }

// ---------- Startup ----------
applyLang();
applyTheme();
Store.applyRecurringResets();
showView('today');
Reminders.start(renderToday);
