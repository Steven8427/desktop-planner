// ===== 界面层 / 简单页面路由 =====
const pageTitle = document.getElementById('pageTitle');
const headerDate = document.getElementById('headerDate');
const backBtn = document.getElementById('backBtn');
const fab = document.getElementById('fab');

const TITLES = { today: '今日计划', add: '添加任务', manage: '任务管理', log: '任务日志', settings: '设置' };
let editingId = null;   // 不为 null 时表示"编辑模式"

function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById('view-' + name);
  if (view) view.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n =>
    n.classList.toggle('active', n.dataset.view === name));

  pageTitle.textContent = (name === 'add' && editingId) ? '编辑任务' : TITLES[name];
  headerDate.textContent = name === 'today' ? todayLabel() : '';
  backBtn.classList.toggle('hidden', name !== 'add');   // 只有添加/编辑页显示返回
  fab.classList.toggle('hidden', name !== 'today');     // 只有今日页显示 ＋

  if (name === 'today') renderToday();
  else if (name === 'manage') renderManage();
  else if (name === 'log') renderLog();
  else if (name === 'settings') initSettingsControls();
}

function todayLabel() {
  const d = new Date();
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${wd}`;
}

// ---------- 今日任务 ----------
const todayList = document.getElementById('todayList');
const todayEmpty = document.getElementById('todayEmpty');

function timeText(task) {
  if (task.startTime && task.endTime) return `${task.startTime} - ${task.endTime}`;
  return task.startTime || task.endTime || '';
}

function renderToday() {
  const tasks = Store.tasks.filter(t => Store.isToday(t));
  todayList.innerHTML = '';
  todayEmpty.classList.toggle('hidden', tasks.length > 0);
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = 'card' + (task.done ? ' done' : '');
    const time = timeText(task);
    li.innerHTML = `
      <button class="check" data-id="${task.id}" title="完成">${task.done ? '✓' : ''}</button>
      <div class="card-body">
        <div class="card-name">${escapeHtml(task.name)}</div>
        ${time ? `<div class="card-time">🕐 ${time}</div>` : ''}
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

// ---------- 添加 / 编辑 ----------
const addForm = document.getElementById('addForm');
const fName = document.getElementById('f-name');
const fDate = document.getElementById('f-date');
const fStart = document.getElementById('f-start');
const fEnd = document.getElementById('f-end');
const fRepeat = document.getElementById('f-repeat');
const fNotes = document.getElementById('f-notes');

function openAdd() {
  editingId = null;
  addForm.reset();
  fDate.value = todayDateStr();
  showView('add');
}

function openEdit(id) {
  const t = Store.tasks.find(x => x.id === id);
  if (!t) return;
  editingId = id;
  fName.value = t.name;
  fDate.value = t.date || todayDateStr();
  fStart.value = t.startTime || '';
  fEnd.value = t.endTime || '';
  fRepeat.value = t.repeat || 'none';
  fNotes.value = t.notes || '';
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
  };
  if (!data.name) return;
  if (editingId) Store.editTask(editingId, data);
  else Store.addTask(data);
  editingId = null;
  showView('today');
});

// ---------- 任务管理 ----------
const manageList = document.getElementById('manageList');
const manageEmpty = document.getElementById('manageEmpty');

function renderManage() {
  manageList.innerHTML = '';
  manageEmpty.classList.toggle('hidden', Store.tasks.length > 0);
  const tasks = [...Store.tasks].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  tasks.forEach(task => {
    const repeatTxt = task.repeat === 'daily' ? ' · 🔁每天' : task.repeat === 'weekly' ? ' · 🔁每周' : '';
    const time = timeText(task);
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <div class="card-body">
        <div class="card-name">${escapeHtml(task.name)}</div>
        <div class="card-sub">${task.date || ''}${time ? ' · ' + time : ''}${repeatTxt}</div>
      </div>
      <div class="card-actions">
        <button class="edit-btn" data-id="${task.id}">编辑</button>
        <button class="del-btn" data-id="${task.id}">删除</button>
      </div>`;
    manageList.appendChild(li);
  });
}

manageList.addEventListener('click', e => {
  const editB = e.target.closest('.edit-btn');
  const delB = e.target.closest('.del-btn');
  if (editB) {
    openEdit(Number(editB.dataset.id));
  } else if (delB) {
    const id = Number(delB.dataset.id);
    const t = Store.tasks.find(x => x.id === id);
    if (t && confirm(`确定删除「${t.name}」？`)) {
      Store.deleteTask(id);
      renderManage();
    }
  }
});

// ---------- 任务日志 ----------
const logList = document.getElementById('logList');
const logEmpty = document.getElementById('logEmpty');

function renderLog() {
  logList.innerHTML = '';
  logEmpty.classList.toggle('hidden', Store.logs.length > 0);
  [...Store.logs].reverse().forEach(log => {   // 最新的在最上面
    const li = document.createElement('li');
    li.className = 'log-item';
    li.textContent = `${fmtDateTime(log.time)} ${log.action}：${log.name}`;
    logList.appendChild(li);
  });
}

// ---------- 设置 / 主题 ----------
const sNotify = document.getElementById('s-notify');
const sOpacity = document.getElementById('s-opacity');
const sBg = document.getElementById('s-bg');
const bgPresets = document.querySelectorAll('.bg-preset');

function initSettingsControls() {
  sNotify.checked = Store.settings.notifications !== false;
  sOpacity.value = Store.settings.opacity ?? 1;
  sBg.value = Store.settings.bg || '#1e1e28';
  updatePresetActive();
}

function updatePresetActive() {
  const cur = (Store.settings.bg || '#1e1e28').toLowerCase();
  bgPresets.forEach(b => b.classList.toggle('active', b.dataset.bg.toLowerCase() === cur));
}

sNotify.onchange = () => Store.setNotifications(sNotify.checked);
sOpacity.oninput = () => { Store.setOpacity(parseFloat(sOpacity.value)); applyTheme(); };
sBg.oninput = () => { Store.setBg(sBg.value); applyTheme(); updatePresetActive(); };
bgPresets.forEach(b => b.addEventListener('click', () => {
  Store.setBg(b.dataset.bg);
  sBg.value = b.dataset.bg;
  applyTheme();
  updatePresetActive();
}));

// 把设置里的背景色 + 透明度写到 CSS 变量；文字颜色按背景明暗自动反色保证可读
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

// ---------- 导航 / 窗口控制 ----------
document.querySelectorAll('.nav-item').forEach(n =>
  n.addEventListener('click', () => showView(n.dataset.view)));
fab.addEventListener('click', openAdd);
backBtn.addEventListener('click', () => { editingId = null; showView('today'); });

document.getElementById('minBtn').onclick = () => window.windowApi.minimize();
document.getElementById('closeBtn').onclick = () => window.windowApi.close();

// ---------- 工具 ----------
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

// ---------- 启动 ----------
applyTheme();
Store.applyRecurringResets();
showView('today');
Reminders.start(renderToday);
