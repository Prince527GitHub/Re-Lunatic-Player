// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("electron", {
    setTitle: (title) => ipcRenderer.send("set-title", title),
    openLink: (link) => ipcRenderer.send("open-link", link),
    activity: {
        set: (song) => ipcRenderer.send("set-activity", song),
        clear: () => ipcRenderer.send("clear-activity"),
    },
    window: {
        open: (settings) => ipcRenderer.send("open-window", settings),
        close: () => ipcRenderer.send("close-window"),
    },
    database: {
        set: (key, value) => ipcRenderer.send("set-db", key, value),
        has: (key) => ipcRenderer.invoke("has-db", key),
        get: (key) => ipcRenderer.invoke("get-db", key),
        push: (key, value) => ipcRenderer.send("push-db", key, value),
        pull: (key, value) => ipcRenderer.send("pull-db", key, value),
        slice: (key, start, end) => ipcRenderer.send("slice-db", key, start, end),
        find: (key, value) => ipcRenderer.invoke("find-db", key, value),
        delete: (key) => ipcRenderer.send("delete-db", key),
        all: () => ipcRenderer.invoke("all-db")
    },
    message: {
        send: (settings) => ipcRenderer.send("message-window", settings),
        receive: (callback) => ipcRenderer.on("message-window", (event, ...args) => callback(...args))
    }
});