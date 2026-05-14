import path from 'path';
import moduleAliases from 'module-alias';
import url from 'url';

moduleAliases.addAliases({
    '@util': path.join(__dirname, 'util'),
    '@common': path.join(__dirname, 'packages'),
    '@shared': path.join(__dirname, '../common'),
});

import { app, BrowserWindow, BrowserWindowConstructorOptions, ipcMain, screen } from 'electron';

import { devServerUrl, isDev } from './config';
import { appConfig } from './ElectronStore/Configuration';
import output from './util/output';
import { handleErrorMessage, registerMainWindow, sendFeLog, sendRendererMessage } from './util/ipc';
import { addListenersToIpc } from './ipcListeners';

async function createWindow() {
    addListenersToIpc(ipcMain);

    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const appBounds: any = appConfig.get('setting.appBounds');
    const preload = path.join(__dirname, '/preload.js');
    const BrowserWindowOptions: BrowserWindowConstructorOptions = {
        width: 1200,
        minWidth: 900,
        height: 750,
        minHeight: 600,

        webPreferences: {
            preload,
            devTools: isDev,
        },
        show: false,
        alwaysOnTop: true,
        frame: true,
    };

    output.log(`Creating window w/ preload ${preload}`);

    if (appBounds !== undefined && appBounds !== null) Object.assign(BrowserWindowOptions, appBounds);
    const mainWindow = new BrowserWindow(BrowserWindowOptions);

    if (isDev) await mainWindow.loadURL(devServerUrl);
    else await mainWindow.loadFile(path.join(__dirname, 'index.html'));

    if (appBounds !== undefined && appBounds !== null && appBounds.width > width && appBounds.height > height)
        mainWindow.maximize();
    else mainWindow.show();

    // this will turn off always on top after opening the application
    setTimeout(() => {
        mainWindow.setAlwaysOnTop(false);
    }, 1000);

    // Open the DevTools.
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    registerMainWindow(mainWindow);

    sendFeLog('Initiated');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
    // if dev
    if (isDev) {
        try {
            const { installExt } = await import('./installDevTool');
            await installExt();
        } catch (e) {
            output.error('Can not install extension!');
        }
    }

    createWindow();

    app.on('activate', function () {
        output.log('Window activated and ready');

        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    output.log('All windows closed');
    app.quit();
});

process.on('uncaughtException', (error) => {
    console.error('Unhandled Exception:', error);
    handleErrorMessage(error.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    handleErrorMessage(String(reason));
});

// ['SIGTERM', 'SIGINT', 'exit'].forEach((signal) =>
//     process.on(signal, async () => {
//         process.exit();
//     }),
// );
