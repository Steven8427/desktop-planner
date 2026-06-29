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

  addTask(text, time) {
    this.tasks.push({
      id: Date.now(),        // 用时间戳当唯一 id
      text,
      time: time || '',      // "HH:MM" 或空
      done: false,
      firedDate: '',         // 记录这条已在哪天提醒过，避免重复弹
    });
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

  setSummaryTime(time) {
    this.settings.summaryTime = time;
    this.settings.summaryFiredDate = '';  // 改了时间，重置今天的"已提醒"标记
    this.save();
  },
};
