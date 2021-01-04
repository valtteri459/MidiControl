'use strict'
import './prototypes'
import { app, protocol, BrowserWindow } from 'electron'
import appConfig from 'electron-settings'
appConfig.configure({atomicSave: false})
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import midi from './process_components/midi'
import macroengine from './process_components/macroengine'
console.log('config file location', appConfig.file())
midi.register()
macroengine.init()
function windowStateKeeper(windowName) {
  let window, windowState;
  function setBounds() {
    // Restore from appConfig
    if (appConfig.hasSync(`windowState.${windowName}`)) {
      windowState = appConfig.getSync(`windowState.${windowName}`);
      return windowState;
    }
    // Default
    windowState = {
      x: undefined,
      y: undefined,
      width: 1000,
      height: 800,
    };
    return windowState
  }
  let lastSave = process.hrtime()
  function inMs (hrtime) {
    return (hrtime[0]* 1000000000 + hrtime[1]) / 1000000; // convert first to ns then to ms
  }
  function saveState() {
    if (inMs(process.hrtime(lastSave)) > 200 )
    iSaveState()
    lastSave = process.hrtime()
  }
  function iSaveState() {
    //console.log('saving resized window')
    if (!windowState.isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = window.isMaximized();
    try {
      appConfig.set(`windowState.${windowName}`, windowState);
    } catch (e) {
      console.log('saving failed', e)
    }
  }
  function track(win) {
    window = win;
    ['resize', 'move'].forEach(event => {
      win.on(event, saveState);
    });
  }
  setBounds()
  return({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized,
    track,
  });
}

// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const mainStateKeeper = windowStateKeeper('main')
  const win = new BrowserWindow({
    x: mainStateKeeper.x,
    y: mainStateKeeper.y,
    width: mainStateKeeper.width,
    height: mainStateKeeper.height,
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      allowRendererProcessReuse: false,
      enableRemoteModule: true
    }
  })
  mainStateKeeper.track(win)
  midi.registerWindow(win)
  macroengine.registerWindow(win)
  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron  6/7/<8.25 on Windows
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment the following lines (and the import at the top of the file)
    // In addition, if you upgrade to Electron ^8.2.5 or ^9.0.0 then devtools should work fine

    // try {
    //   await installExtension(VUEJS_DEVTOOLS)
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}
