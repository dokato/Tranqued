const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveText: (textContent) => ipcRenderer.invoke('save-text-dialog', textContent),
  loadText: () => ipcRenderer.invoke('load-text-dialog'),
  onEditorContentRequest: (callback) => ipcRenderer.on('request-editor-content', (event, ...args) => callback(...args)),
  sendEditorContentResponse: (content) => ipcRenderer.send('editor-content-response', content)
});

window.addEventListener('DOMContentLoaded', () => {
  // You can still add other DOMContentLoaded specific preload logic here if needed
});
