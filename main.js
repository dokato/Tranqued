const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Using promises version for async/await

if (typeof app === 'undefined' || typeof BrowserWindow === 'undefined') {
  console.error('Failed to load Electron modules (app or BrowserWindow is undefined).');
  console.error(`Type of app: ${typeof app}, Type of BrowserWindow: ${typeof BrowserWindow}`);
  // Attempt to log what require('electron') actually returns
  try {
    const electronActual = require('electron');
    console.error('require("electron") returned:', JSON.stringify(electronActual, null, 2));
  } catch (e) {
    console.error('Error trying to log require("electron") directly:', e);
  }
  if (process && typeof process.exit === 'function') {
    process.exit(1);
  }
} else {
  console.log('Electron modules (app, BrowserWindow) loaded successfully.');
  let mainWindow; // Declare mainWindow at a higher scope

  // IPC handler for saving text content
  ipcMain.handle('save-text-dialog', async (event, textContent) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      return { error: 'No focused window found.' };
    }

    try {
      const { canceled, filePath } = await dialog.showSaveDialog(window, {
        title: 'Save Your Notes',
        defaultPath: `focus-notes-${Date.now()}.txt`,
        buttonLabel: 'Save Notes',
        filters: [
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (canceled) {
        return { canceled: true };
      }

      if (filePath) {
        await fs.writeFile(filePath, textContent);
        return { success: true, filePath };
      }
    } catch (err) {
      console.error('Failed to save file:', err);
      return { error: err.message || 'An unknown error occurred during saving.' };
    }
    return { error: 'Save operation did not complete as expected.' }; // Fallback
  });

  // IPC handler for loading text content
  ipcMain.handle('load-text-dialog', async (event) => {
    const window = BrowserWindow.getFocusedWindow();
    if (!window) {
      return { error: 'No focused window found.' };
    }

    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(window, {
        title: 'Load File into Editor',
        buttonLabel: 'Load File',
        filters: [
          { name: 'Text Documents', extensions: ['txt', 'md'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (canceled || !filePaths || filePaths.length === 0) {
        return { canceled: true };
      }

      const filePath = filePaths[0];
      const content = await fs.readFile(filePath, 'utf8');
      return { success: true, filePath, content };

    } catch (err) {
      console.error('Failed to load file:', err);
      return { error: err.message || 'An unknown error occurred during loading.' };
    }
  });

  function createWindow () {
    // Assign to the higher-scoped mainWindow
    mainWindow = new BrowserWindow({
      width: 800,
      height: 600,
      fullscreen: true, // Retaining this change as per original request
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, // Default and recommended
        contextIsolation: true // Default and recommended
      }
    });
    mainWindow.loadFile('index.html');
  }

  app.whenReady().then(() => {
    createWindow();
    globalShortcut.register('Escape', () => {
      console.log('Escape key pressed, attempting to save before quit.');
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('request-editor-content');
      } else {
        // Fallback if window not available, though unlikely in normal flow
        app.quit();
      }
    });

    // Listen for editor content from renderer process
    ipcMain.on('editor-content-response', async (event, textContent) => {
      if (!mainWindow) {
        app.quit(); // Should not happen if Escape was pressed with an open window
        return;
      }
      try {
        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
          title: 'Save Your Work Before Quitting',
          defaultPath: `focus-notes-${Date.now()}.txt`,
          buttonLabel: 'Save and Quit',
          filters: [
            { name: 'Text Files', extensions: ['txt'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (filePath && !canceled) {
          await fs.writeFile(filePath, textContent);
          console.log('File saved before quitting.');
        } else if (canceled) {
          console.log('Save canceled by user before quitting.');
        }
      } catch (err) {
        console.error('Failed to save file before quitting:', err);
        // Optionally, show an error dialog to the user here
        // For now, we'll proceed to quit even if saving fails after the attempt.
      } finally {
        app.quit(); // Quit after save attempt (success, cancel, or error)
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  }).catch(err => {
    console.error('Error during app.whenReady:', err);
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('will-quit', () => {
    // Unregister all shortcuts.
    globalShortcut.unregisterAll();
    console.log('Unregistered all global shortcuts.');
  });
}
