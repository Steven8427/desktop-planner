const { app, BrowserWindow, Tray, Menu, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let tray;
let isQuiting = false;   // distinguishes the close button (hide to tray) from the tray "Quit" item

// Persist the window position/size in a small json under userData
function stateFile() {
  return path.join(app.getPath('userData'), 'window-state.json');
}
function loadBounds() {
  try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return null; }
}
function saveBounds() {
  if (!win) return;
  try { fs.writeFileSync(stateFile(), JSON.stringify(win.getBounds())); } catch {}
}

function createWindow() {
  const saved = loadBounds();
  win = new BrowserWindow({
    x: saved ? saved.x : undefined,
    y: saved ? saved.y : undefined,
    width: saved && saved.width ? saved.width : 340,
    height: saved && saved.height ? saved.height : 600,
    minWidth: 300,         // resize lower bound so the layout never breaks
    minHeight: 460,
    frame: false,          // frameless (we use custom minimize/close buttons in the UI)
    transparent: true,     // transparent for rounded corners + adjustable background opacity
    alwaysOnTop: true,
    resizable: true,       // allow free resizing
    skipTaskbar: false,    // show a taskbar button so minimize can be restored from it
    title: 'Tickly',
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  win.on('moved', saveBounds);
  win.on('resize', saveBounds);   // remember the new size after resizing

  // Closing the window hides it to the tray instead of quitting
  win.on('close', (e) => {
    saveBounds();
    if (!isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../../assets/icon.png'));
  const menu = Menu.buildFromTemplate([
    { label: 'Show / Hide', click: () => { win.isVisible() ? win.hide() : win.show(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuiting = true; app.quit(); } },
  ]);
  tray.setToolTip('Tickly');
  tray.setContextMenu(menu);
  tray.on('double-click', () => win.show());
}

// Window controls coming from the renderer
ipcMain.on('win:minimize', () => { if (win) win.minimize(); });
ipcMain.on('win:close', () => { if (win) win.hide(); });

// Write a task to an .ics file and open it with the system's default calendar app
function buildIcs(task) {
  const pad = n => String(n).padStart(2, '0');
  const esc = s => String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\r?\n/g, '\\n');
  const local = (dateStr, timeStr) => {
    const [y, m, d] = dateStr.split('-');
    const [hh, mm] = (timeStr || '09:00').split(':');
    return `${y}${m}${d}T${hh}${mm}00`;
  };
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let dtstart, dtend;
  if (task.startTime) {
    dtstart = `DTSTART:${local(task.date, task.startTime)}`;
    dtend = `DTEND:${local(task.date, task.endTime || task.startTime)}`;
  } else {
    const d = String(task.date).replace(/-/g, '');
    dtstart = `DTSTART;VALUE=DATE:${d}`;
    dtend = `DTEND;VALUE=DATE:${d}`;
  }

  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tickly//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:tickly-${task.id || Date.now()}@tickly`,
    `DTSTAMP:${stamp}`,
    dtstart, dtend,
    `SUMMARY:${esc(task.name)}`,
    task.notes ? `DESCRIPTION:${esc(task.notes)}` : '',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

ipcMain.handle('calendar:add', async (e, task) => {
  try {
    const file = path.join(app.getPath('temp'), `tickly-${Date.now()}.ics`);
    fs.writeFileSync(file, buildIcs(task));
    const err = await shell.openPath(file);   // empty string means success
    return { ok: !err, error: err };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});

app.whenReady().then(() => {
  app.setAppUserModelId('com.desktop.planner'); // makes Windows notifications show the app name
  createWindow();
  createTray();
});

// Stay alive in the tray: do not quit when all windows are closed
app.on('window-all-closed', () => {});
