// 预加载脚本：运行在"渲染进程"和"主进程"之间的安全桥梁。
// 现在界面用的都是浏览器自带能力（localStorage、Notification），暂时不需要桥接。
// 以后如果界面要调用系统级功能（比如读写本地文件、开机自启），
// 就在这里用 contextBridge.exposeInMainWorld(...) 把安全的接口暴露给界面。
