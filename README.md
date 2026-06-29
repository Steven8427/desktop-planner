# desktop-planner

一个用 [Electron](https://www.electronjs.org/) 写的桌面「今日计划」小组件：透明置顶悬浮窗，支持添加 / 完成 / 删除计划、单条定时提醒、每日汇总提醒，并常驻系统托盘。

## 功能
- 📝 添加 / 完成 / 删除每日计划（数据存在本地 localStorage）
- ⏰ 给单条计划设提醒时间，到点弹 Windows 通知
- 📋 每日固定时间汇总提醒今天还没完成的计划
- 🖱️ 系统托盘常驻，点关闭是缩到托盘而不是退出
- 🪟 无边框、半透明、置顶，可拖动

## 运行
```bash
npm install
npm start
```

## 项目结构
```
desktop-planner/
├── assets/icon.png        # 托盘图标
└── src/
    ├── main/main.js       # 主进程：窗口 + 托盘
    ├── preload/preload.js # 预加载桥梁
    └── renderer/          # 界面（渲染进程）
        ├── index.html
        ├── store.js       # 数据层
        ├── reminders.js   # 提醒层
        ├── app.js         # 界面层
        └── styles.css
```

## 后续计划
- [ ] 用 electron-store 替代 localStorage，持久化更可靠
- [ ] 用 electron-builder 打包成 .exe
- [ ] 开机自启动
