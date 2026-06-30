// ===== 数据层 =====
// 计划(tasks) + 操作日志(logs) + 用户设置(settings)，都用 localStorage 持久化。
const Store = {
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  logs: JSON.parse(localStorage.getItem('logs') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || '{}'),

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('logs', JSON.stringify(this.logs));
    localStorage.setItem('settings', JSON.stringify(this.settings));
  },

  // 记一条日志（创建/完成/修改/删除）
  addLog(action, name) {
    this.logs.push({ time: Date.now(), action, name });
    if (this.logs.length > 500) this.logs = this.logs.slice(-500); // 只留最近 500 条
  },

  addTask(data) {
    const date = data.date || todayDateStr();
    const task = {
      id: Date.now(),
      name: data.name,
      date,                                 // 'YYYY-MM-DD'
      startTime: data.startTime || '',      // 'HH:MM'
      endTime: data.endTime || '',          // 'HH:MM'
      notes: data.notes || '',
      repeat: data.repeat || 'none',        // 'none' | 'daily' | 'weekly'
      repeatWeekday: new Date(date + 'T00:00').getDay(),
      lastResetDate: new Date().toDateString(),
      done: false,
      firedDate: '',
      createdAt: Date.now(),
    };
    this.tasks.push(task);
    this.addLog('创建任务', task.name);
    this.save();
    return task;
  },

  editTask(id, data) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    t.name = data.name;
    t.date = data.date || t.date;
    t.startTime = data.startTime || '';
    t.endTime = data.endTime || '';
    t.notes = data.notes || '';
    t.repeat = data.repeat || 'none';
    t.repeatWeekday = new Date((t.date || todayDateStr()) + 'T00:00').getDay();
    this.addLog('修改任务', t.name);
    this.save();
  },

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    this.addLog(t.done ? '完成任务' : '取消完成', t.name);
    this.save();
  },

  deleteTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    this.tasks = this.tasks.filter(x => x.id !== id);
    this.addLog('删除任务', t.name);
    this.save();
  },

  isToday(task) {
    if (task.repeat === 'daily') return true;
    if (task.repeat === 'weekly') return new Date().getDay() === task.repeatWeekday;
    return task.date === todayDateStr();
  },

  applyRecurringResets() {
    const today = new Date().toDateString();
    const weekday = new Date().getDay();
    let changed = false;
    this.tasks.forEach(t => {
      if (t.repeat === 'daily' && t.lastResetDate !== today) {
        t.done = false; t.firedDate = ''; t.lastResetDate = today; changed = true;
      } else if (t.repeat === 'weekly' && t.lastResetDate !== today && weekday === t.repeatWeekday) {
        t.done = false; t.firedDate = ''; t.lastResetDate = today; changed = true;
      }
    });
    if (changed) this.save();
    return changed;
  },

  // ---- 设置 ----
  setNotifications(on) { this.settings.notifications = on; this.save(); },
  setOpacity(v) { this.settings.opacity = v; this.save(); },
  setBg(c) { this.settings.bg = c; this.save(); },
};

// 工具：今天的 'YYYY-MM-DD'
function todayDateStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// 工具：时间戳 → 'YYYY-MM-DD HH:MM'
function fmtDateTime(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 兼容老数据：早期字段是 text/time、没有 id/date 等，统一补齐
(function migrate() {
  let changed = false;
  Store.tasks.forEach((t, i) => {
    if (t.id == null) { t.id = Date.now() + i; changed = true; }
    if (t.name == null) { t.name = t.text || '(未命名)'; changed = true; }
    if (t.startTime == null) { t.startTime = t.time || ''; changed = true; }
    if (t.endTime == null) { t.endTime = ''; changed = true; }
    if (t.date == null) { t.date = todayDateStr(); changed = true; }
    if (t.notes == null) { t.notes = ''; changed = true; }
    if (t.repeat == null) { t.repeat = 'none'; changed = true; }
    if (t.repeatWeekday == null) { t.repeatWeekday = new Date().getDay(); changed = true; }
    if (t.lastResetDate == null) { t.lastResetDate = new Date().toDateString(); changed = true; }
    if (t.firedDate == null) { t.firedDate = ''; changed = true; }
    if (t.createdAt == null) { t.createdAt = t.id; changed = true; }
  });
  if (changed) Store.save();
})();
