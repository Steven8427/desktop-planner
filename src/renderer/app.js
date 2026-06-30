// ===== 界面层 =====
// 把页面上的输入框、按钮、列表和 Store / Reminders 连起来。
const input = document.getElementById('taskInput');
const timeInput = document.getElementById('taskTime');
const repeatInput = document.getElementById('taskRepeat');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('taskList');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const summaryTimeInput = document.getElementById('summaryTime');
const opacityInput = document.getElementById('opacity');
const accentInput = document.getElementById('accent');

// ---- 外观：把设置里的透明度/主题色写到 CSS 变量上 ----
function applyAppearance() {
  const root = document.documentElement;
  root.style.setProperty('--bg-alpha', Store.settings.opacity ?? 0.88);
  root.style.setProperty('--accent', Store.settings.accent || '#4f8cff');
}

// 初始化设置面板里的控件值
summaryTimeInput.value = Store.settings.summaryTime || '';
opacityInput.value = Store.settings.opacity ?? 0.88;
accentInput.value = Store.settings.accent || '#4f8cff';

// ---- 渲染列表 ----
function render() {
  list.innerHTML = '';
  Store.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.done ? 'done' : '';
    li.draggable = true;
    li.dataset.id = task.id;

    const timeLabel = task.time ? `<span class="time">⏰ ${task.time}</span>` : '';
    const repeatLabel = (task.repeat && task.repeat !== 'none')
      ? `<span class="repeat">🔁 ${task.repeat === 'daily' ? '每天' : '每周'}</span>` : '';
    const meta = (timeLabel || repeatLabel) ? `<div class="meta">${timeLabel}${repeatLabel}</div>` : '';

    li.innerHTML = `
      <div class="task-main">
        <span class="text">${task.text}</span>
        ${meta}
      </div>
      <div class="task-actions">
        <button class="done-btn" data-id="${task.id}">✓</button>
        <button class="del-btn" data-id="${task.id}">✕</button>
      </div>`;
    list.appendChild(li);
  });
}

// ---- 添加 ----
addBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  Store.addTask(text, timeInput.value, repeatInput.value);
  input.value = '';
  timeInput.value = '';
  repeatInput.value = 'none';
  render();
};
input.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

// ---- 完成 / 删除 ----
list.addEventListener('click', e => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  if (e.target.classList.contains('done-btn')) Store.toggleTask(id);
  else if (e.target.classList.contains('del-btn')) Store.deleteTask(id);
  render();
});

// ---- 双击文字 = 编辑 ----
list.addEventListener('dblclick', e => {
  const span = e.target.closest('.text');
  if (!span) return;
  const li = e.target.closest('li');
  const id = Number(li.dataset.id);
  const task = Store.tasks.find(t => t.id === id);
  if (!task) return;

  li.draggable = false;  // 编辑时先关掉拖动，否则没法在输入框里选字
  const box = document.createElement('input');
  box.className = 'edit-input';
  box.value = task.text;
  span.replaceWith(box);
  box.focus(); box.select();

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const v = box.value.trim();
    if (v) Store.editTask(id, v);
    render();
  };
  box.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') commit();
    else if (ev.key === 'Escape') { committed = true; render(); }
  });
  box.addEventListener('blur', commit);
});

// ---- 拖动排序 ----
let dragId = null;
list.addEventListener('dragstart', e => {
  const li = e.target.closest('li');
  if (!li) return;
  dragId = Number(li.dataset.id);
  li.classList.add('dragging');
});
list.addEventListener('dragend', e => {
  const li = e.target.closest('li');
  if (li) li.classList.remove('dragging');
  dragId = null;
});
list.addEventListener('dragover', e => e.preventDefault());  // 允许放下
list.addEventListener('drop', e => {
  e.preventDefault();
  const li = e.target.closest('li');
  if (!li || dragId == null) return;
  const targetId = Number(li.dataset.id);
  if (targetId !== dragId) { Store.reorder(dragId, targetId); render(); }
});

// ---- 设置面板 ----
settingsBtn.onclick = () => settingsPanel.classList.toggle('hidden');
summaryTimeInput.onchange = () => Store.setSummaryTime(summaryTimeInput.value);
opacityInput.oninput = () => { Store.setOpacity(parseFloat(opacityInput.value)); applyAppearance(); };
accentInput.oninput = () => { Store.setAccent(accentInput.value); applyAppearance(); };

// ---- 启动 ----
applyAppearance();
Store.applyRecurringResets();
render();
Reminders.start(render);   // 把 render 传进去，重复计划自动重置后能刷新界面
