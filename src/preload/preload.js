// Preload script: safely expose "window controls + add to calendar" to the UI.
// With contextIsolation on, the UI cannot touch the window/system directly,
// so everything is forwarded to the main process through here.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowApi', {
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  addToCalendar: (task) => ipcRenderer.invoke('calendar:add', task),
});
