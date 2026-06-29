const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');

let win;
let tray;
let isQuiting = false;   // 标记是否真的要退出（区分"点关闭"和"菜单退出"）

function createWindow() {
  win = new BrowserWindow({
    width: 320,
    height: 540,
    frame: false,          // 无边框
    transparent: true,     // 透明背景
    alwaysOnTop: true,     // 永远置顶
    resizable: false,
    skipTaskbar: true,     // 不在任务栏显示
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));

  // 点窗口的关闭：不真的关，而是藏到托盘
  win.on('close', (e) => {
    if (!isQuiting) {
      e.preventDefault();
      win.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, '../../assets/icon.png'));
  const menu = Menu.buildFromTemplate([
    {
      label: '显示 / 隐藏',
      click: () => { win.isVisible() ? win.hide() : win.show(); },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => { isQuiting = true; app.quit(); },
    },
  ]);
  tray.setToolTip('今日计划');
  tray.setContextMenu(menu);
  tray.on('double-click', () => win.show());
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.desktop.planner'); // 让 Windows 通知正确显示应用名
  createWindow();
  createTray();
});

// 常驻托盘：所有窗口关闭也不退出
app.on('window-all-closed', () => {});
