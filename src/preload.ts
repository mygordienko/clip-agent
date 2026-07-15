import { contextBridge, ipcRenderer } from 'electron';

const clipboardApi = {
  writeTextToClipboard: (text: string) => ipcRenderer.invoke('clipboard:writeText', text),
  readTextFromClipboard: () => ipcRenderer.invoke('clipboard:readText'),
  readTextFromRemote: () => ipcRenderer.invoke('clipboard:pullRemoteText')
};

type ClipboardAPI = typeof clipboardApi;

contextBridge.exposeInMainWorld('clipboardApi', clipboardApi);

declare global {
  interface Window {
    // This maps the 'clipboardApi' key used in exposeInMainWorld to your type definition
    clipboardApi: ClipboardAPI;
  }
}