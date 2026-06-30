// ===== 提醒层 =====
// 每 20 秒检查一次：重复计划要不要重置、有没有到开始时间的今日任务要提醒。
const Reminders = {
  onChange: null,  // 数据被自动重置后用来通知界面刷新

  nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  today() {
    return new Date().toDateString();
  },

  check() {
    // 跨天/跨周时，重复计划自动重置 → 刷新界面
    if (Store.applyRecurringResets() && this.onChange) this.onChange();

    const cur = this.nowHHMM();
    const day = this.today();

    Store.tasks.forEach(task => {
      if (!task.done && Store.isToday(task) && task.startTime === cur && task.firedDate !== day) {
        new Notification('⏰ 任务提醒', { body: task.name });
        task.firedDate = day;
      }
    });

    Store.save();
  },

  start(onChange) {
    this.onChange = onChange || null;
    setInterval(() => this.check(), 20000);
  },
};
