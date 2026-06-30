// 预加载脚本：安全地把"窗口控制"接口暴露给界面。
// 因为 contextIsolation 开着，界面不能直接操作窗口，必须通过这里转发给主进程。
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowApi', {
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
});
