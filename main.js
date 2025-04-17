const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { log, logPath, cleanUpLogs } = require("./logger");
const fs = require('fs');
const ElectronAutoUpdater = require("@huhulanglang/electron-auto-updater-enhanced");
let mainWindow;
let windowConfig = { // 窗口配置程序运行窗口的大小
  maximizable: true, //支持最大化
  show: false, //为了让初始化窗口显示无闪烁，先关闭显示，等待加载完成后再显示。
  webPreferences: {
    nodeIntegration: false,
    webviewTag: false,
    contextIsolation: true,
    preload: path.join(__dirname, './renderer.js') // 但预加载的 js 文件内仍可以使用 Nodejs 的 API
  }
}
function createWindow () {
  mainWindow = new BrowserWindow(windowConfig)
  mainWindow.maximize();
  mainWindow.show();
  mainWindow.loadFile('./dist/index.html') // 项目里build出的静态资源包地址为dist，
  mainWindow.webContents.openDevTools() // electron窗口打开调试工具
  mainWindow.on('resize', () => {
    mainWindow.reload()
  })

  //与子页面建立通信
  ipcMain.on('close', e =>{
    mainWindow.close();
  } );
  // 关闭window时触发下列事件.
  mainWindow.on('closed', function () {
    mainWindow = null;
  })

  updateManager = new ElectronAutoUpdater({
    mainWindow: mainWindow, // 传递主窗口对象给更新管理器
    logPath: logPath
  });
  updateManager.emitter.on('auto-update-log', (data) => {
    console.log(data);
    log[data.type](data.message);
      // 处理事件
  });
  setupErrorHandling()
}

app.on('ready', () => {
  log.info('app start');
  createWindow()
  const { Menu } = require('electron')
  Menu.setApplicationMenu(null) // window下 隐藏菜单栏
  // runExec()
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
  console.log(this, 'main')
})

function setupErrorHandling() {
  process.on("uncaughtException", (error) => {
    log.error(error.stack || JSON.stringify(error));
  });
}

ipcMain.on("quitApp", () => {
  if (process.platform !== "darwin") {
    if (
      updateManager &&
      !updateManager.updateInProgress &&
      updateManager.isSilent &&
      updateManager.silentZipPath
    ) {
      updateManager.updateInProgress = true;
      updateManager
        .updateDownloadFile(updateManager.silentZipPath)
        .then(() => {
          log.info("app quit");
          // app.quit();
        })
        .catch((err) => {
          log.error("Failed to update:", err);
          // app.quit();
        });
    } else {
      // app.quit();
    }
  }
});


ipcMain.once("checkForUpdateVersion", (e, arg) => {
  updateManager.checkForUpdateVersion('http://pc.jijile.net/');
});

ipcMain.on("checkForUpdate", () => {
  updateManager.checkForUpdates();
});

ipcMain.on("backVersion", () => {
  updateManager.reduction(
    path.join(process.resourcesPath, "./app.asar.unpacked")
  );
});
//给渲染进程发送消息
function sendUpdateMessage(text) {
  mainWindow.webContents.send('message', text)
}