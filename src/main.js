const { app, BrowserWindow, globalShortcut, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises; // Using promises version for async/await

// --- Handlers always defined and exported ---
async function handleSaveTextDialog(event, textContent) {
  const window = BrowserWindow && BrowserWindow.getFocusedWindow ? BrowserWindow.getFocusedWindow() : undefined;
  if (!window) {
    return { error: 'No focused window found.' };
  }
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(window, {
      title: 'Save Notes - TranqEd',
      defaultPath: `tranqed-notes-${Date.now()}.txt`,
      buttonLabel: 'Save',
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
}

async function handleLoadTextDialog(event) {
  const window = BrowserWindow && BrowserWindow.getFocusedWindow ? BrowserWindow.getFocusedWindow() : undefined;
  if (!window) {
    return { error: 'No focused window found.' };
  }
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(window, {
      title: 'Load File - TranqEd',
      buttonLabel: 'Load',
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
}

// Export for tests (always)
if (typeof module !== 'undefined' && module.exports) {
  module.exports.handleSaveTextDialog = handleSaveTextDialog;
  module.exports.handleLoadTextDialog = handleLoadTextDialog;
}

// --- Only run Electron app logic if Electron is present ---
if (typeof app !== 'undefined' && typeof BrowserWindow !== 'undefined') {
  console.log('Electron modules (app, BrowserWindow) loaded successfully.');
  let mainWindow; // Declare mainWindow at a higher scope

  ipcMain.handle('save-text-dialog', handleSaveTextDialog);
  ipcMain.handle('load-text-dialog', handleLoadTextDialog);

  function createWindow () {
    // Assign to the higher-scoped mainWindow
    mainWindow = new BrowserWindow({
      show: false, // Don't show the window until content is ready (prevents white flash)
      icon: path.join(__dirname, 'assets/images/icon.png'),
      width: 800,
      height: 600,
      fullscreen: true, // Retaining this change as per original request
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false, // Default and recommended
        contextIsolation: true // Default and recommended
      }
    });
    mainWindow.loadFile('intro.html');

    mainWindow.once('ready-to-show', () => {
      if (mainWindow) mainWindow.show();
    });

    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile('index.html');
      }
    }, 2500);

    // Handle window being closed during splash screen
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
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
          title: 'Save Work Before Quitting - TranqEd',
          defaultPath: `tranqed-notes-${Date.now()}.txt`,
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
    globalShortcut.unregisterAll();
  });
}
