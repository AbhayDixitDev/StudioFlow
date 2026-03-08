const { app, Menu, BrowserWindow, shell } = require('electron');

function createMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { dialog } = require('electron');
            const win = BrowserWindow.getFocusedWindow();
            const result = await dialog.showOpenDialog(win, {
              filters: [
                { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'] },
                { name: 'Video Files', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] },
                { name: 'All Files', extensions: ['*'] },
              ],
            });
            if (!result.canceled && result.filePaths.length > 0) {
              win.webContents.send('file-opened', result.filePaths[0]);
            }
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Help menu
    {
      label: 'Help',
      submenu: [
        {
          label: 'About StudioFlow',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox({
              type: 'info',
              title: 'About StudioFlow',
              message: `StudioFlow v${app.getVersion()}`,
              detail: 'Powerful audio and video tools, all in one place.',
            });
          },
        },
        { type: 'separator' },
        {
          label: 'Learn More',
          click: () => shell.openExternal('https://github.com'),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { createMenu };
