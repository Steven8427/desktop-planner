const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let win;
let tray;
let isQuiting = false;   // 区分"关闭按钮"(藏到托盘) 和 "托盘菜单退出"(真退出)

// 窗口位置记到 userData 目录的小 json 里
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
    minWidth: 300,         // 缩放下限，防止布局挤坏
    minHeight: 460,
    frame: false,          // 无边框（用界面里自定义的最小化/关闭按钮）
    transparent: true,     // 透明（露出圆角 + 支持背景透明度）
    alwaysOnTop: true,
    resizable: true,       // 允许自由缩放窗口
    skipTaskbar: false,    // 显示任务栏按钮，最小化后能从任务栏恢复
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  win.on('moved', saveBounds);
  win.on('resize', saveBounds);   // 缩放后记住新尺寸

  // 点关闭：先记位置，再藏到托盘（而不是退出）
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
    { label: '显示 / 隐藏', click: () => { win.isVisible() ? win.hide() : win.show(); } },
    { type: 'separator' },
    { label: '退出', click: () => { isQuiting = true; app.quit(); } },
  ]);
  tray.setToolTip('今日计划');
  tray.setContextMenu(menu);
  tray.on('double-click', () => win.show());
}

// 界面发来的窗口控制
ipcMain.on('win:minimize', () => { if (win) win.minimize(); });
ipcMain.on('win:close', () => { if (win) win.hide(); });

app.whenReady().then(() => {
  app.setAppUserModelId('com.desktop.planner'); // 让 Windows 通知正确显示应用名
  createWindow();
  createTray();
});

// 常驻托盘：所有窗口关闭也不退出
app.on('window-all-closed', () => {});
