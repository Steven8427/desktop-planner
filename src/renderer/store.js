// ===== Data layer =====
// tasks + activity logs + user settings, all persisted in localStorage.
const Store = {
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  logs: JSON.parse(localStorage.getItem('logs') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || '{}'),

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('logs', JSON.stringify(this.logs));
    localStorage.setItem('settings', JSON.stringify(this.settings));
  },

  // Append a log entry; n is an optional number (check-in streak count)
  addLog(action, name, n) {
    const entry = { time: Date.now(), action, name };
    if (n != null) entry.n = n;
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs = this.logs.slice(-500); // keep last 500
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
      checkin: !!data.checkin,              // whether check-in tracking is enabled
      checkinDates: [],                     // array of checked-in dates ['YYYY-MM-DD']
      lastResetDate: new Date().toDateString(),
      done: false,
      firedDate: '',
      createdAt: Date.now(),
    };
    this.tasks.push(task);
    this.addLog('create', task.name);
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
    t.checkin = !!data.checkin;             // keep checkinDates, don't wipe it
    t.repeatWeekday = new Date((t.date || todayDateStr()) + 'T00:00').getDay();
    this.addLog('edit', t.name);
    this.save();
  },

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    t.done = !t.done;
    const today = todayDateStr();

    if (t.checkin) {
      if (!Array.isArray(t.checkinDates)) t.checkinDates = [];
      if (t.done) {
        // Completed -> record one check-in per day (dedupe by date)
        if (!t.checkinDates.includes(today)) {
          t.checkinDates.push(today);
          this.addLog('checkin', t.name, t.checkinDates.length);
        }
      } else {
        // Reopened -> undo today's check-in
        t.checkinDates = t.checkinDates.filter(d => d !== today);
        this.addLog('uncomplete', t.name);
      }
    } else {
      this.addLog(t.done ? 'complete' : 'uncomplete', t.name);
    }
    this.save();
  },

  deleteTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (!t) return;
    this.tasks = this.tasks.filter(x => x.id !== id);
    this.addLog('delete', t.name);
    this.save();
  },

  checkinCount(task) {
    return Array.isArray(task.checkinDates) ? task.checkinDates.length : 0;
  },

  // Whether a task belongs to "today": daily -> always; weekly -> weekday matches; else by date
  isToday(task) {
    if (task.repeat === 'daily') return true;
    if (task.repeat === 'weekly') return new Date().getDay() === task.repeatWeekday;
    return task.date === todayDateStr();
  },

  // Recurring tasks: when the day/week rolls over, reset "done" so they show up again
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

  // ---- settings ----
  setNotifications(on) { this.settings.notifications = on; this.save(); },
  setOpacity(v) { this.settings.opacity = v; this.save(); },
  setBg(c) { this.settings.bg = c; this.save(); },
  setLang(l) { this.settings.lang = l; this.save(); },
  setReminderLead(min) { this.settings.reminderLead = min; this.save(); },
  setDefaultCheckin(on) { this.settings.defaultCheckin = on; this.save(); },
};

// Helper: today's date as 'YYYY-MM-DD'
function todayDateStr() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Helper: timestamp -> 'YYYY-MM-DD HH:MM'
function fmtDateTime(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Backward compatibility: early versions used text/time and had no id/date/checkin etc.
(function migrate() {
  let changed = false;
  Store.tasks.forEach((t, i) => {
    if (t.id == null) { t.id = Date.now() + i; changed = true; }
    if (t.name == null) { t.name = t.text || '(untitled)'; changed = true; }
    if (t.startTime == null) { t.startTime = t.time || ''; changed = true; }
    if (t.endTime == null) { t.endTime = ''; changed = true; }
    if (t.date == null) { t.date = todayDateStr(); changed = true; }
    if (t.notes == null) { t.notes = ''; changed = true; }
    if (t.repeat == null) { t.repeat = 'none'; changed = true; }
    if (t.repeatWeekday == null) { t.repeatWeekday = new Date().getDay(); changed = true; }
    if (t.checkin == null) { t.checkin = false; changed = true; }
    if (t.checkinDates == null) { t.checkinDates = []; changed = true; }
    if (t.lastResetDate == null) { t.lastResetDate = new Date().toDateString(); changed = true; }
    if (t.firedDate == null) { t.firedDate = ''; changed = true; }
    if (t.createdAt == null) { t.createdAt = t.id; changed = true; }
  });
  if (changed) Store.save();
})();
