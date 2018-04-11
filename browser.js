'use strict';
const electron = require('electron');

const {
	ipcRenderer: ipc
} = electron;

ipc.on('log-out', () => {
	// Coming soon
});

function renderOverlayIcon(messageCount) {
	const canvas = document.createElement('canvas');
	canvas.height = 128;
	canvas.width = 128;
	canvas.style.letterSpacing = '-5px';
	const ctx = canvas.getContext('2d');
	ctx.fillStyle = '#f42020';
	ctx.beginPath();
	ctx.ellipse(64, 64, 64, 64, 0, 0, 2 * Math.PI);
	ctx.fill();
	ctx.textAlign = 'center';
	ctx.fillStyle = 'white';
	ctx.font = '90px sans-serif';
	ctx.fillText(String(Math.min(99, messageCount)), 64, 96);
	return canvas;
}

ipc.on('render-overlay-icon', (event, messageCount) => {
	ipc.send('update-overlay-icon', renderOverlayIcon(messageCount)
		.toDataURL(), String(messageCount));
});

let messageCount = 0;
let notificationCount = 0;

function messageBadgeCallback(mutationsList) {
	for (const mutation of mutationsList) {
		if (mutation.type === 'childList') {
			messageCount = Number(mutation.target.textContent);
			ipc.send('update-notification-badge', messageCount + notificationCount);
		}
	}
}

function notificationBadgeCallback(mutationsList) {
	for (const mutation of mutationsList) {
		if (mutation.type === 'childList') {
			notificationCount = Number(mutation.target.textContent);
			ipc.send('update-notification-badge', messageCount + notificationCount);
		}
	}
}

// Inject a global style node to maintain custom appearance after page change or startup
document.addEventListener('DOMContentLoaded', () => {
	// Enable OS specific styles
	document.documentElement.classList.add(`os-${process.platform}`);

	const messageBadge = document.querySelector('.l-personal-menu-instantmessage-count');
	const notificationBadge = document.querySelector('.l-personal-menu-items-link .l-mail-badge');
	if (messageBadge) {
		const messageObserver = new MutationObserver(messageBadgeCallback);
		messageObserver.observe(messageBadge, {
			childList: true
		});
	}
	if (notificationBadge) {
		const notificationObserver = new MutationObserver(notificationBadgeCallback);
		notificationObserver.observe(notificationBadge, {
			childList: true
		});
	}
});
