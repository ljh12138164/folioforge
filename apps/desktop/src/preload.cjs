const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopTheme', {
  setPreference: (value) => {
    if (['system', 'light', 'dark'].includes(value)) ipcRenderer.send('theme:set', value);
  },
});
