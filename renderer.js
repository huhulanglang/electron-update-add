const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdateVersion: (message) => ipcRenderer.send('checkForUpdateVersion', message),
    onPrintError: (callback) => ipcRenderer.on('print-error', callback),
    isElectron:true,
    onUpdateCounter: (callback) => ipcRenderer.on('update-counter', callback),
    ipcRenderer:{
        ...ipcRenderer,
        on: ipcRenderer.on.bind(ipcRenderer),
        removeListener: ipcRenderer.removeListener.bind(ipcRenderer),
    }
});