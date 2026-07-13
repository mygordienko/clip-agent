const { shell, nativeImage } = require('electron/common')
const { app, dialog, Menu, MenuItem, BrowserWindow, ipcMain, nativeTheme, clipboard, Notification, Tray } = require('electron/main')
const path = require('node:path')
const { ClipboardServer, ClipboardClient } = require('./clipboard-integration.js')
const configurationService = require('./configuration-service.js')

/* This variable is needed for the window-less (tray-only) mode to be implemented later */
let clipboardText = "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum."

let tray = null
let mainWindow = null

const configuration = configurationService.getConfig()
const clipboardServer = new ClipboardServer(configuration.clipboardServerPort, () => refreshClipboardFromMain());
const clipboardClient = new ClipboardClient(configuration.remoteBaseUrl);

const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        click: () => {
          if (configuration.enableClipboardServer) {
            clipboardServer.close()
          }
          app.quit()
        }
      }
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
  mainWindow = new BrowserWindow({
    width: 800,
    height: 500,
    icon: path.join(__dirname, 'images', 'icon.png'),
    resizable: true,
    webPreferences: {
    	preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadFile('index.html')
}

// Reusable clipboard functions
const writeTextToClipboard = (text) => {
  clipboardText = text
  clipboard.writeText(clipboardText)
}

const readTextFromClipboard = () => {
  clipboardText = clipboard.readText()
  return clipboardText
}

const pullRemoteText = async () => {
  try {
    clipboardText = await clipboardClient.fetchRemoteClipboard()
    clipboardText = clipboardText ? clipboardText : ''
    clipboard.writeText(clipboardText)
  } catch(error) {
    // Do not update local cache, show notification
    console.error(`Error pulling remote: ${error.message}`)
    
    // Show notification to user
    const notification = new Notification({
      title: 'Clipboard Pull Failed',
      body: `Failed to pull clipboard from remote: ${error.message}`
    });
    
    notification.show();
  }
  
  return clipboardText
}

const clearClipboard = () => {
  writeTextToClipboard('')
}

const showWindow = () => {
  if (mainWindow === null) {
    createWindow()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

// Handle clipboard write text requests from UI
ipcMain.handle('clipboard:writeText', (event, text) => {
  writeTextToClipboard(text)
});

// Handle clipboard read text requests from UI
ipcMain.handle('clipboard:readText', (event) => {
  return readTextFromClipboard()
});

// Handle clipboard pull remote text requests from UI
ipcMain.handle('clipboard:pullRemoteText', async (event) => {
  return await pullRemoteText()
});

// When requested from outside (via server)
const refreshClipboardFromMain = () => {
  clipboardText = clipboard.readText()
  return clipboardText
}

const createTray = () => {
  tray = new Tray(path.join(__dirname, 'images', 'tray.png'))
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Pull Remote',
      click: async () => await pullRemoteText()
    },
    {
      label: 'Refresh',
      click: () => readTextFromClipboard()
    },
    {
      label: 'Clear',
      click: () => clearClipboard()
    },
    { type: 'separator' },
    {
      label: 'Show Window',
      click: () => showWindow()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        if (configuration.enableClipboardServer) {
          clipboardServer.close()
        }
        app.quit()
      }
    }
  ])
  
  tray.setContextMenu(contextMenu)
  tray.setToolTip('Clip Agent - Clipboard Sync Tool')
}

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
  createTray()

  if (configuration.enableClipboardServer) {
    clipboardServer.start()
  }

  app.on('activate', () => {
    // Show window when dock icon is clicked on macOS
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
    mainWindow = null
})
