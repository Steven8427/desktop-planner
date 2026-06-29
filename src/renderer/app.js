// ===== 界面层 =====
// 把页面上的输入框、按钮、列表和 Store / Reminders 连起来。
const input = document.getElementById('taskInput');
const timeInput = document.getElementById('taskTime');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('taskList');
const summaryTimeInput = document.getElementById('summaryTime');

// 把已保存的"每日汇总时间"回填到输入框
if (Store.settings.summaryTime) summaryTimeInput.value = Store.settings.summaryTime;

function render() {
  list.innerHTML = '';
  Store.tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = task.done ? 'done' : '';
    const timeLabel = task.time ? `<span class="time">⏰ ${task.time}</span>` : '';
    li.innerHTML = `
      <div class="task-main">
        <span class="text">${task.text}</span>
        ${timeLabel}
      </div>
      <div class="task-actions">
        <button class="done-btn" data-id="${task.id}">✓</button>
        <button class="del-btn" data-id="${task.id}">✕</button>
      </div>`;
    list.appendChild(li);
  });
}

addBtn.onclick = () => {
  const text = input.value.trim();
  if (!text) return;
  Store.addTask(text, timeInput.value);
  input.value = '';
  timeInput.value = '';
  render();
};

// 回车也能添加
input.addEventListener('keydown', e => { if (e.key === 'Enter') addBtn.click(); });

list.onclick = (e) => {
  const id = Number(e.target.dataset.id);
  if (!id) return;
  if (e.target.classList.contains('done-btn')) Store.toggleTask(id);
  else if (e.target.classList.contains('del-btn')) Store.deleteTask(id);
  render();
};

// 改了每日汇总时间就保存
summaryTimeInput.onchange = () => Store.setSummaryTime(summaryTimeInput.value);

render();
Reminders.start();
