// ===== Reminder layer =====
// Every 20s: reset recurring tasks if needed, and fire reminders for today's tasks.
// Reminder time = start time minus the "remind before" minutes from settings.
const Reminders = {
  onChange: null,  // callback to refresh the UI after an automatic reset

  nowHHMM() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  },

  today() {
    return new Date().toDateString();
  },

  // Shift 'HH:MM' by delta minutes (can be negative), wrapping within 0-24h
  shiftTime(hhmm, delta) {
    const [h, m] = hhmm.split(':').map(Number);
    let total = (((h * 60 + m + delta) % 1440) + 1440) % 1440;
    const p = n => String(n).padStart(2, '0');
    return p(Math.floor(total / 60)) + ':' + p(total % 60);
  },

  check() {
    // Reset recurring tasks on day/week rollover -> refresh UI
    if (Store.applyRecurringResets() && this.onChange) this.onChange();

    const cur = this.nowHHMM();
    const day = this.today();
    const notifyOn = Store.settings.notifications !== false;
    const lead = Number(Store.settings.reminderLead) || 0;

    Store.tasks.forEach(task => {
      if (task.done || !task.startTime || !Store.isToday(task)) return;
      const remindAt = this.shiftTime(task.startTime, -lead);  // remind `lead` minutes early
      if (remindAt === cur && task.firedDate !== day) {
        if (notifyOn) {
          new Notification(t('notif_title'), { body: task.name });
          task.firedDate = day;  // skip the mark while notifications are off, so it can still fire later
        }
      }
    });

    Store.save();
  },

  start(onChange) {
    this.onChange = onChange || null;
    setInterval(() => this.check(), 20000);
  },
};
