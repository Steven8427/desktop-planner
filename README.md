# desktop-planner

一个用 [Electron](https://www.electronjs.org/) 写的桌面「今日计划」应用：简洁现代的多页面结构，常驻系统托盘。主界面只显示今天的任务，添加 / 编辑 / 删除等操作分到独立页面。

## 页面
- **今日计划**：卡片式显示当天任务，点圆圈即可完成；右下角 ＋ 添加任务
- **添加任务**：任务名称、日期、开始/结束时间、是否重复、备注
- **任务管理**：编辑、删除所有任务
- **任务日志**：记录每次创建 / 完成 / 修改 / 删除，含完整日期时间

## 功能
- 📝 任务数据存在本地 localStorage
- ⏰ 任务到「开始时间」弹 Windows 通知
- 🔁 重复任务（每天 / 每周），跨天自动重置
- 🪟 自定义最小化 / 关闭按钮，关闭缩到托盘
- 🖱️ 系统托盘常驻，记住窗口位置

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
