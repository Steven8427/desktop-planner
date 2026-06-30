# Tickly

A clean, modern desktop daily-task app built with [Electron](https://www.electronjs.org/). It lives in the system tray and the main screen shows only today's tasks, while adding, editing and deleting live on their own pages.

## Pages
- **Today** — card-style list of today's tasks; tap the circle to complete; ＋ button to add
- **Add Task** — task name, date, start/end time, repeat, check-in tracking, notes
- **Manage** — edit, delete, or add a task to the system calendar
- **Activity Log** — every create / complete / edit / delete / check-in with full date & time

## Features
- 📝 Tasks stored locally in localStorage
- ⏰ Notification when a task is due (with a configurable "remind before" lead time)
- 🔁 Repeating tasks (daily / weekly), auto-reset each period
- 🔥 Check-in streak tracking (one per day, deduped by date)
- 📅 Add a task to the system calendar via a standard `.ics` file
- 🌐 Multilingual UI: English / 中文 / Français
- 🎨 Settings: notification toggle, opacity, background color (text auto-inverts for readability)
- 🪟 Custom minimize / close buttons, resizable window
- 🖱️ Tray resident, remembers window position and size

## Run
```bash
npm install
npm start
```

## Project structure
```
desktop-planner/
├── assets/icon.png        # app & tray icon
└── src/
    ├── main/main.js       # main process: window, tray, calendar export
    ├── preload/preload.js # context bridge
    └── renderer/          # UI (renderer process)
        ├── index.html
        ├── store.js       # data layer
        ├── i18n.js        # translations
        ├── reminders.js   # reminder layer
        ├── app.js         # UI layer
        └── styles.css
```

## Roadmap
- [ ] Replace localStorage with electron-store for more reliable persistence
- [ ] Package as an .exe with electron-builder
- [ ] Launch on system startup
