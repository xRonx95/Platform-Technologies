(function () {
  'use strict';

  // Add an HTTPS URL from GitHub Releases or your official server to enable APK downloads.
  const ANDROID_APK_URL = '';
  const DISMISS_KEY = 'stackforge-install-dismissed-at';
  const DISMISS_FOR_MS = 14 * 24 * 60 * 60 * 1000;
  let deferredInstallPrompt = null;
  let waitingWorker = null;

  const $ = (selector) => document.querySelector(selector);
  const dialog = $('#installDialog');
  const launcher = $('#installLauncher');
  const primaryButton = $('#installPrimary');
  const apkButton = $('#downloadApkButton');
  const details = $('#installDetails');

  function getDeviceInfo() {
    const ua = navigator.userAgent || '';
    const platform = navigator.userAgentData && navigator.userAgentData.platform
      ? navigator.userAgentData.platform
      : navigator.platform || '';
    const android = /Android/i.test(ua) || /Android/i.test(platform);
    const iPhone = /iPhone/i.test(ua);
    const iPad = /iPad/i.test(ua) || (/Mac/i.test(platform) && navigator.maxTouchPoints > 1);
    const windows = /Windows/i.test(platform) || /Windows/i.test(ua);
    const macOS = !iPad && (/macOS/i.test(platform) || /Macintosh/i.test(ua));
    const safari = /Safari/i.test(ua) && !/(Chrome|CriOS|Chromium|Edg|OPR|SamsungBrowser)/i.test(ua);
    const desktopChrome = !android && !iPhone && !iPad && /(Chrome|Chromium|Edg)/i.test(ua);
    const embedded = /(FBAN|FBAV|Instagram|Messenger|Line\/|GSA\/|Gmail)/i.test(ua);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    return { android, iPhone, iPad, iOS: iPhone || iPad, windows, macOS, safari, desktopChrome, embedded, standalone };
  }

  function setText(element, text) {
    element.textContent = text;
  }

  function showDialog() {
    if (!dialog || getDeviceInfo().standalone) return;
    configureDialog();
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog(remember) {
    if (dialog && dialog.open) dialog.close();
    if (remember) localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }

  function showIosInstructions() {
    const device = getDeviceInfo();
    details.hidden = false;
    details.replaceChildren();
    const heading = document.createElement('strong');
    setText(heading, 'Install on iPhone or iPad');
    const list = document.createElement('ol');
    list.className = 'ios-steps';
    ['Open this website using Safari.', 'Tap the Share button.', "Scroll down and select 'Add to Home Screen'.", "Tap 'Add'.", 'The application will appear on your Home Screen.'].forEach((instruction) => {
      const item = document.createElement('li');
      setText(item, instruction);
      list.appendChild(item);
    });
    details.append(heading, list);
    if (device.embedded || !device.safari) {
      const note = document.createElement('p');
      note.className = 'install-note';
      setText(note, 'For installation on iPhone, please open this page in Safari.');
      details.appendChild(note);
    }
  }

  function showManualInstructions() {
    details.hidden = false;
    details.replaceChildren();
    const heading = document.createElement('strong');
    setText(heading, 'Install from your browser menu');
    const note = document.createElement('p');
    note.className = 'install-note';
    setText(note, 'Open the browser menu and choose Install app, Apps > Install this site, or Add to Home Screen. Availability depends on your browser.');
    details.append(heading, note);
  }

  function configureDialog() {
    const device = getDeviceInfo();
    details.hidden = true;
    details.replaceChildren();
    apkButton.hidden = !(device.android && /^https:\/\//i.test(ANDROID_APK_URL));
    if (device.iOS) {
      setText(primaryButton, 'Install on iPhone');
    } else if (deferredInstallPrompt) {
      setText(primaryButton, 'Install App');
    } else {
      setText(primaryButton, 'Open Instructions');
    }
  }

  async function handlePrimaryInstall() {
    const device = getDeviceInfo();
    if (device.iOS) return showIosInstructions();
    if (!deferredInstallPrompt) return showManualInstructions();
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    configureDialog();
  }

  function confirmApkDownload() {
    details.hidden = false;
    details.replaceChildren();
    const box = document.createElement('div');
    box.className = 'install-confirm';
    const heading = document.createElement('strong');
    setText(heading, 'Android Application');
    const message = document.createElement('p');
    setText(message, 'You are about to download the official Android version of this application. Only install applications downloaded from the official website. Android may ask for permission before installation. Never disable Google Play Protect.');
    const actions = document.createElement('div');
    actions.className = 'install-confirm-actions';
    const cancel = document.createElement('button');
    cancel.className = 'install-action';
    cancel.type = 'button';
    setText(cancel, 'Cancel');
    cancel.addEventListener('click', () => { details.hidden = true; });
    const download = document.createElement('a');
    download.className = 'install-action primary';
    download.href = ANDROID_APK_URL;
    download.rel = 'noopener noreferrer';
    setText(download, 'Download APK');
    actions.append(cancel, download);
    box.append(heading, message, actions);
    details.appendChild(box);
  }

  function markInstalled() {
    if (launcher) launcher.hidden = true;
    closeDialog(false);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    configureDialog();
  });
  window.addEventListener('appinstalled', markInstalled);

  launcher.addEventListener('click', showDialog);
  $('#installClose').addEventListener('click', () => closeDialog(true));
  $('#installLater').addEventListener('click', () => closeDialog(true));
  primaryButton.addEventListener('click', handlePrimaryInstall);
  apkButton.addEventListener('click', confirmApkDownload);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(true); });

  const device = getDeviceInfo();
  if (device.standalone) markInstalled();
  else {
    launcher.hidden = false;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt > DISMISS_FOR_MS) window.setTimeout(showDialog, 3500);
  }

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        if (registration.waiting) showUpdate(registration.waiting);
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdate(worker);
          });
        });
      } catch (error) {
        console.warn('StackForge offline support could not be enabled.', error);
      }
    });
  }

  function showUpdate(worker) {
    waitingWorker = worker;
    $('#updateNotice').hidden = false;
  }

  $('#updateNow').addEventListener('click', () => {
    if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  });
  $('#updateLater').addEventListener('click', () => { $('#updateNotice').hidden = true; });
  navigator.serviceWorker && navigator.serviceWorker.addEventListener('controllerchange', () => location.reload());
})();
