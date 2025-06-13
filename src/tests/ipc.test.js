jest.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: jest.fn(),
  },
  BrowserWindow: {},
  dialog: {},
}));

global.window = {
  addEventListener: jest.fn(),
};

// Use jest.doMock for electron and fs
let mockWindow, mockDialog, mockFS;

global.window = {
  addEventListener: jest.fn(),
};

let handleSaveTextDialog, handleLoadTextDialog, electronAPI;


describe('IPC Save/Load Handlers', () => {
  let mockWindow;
  let mockDialog;
  let mockFS;

  beforeEach(() => {
    jest.resetModules();
    mockWindow = {};
    mockDialog = {
      showSaveDialog: jest.fn(() => Promise.resolve({ canceled: false, filePath: '/tmp/test.txt' })),
      showOpenDialog: jest.fn(() => Promise.resolve({ canceled: false, filePaths: ['/tmp/test.txt'] }))
    };
    mockFS = {
      writeFile: jest.fn(() => Promise.resolve()),
      readFile: jest.fn(() => Promise.resolve('file content'))
    };
    jest.doMock('electron', () => ({
      contextBridge: {
        exposeInMainWorld: jest.fn(),
      },
      BrowserWindow: {
        getFocusedWindow: () => mockWindow
      },
      dialog: mockDialog,
    }));
    jest.doMock('fs', () => ({
      promises: mockFS
    }));
    // Now require handlers (after mocks)
    ({ handleSaveTextDialog, handleLoadTextDialog } = require('../main'));
    electronAPI = require('../preload').electronAPI;
  });

  afterEach(() => {
    jest.resetModules(); // Clean up module cache for isolation
    jest.restoreAllMocks();
  });

  test('handleSaveTextDialog returns success on save', async () => {
    const result = await handleSaveTextDialog({}, 'test content');
    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/tmp/test.txt');
    expect(mockDialog.showSaveDialog).toHaveBeenCalled();
    expect(mockFS.writeFile).toHaveBeenCalledWith('/tmp/test.txt', 'test content');
  });

  test('handleLoadTextDialog returns file content', async () => {
    const result = await handleLoadTextDialog({});
    expect(result.success).toBe(true);
    expect(result.filePath).toBe('/tmp/test.txt');
    expect(result.content).toBe('file content');
    expect(mockDialog.showOpenDialog).toHaveBeenCalled();
    expect(mockFS.readFile).toHaveBeenCalledWith('/tmp/test.txt', 'utf8');
  });
});

describe('Preload electronAPI', () => {
  test('should expose saveText and loadText', () => {
    expect(typeof electronAPI.saveText).toBe('function');
    expect(typeof electronAPI.loadText).toBe('function');
  });
});
