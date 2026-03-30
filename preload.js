const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  isDev: process.env.NODE_ENV === 'development',
});
