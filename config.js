'use strict';
const Store = require('electron-store');

module.exports = new Store({
  defaults: {
    lastWindowState: {
      width: 800,
      height: 600
    },
    alwaysOnTop: false,
    bounceDockOnMessage: false,
    showUnreadBadge: true,
    launchMinimized: false,
    flashWindowOnMessage: true,
    autoHideMenuBar: false,
  }
});
