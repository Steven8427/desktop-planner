// ===== 提醒层 =====
// 每隔 20 秒检查一次：有没有到点的计划要提醒、有没有到每日汇总时间。
// 用浏览器自带的 Notification 弹 Windows 通知。依赖上面的 Store。
const Reminders = {
  nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  today() {
    return new Date().toDateString();  // 例如 "Mon Jun 29 2026"
  },

  check() {
    const cur = this.nowHHMM();
    const day = this.today();

    // 1) 每条计划单独提醒
    Store.tasks.forEach(task => {
      if (!task.done && task.time === cur && task.firedDate !== day) {
        new Notification('⏰ 计划提醒', { body: task.text });
        task.firedDate = day;
      }
    });

    // 2) 每日汇总提醒
    const s = Store.settings;
    if (s.summaryTime && s.summaryTime === cur && s.summaryFiredDate !== day) {
      const undone = Store.tasks.filter(t => !t.done);
      const body = undone.length
        ? '还没完成：\n' + undone.map(t => '• ' + t.text).join('\n')
        : '今天的计划都完成啦 🎉';
      new Notification('📋 今日计划汇总', { body });
      s.summaryFiredDate = day;
    }

    Store.save();
  },

  start() {
    setInterval(() => this.check(), 20000);
  },
};
