'use strict';
const path = require('path');
const fs = require('fs');
const electron = require('electron');
// -const electronLocalShortcut = require('electron-localshortcut');
const log = require('electron-log');
const {
	autoUpdater
} = require('electron-updater');
const isDev = require('electron-is-dev');
const appMenu = require('./menu');
const config = require('./config');
const tray = require('./tray');

require('electron-debug')({
	enabled: true
});
require('electron-dl')();
require('electron-context-menu')();

const {
	app,
	ipcMain
} = electron;

app.setAppUserModelId('com.patricksletvold.its');
app.disableHardwareAcceleration();

if (!isDev) {
	autoUpdater.logger = log;
	autoUpdater.logger.transports.file.level = 'info';
	autoUpdater.checkForUpdates();
}

let mainWindow;
let isQuitting = false;
let prevMessageCount = 0;
let dockMenu;

const isAlreadyRunning = app.makeSingleInstance(() => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

if (isAlreadyRunning) {
	app.quit();
}

function updateBadge(messageCount) {
	if (process.platform === 'darwin' || process.platform === 'linux') {
		if (config.get('showUnreadBadge')) {
			app.setBadgeCount(messageCount);
		}
		if (process.platform === 'darwin' && config.get('bounceDockOnMessage') && prevMessageCount !== messageCount) {
			app.dock.bounce('informational');
			prevMessageCount = messageCount;
		}
	}

	if ((process.platform === 'linux' || process.platform === 'win32') && config.get('showUnreadBadge')) {
		tray.setBadge(messageCount);
	}

	if (process.platform === 'win32') {
		if (config.get('showUnreadBadge')) {
			if (messageCount === 0) {
				mainWindow.setOverlayIcon(null, '');
			} else {
				// Delegate drawing of overlay icon to renderer process
				mainWindow.webContents.send('render-overlay-icon', messageCount);
			}
		}

		if (config.get('flashWindowOnMessage')) {
			mainWindow.flashFrame(messageCount !== 0);
		}
	}
}

ipcMain.on('update-notification-badge', (event, messageCount) => {
	updateBadge(messageCount);
});

ipcMain.on('update-overlay-icon', (event, data, text) => {
	const img = electron.nativeImage.createFromDataURL(data);
	mainWindow.setOverlayIcon(img, text);
});

function createMainWindow() {
	const lastWindowState = config.get('lastWindowState');
	const mainURL = 'https://www.itslearning.com/welcome.aspx';

	const win = new electron.BrowserWindow({
		title: app.getName(),
		show: false,
		x: lastWindowState.x,
		y: lastWindowState.y,
		width: lastWindowState.width,
		height: lastWindowState.height,
		icon: process.platform === 'linux' && path.join(__dirname, 'static/Icon.png'),
		minWidth: 400,
		minHeight: 200,
		alwaysOnTop: config.get('alwaysOnTop'),
		// Temp workaround for macOS High Sierra, see #295
		titleBarStyle: 'hidden-inset',
		autoHideMenuBar: config.get('autoHideMenuBar'),
		webPreferences: {
			preload: path.join(__dirname, 'browser.js'),
			nodeIntegration: false,
			plugins: true
		},
		backgroundColor: '#f2f2f2'
	});

	if (process.platform === 'darwin') {
		win.setSheetOffset(40);
	}

	win.loadURL(mainURL);

	win.on('close', e => {
		if (!isQuitting) {
			e.preventDefault();

			// Workaround for electron/electron#10023
			win.blur();

			if (process.platform === 'darwin') {
				app.hide();
			} else {
				win.hide();
			}
		}
	});

	win.on('focus', () => {
		if (config.get('flashWindowOnMessage')) {
			// This is a security in the case where messageCount is not reset by page title update
			win.flashFrame(false);
		}
	});

	return win;
}

app.on('ready', () => {
	electron.Menu.setApplicationMenu(appMenu);
	mainWindow = createMainWindow();
	tray.create(mainWindow);

	if (process.platform === 'darwin') {
		dockMenu = electron.Menu.buildFromTemplate([]);
		app.dock.setMenu(dockMenu);
	}

	const {
		webContents
	} = mainWindow;

	webContents.on('dom-ready', () => {
		webContents.insertCSS(fs.readFileSync(path.join(__dirname, 'browser.css'), 'utf8'));

		if (config.get('launchMinimized')) {
			mainWindow.hide();
		} else {
			mainWindow.show();
		}
	});

	webContents.on('new-window', (event, url) => {
		// Event.preventDefault();

		// electron.shell.openExternal(url);
		event.preventDefault();
		const win = new electron.BrowserWindow({
			title: app.getName(),
			show: true,
			webPreferences: {
				preload: path.join(__dirname, 'browser.js'),
				nodeIntegration: false,
				plugins: true
			},
			backgroundColor: '#ffffff'
		});
		win.loadURL(url);
		event.newGuest = win;
	});
});

app.on('activate', () => {
	mainWindow.show();
});

app.on('before-quit', () => {
	isQuitting = true;

	if (!mainWindow.isFullScreen()) {
		config.set('lastWindowState', mainWindow.getBounds());
	}
});
