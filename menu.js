'use strict';
const os = require('os');
const path = require('path');
const electron = require('electron');
const config = require('./config');

const {app, BrowserWindow, shell} = electron;
const appName = app.getName();

function sendAction(action) {
	const [win] = BrowserWindow.getAllWindows();

	if (process.platform === 'darwin') {
		win.restore();
	}

	win.webContents.send(action);
}

const viewSubmenu = [
	{
		type: 'separator'
	}
];

const helpSubmenu = [
	{
		label: `Website`,
		click() {
			shell.openExternal('https://github.com/16patsle/its');
		}
	},
	{
		label: `Source Code`,
		click() {
			shell.openExternal('https://github.com/16patsle/its');
		}
	},
	{
		label: 'Report an Issue…',
		click() {
			const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->


---

${app.getName()} ${app.getVersion()}
Electron ${process.versions.electron}
${process.platform} ${process.arch} ${os.release()}`;

			shell.openExternal(`https://github.com/16patsle/its/issues/new?body=${encodeURIComponent(body)}`);
		}
	}
];

if (process.platform !== 'darwin') {
	helpSubmenu.push({
		type: 'separator'
	}, {
		role: 'about',
		click() {
			electron.dialog.showMessageBox({
				title: `About ${appName}`,
				message: `${appName} ${app.getVersion()}`,
				detail: 'Created by Patrick Sletvold',
				icon: path.join(__dirname, 'static/Icon.png')
			});
		}
	});

	viewSubmenu.push({
		type: 'separator'
	}, {
		type: 'checkbox',
		label: 'Always on Top',
		accelerator: 'Ctrl+Shift+T',
		checked: config.get('alwaysOnTop'),
		click(item, focusedWindow) {
			config.set('alwaysOnTop', item.checked);
			focusedWindow.setAlwaysOnTop(item.checked);
		}
	});
}

const macosTpl = [
	{
		label: appName,
		submenu: [
			{
				role: 'about'
			},
			{
				type: 'separator'
			},
			{
				label: 'Bounce Dock on Message',
				type: 'checkbox',
				checked: config.get('bounceDockOnMessage'),
				click() {
					config.set('bounceDockOnMessage', !config.get('bounceDockOnMessage'));
				}
			},,
			{
				label: 'Show Unread Badge',
				type: 'checkbox',
				checked: config.get('showUnreadBadge'),
				click() {
					config.set('showUnreadBadge', !config.get('showUnreadBadge'));
				}
			},
			{
				type: 'separator'
			},
			{
				label: 'Log Out',
				click() {
					sendAction('log-out');
				}
			},
			{
				type: 'separator'
			},
			{
				role: 'services',
				submenu: []
			},
			{
				type: 'separator'
			},
			{
				role: 'hide'
			},
			{
				role: 'hideothers'
			},
			{
				role: 'unhide'
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'File',
		submenu: []
	},
	{
		role: 'editMenu'
	},
	{
		label: 'View',
		submenu: viewSubmenu
	},
	{
		role: 'window',
		submenu: [
			{
				role: 'minimize'
			},
			{
				role: 'close'
			},
			{
				type: 'separator'
			},
			{
				type: 'separator'
			},
			{
				role: 'front'
			},
			{
				role: 'togglefullscreen'
			},
			{
				type: 'separator'
			},
			{
				type: 'checkbox',
				label: 'Always on Top',
				accelerator: 'Cmd+Shift+T',
				checked: config.get('alwaysOnTop'),
				click(item, focusedWindow) {
					config.set('alwaysOnTop', item.checked);
					focusedWindow.setAlwaysOnTop(item.checked);
				}
			}
		]
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const otherTpl = [
	{
		label: 'File',
		submenu: [
			{
				type: 'checkbox',
				label: 'Flash Window on Message',
				visible: process.platform === 'win32',
				checked: config.get('flashWindowOnMessage'),
				click(item) {
					config.set('flashWindowOnMessage', item.checked);
				}
			},
			{
				label: 'Show Unread Badge',
				type: 'checkbox',
				checked: config.get('showUnreadBadge'),
				click() {
					config.set('showUnreadBadge', !config.get('showUnreadBadge'));
				}
			},
			{
				label: 'Launch Minimized',
				type: 'checkbox',
				checked: config.get('launchMinimized'),
				click() {
					config.set('launchMinimized', !config.get('launchMinimized'));
				}
			},
			{
				type: 'checkbox',
				label: 'Auto Hide Menu Bar',
				checked: config.get('autoHideMenuBar'),
				click(item, focusedWindow) {
					config.set('autoHideMenuBar', item.checked);
					focusedWindow.setAutoHideMenuBar(item.checked);
					focusedWindow.setMenuBarVisibility(!item.checked);
				}
			},
			{
				type: 'separator'
			},
			{
				label: 'Log Out',
				click() {
					sendAction('log-out');
				}
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{
				role: 'undo'
			},
			{
				role: 'redo'
			},
			{
				type: 'separator'
			},
			{
				role: 'cut'
			},
			{
				role: 'copy'
			},
			{
				role: 'paste'
			},
			{
				role: 'delete'
			},
			{
				type: 'separator'
			},
			{
				role: 'selectall'
			},
			{
				type: 'separator'
			}
		]
	},
	{
		label: 'View',
		submenu: viewSubmenu
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const tpl = process.platform === 'darwin' ? macosTpl : otherTpl;

module.exports = electron.Menu.buildFromTemplate(tpl);
