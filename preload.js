const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('clipboardApi', {
  writeTextToClipboard: (text) => ipcRenderer.invoke('clipboard:writeText', text),
  readTextFromClipboard: () => ipcRenderer.invoke('clipboard:readText'),
  readTextFromRemote: () => ipcRenderer.invoke('clipboard:pullRemoteText')
});