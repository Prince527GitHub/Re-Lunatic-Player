const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) app.quit();

const offset = process.platform !== "linux" ? { width: 16, height: 35 } : { width: 0, height: 0 };

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: "Re:Lunatic Player",
    icon: path.join(__dirname, "img/logo.png"),
    width: 361 + offset.width,
    height: 238 + offset.height,
    autoHideMenuBar: true,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, "js/preload.js"),
    }
  });

  mainWindow.isMain = true;

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.once("close", () => app.quit());
};

// Set the AppUserModelId for Windows
app.setAppUserModelId("com.squirrel.ReLunaticPlayer.ReLunaticPlayer");

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

const database = new (require("./js/database"))(path.join(app.getPath("userData"), "database.json"));
const { Client } = require("@xhayper/discord-rpc");
const pkg = require("../package.json");

app.on("ready", () => {
  // Database
  ipcMain.on("set-db", (event, key, value) => database.set(key, value));
  ipcMain.handle("has-db", (event, key) => database.has(key));
  ipcMain.handle("get-db", (event, key) => database.get(key));
  ipcMain.on("push-db", (event, key, value) => database.push(key, value));
  ipcMain.on("pull-db", (event, key, value) => database.pull(key, value));
  ipcMain.on("slice-db", (event, key, start, end) => database.slice(key, start, end));
  ipcMain.handle("find-db", (event, key, value) => database.find(key, value));
  ipcMain.on("delete-db", (event, key) => database.delete(key));
  ipcMain.handle("all-db", (event) => database.all());

  // Version
  ipcMain.handle("version", (event) => pkg.version);

  // Window
  ipcMain.on("open-window", (event, settings) => {
    const webContents = event.sender;

    const win = BrowserWindow.fromWebContents(webContents);

    const alreadyOpen = BrowserWindow.getAllWindows().find(win => win.getTitle() === settings.title);
    if (alreadyOpen) return alreadyOpen.focus();

    const [x, y] = win.getPosition();

    const window = new BrowserWindow({
      title: settings.title || "Re:Lunatic Player",
      icon: path.join(__dirname, "img/logo.png"),
      width: (settings.width || 361) + offset.width,
      height: (settings.height || 238) + offset.height,
      autoHideMenuBar: true,
      resizable: false,
      fullscreenable: false,
      maximizable: false,
      x: x + 24,
      y: y + 24,
      webPreferences: {
        preload: path.join(__dirname, "js/preload.js"),
      }
    });

    window.isMain = false;

    window.loadFile(path.join(__dirname, settings.file));

    window.once("ready-to-show", () => settings.data ? window.webContents.send("message-window", settings.data) : null);
  });

  ipcMain.on("close-window", (event) => {
    const webContents = event.sender;

    const win = BrowserWindow.fromWebContents(webContents);

    win.close();
  });

  ipcMain.on("set-title", (event, title) => {
    const webContents = event.sender;

    const win = BrowserWindow.fromWebContents(webContents);

    win.setTitle(title);
  });

  ipcMain.on("set-progress", (event, progress) => {
    const webContents = event.sender;

    const win = BrowserWindow.fromWebContents(webContents);

    win.setProgressBar(progress);
  });

  ipcMain.on("message-window", (event, settings) => {
    const window = BrowserWindow.getAllWindows().find(win => settings.title ? win.getTitle() === settings.title : settings.main ? win.isMain === true : false);
    if (!window) return;

    window.webContents.send("message-window", settings.message);
  });

  // Browser
  ipcMain.on("open-link", (event, link) => shell.openExternal(link));

  // Discord RPC
  const client = new Client({ clientId: "1253772057926303804" });

  function setActivity(song) {
    if (!client.user) return;

    client.user.setActivity({
      details: song.SONGINFO.TITLE,
      state: song.SONGINFO.ARTIST,
      startTimestamp: new Date(song.SONGTIMES.SONGSTART * 1000),
      endTimestamp: new Date(song.SONGTIMES.SONGEND * 1000),
      largeImageKey: song.MISC.ALBUMART ? `https://gensokyoradio.net/images/albums/500/${song.MISC.ALBUMART}` : "undefined",
      largeImageText: song.SONGINFO.ALBUM,
      smallImageKey: "logo",
      smallImageText: "Gensokyo Radio",
      type: 2
    });
  }

  ipcMain.on("set-activity", (event, song) => {
    try {
      setActivity(song);
    } catch (error) {
      setTimeout(() => setActivity(song), 15000);
    }
  });

  ipcMain.on("clear-activity", (event, song) => {
    if (!client.user) return;

    client.user.clearActivity();
  });

  client.login();
});