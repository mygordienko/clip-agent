const { shell, nativeImage } = require('electron/common')
const { app, dialog, Menu, MenuItem, BrowserWindow, ipcMain, nativeTheme, clipboard } = require('electron/main')
const path = require('node:path')

const template = [
  {
    label: 'File',
    submenu: [
      { role: 'quit' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' }
    ]
  },
  {
    role: 'Help',
    submenu: [
      {
        label: 'About',
        role: 'about'
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 500,
    icon: path.join(__dirname, 'images', 'icon.png'),
    resizable: true,
    webPreferences: {
    	preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('index.html')
}

// Handle clipboard write text requests
ipcMain.handle('clipboard:writeText', (event, text) => {
  clipboard.writeText(text);
});

// Handle clipboard read text requests
ipcMain.handle('clipboard:readText', (event) => {
  return clipboard.readText();
});

nativeTheme.themeSource = 'system'

app.whenReady().then(() => {
  console.log('App is ready')

  app.setAboutPanelOptions({
    applicationName: 'Clip Agent',
    applicationVersion: `${app.getVersion()}`,
    authors: ['Mikhail Gordienko'],
    website: 'https://github.com/mygordienko/clip-agent',
    iconPath: path.join(__dirname, 'images/icon.png')
  });

  createWindow()

  app.on('activate', () => {
    // TODO: tray mode
  })
})

app.on('window-all-closed', () => {
  // TODO: tray mode
  app.quit()
})