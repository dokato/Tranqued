const { contextBridge, ipcRenderer } = require('electron');

const electronAPI = {
  saveText: (textContent) => ipcRenderer.invoke('save-text-dialog', textContent),
  loadText: () => ipcRenderer.invoke('load-text-dialog'),
  onEditorContentRequest: (callback) => ipcRenderer.on('request-editor-content', (event, ...args) => callback(...args)),
  sendEditorContentResponse: (content) => ipcRenderer.send('editor-content-response', content)
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

window.addEventListener('DOMContentLoaded', () => {
  // You can still add other DOMContentLoaded specific preload logic here if needed
});

// For testing (Node environment):
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { electronAPI };
}
