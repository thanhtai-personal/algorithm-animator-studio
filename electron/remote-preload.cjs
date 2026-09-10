const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("kaiRemote", {
  getPreferences: () => ipcRenderer.invoke("kai-remote:get-preferences"),
  setLaunchAtLogin: (enabled) => ipcRenderer.invoke("kai-remote:set-launch-at-login", Boolean(enabled)),
});
