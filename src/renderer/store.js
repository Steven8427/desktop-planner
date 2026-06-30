// ===== 数据层 =====
// 负责"计划"和"设置"的读取与保存（用浏览器自带的 localStorage 持久化）。
// 整个应用只通过 Store 这一个全局对象来读写数据，方便以后维护。
const Store = {
  tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
  settings: JSON.parse(localStorage.getItem('settings') || '{}'),

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('settings', JSON.stringify(this.settings));
  },

  addTask(text, time, repeat) {
    this.tasks.push({
      id: Date.now(),                      // 用时间戳当唯一 id
      text,
      time: time || '',                    // "HH:MM" 或空
      repeat: repeat || 'none',            // 'none' | 'daily' | 'weekly'
      repeatWeekday: new Date().getDay(),  // 周几创建的（每周重复时用来对齐）
      lastResetDate: new Date().toDateString(),
      done: false,
      firedDate: '',                       // 记录这条已在哪天提醒过，避免重复弹
    });
    this.save();
  },

  editTask(id, newText) {
    const t = this.tasks.find(t => t.id === id);
    if (t) t.text = newText;
    this.save();
  },

  toggleTask(id) {
    const t = this.tasks.find(t => t.id === id);
    if (t) t.done = !t.done;
    this.save();
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.save();
  },

  // 拖动排序：把"被拖的那条"插到"目标那条"的位置
  reorder(draggedId, targetId) {
    const from = this.tasks.findIndex(t => t.id === draggedId);
    const to = this.tasks.findIndex(t => t.id === targetId);
    if (from === -1 || to === -1) return;
    const [moved] = this.tasks.splice(from, 1);
    this.tasks.splice(to, 0, moved);
    this.save();
  },

  // 重复计划：到了新的一天 / 新的一周，就把"已完成"重置，让它重新出现
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
    return changed;  // 告诉调用方是否有变化（需要重新渲染）
  },

  setSummaryTime(time) {
    this.settings.summaryTime = time;
    this.settings.summaryFiredDate = '';
    this.save();
  },

  setOpacity(v) {
    this.settings.opacity = v;
    this.save();
  },

  setAccent(c) {
    this.settings.accent = c;
    this.save();
  },
};
