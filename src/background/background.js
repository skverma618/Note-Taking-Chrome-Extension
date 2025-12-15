// Background service worker for Chrome extension

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Note Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // Initialize storage on first install
    chrome.storage.local.set({ notes: {} });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getNotes') {
    chrome.storage.local.get(['notes']).then((result) => {
      sendResponse({ notes: result.notes || {} });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'saveNote') {
    chrome.storage.local.get(['notes']).then((result) => {
      const notes = result.notes || {};
      notes[request.url] = request.note;
      
      chrome.storage.local.set({ notes }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'deleteNote') {
    chrome.storage.local.get(['notes']).then((result) => {
      const notes = result.notes || {};
      delete notes[request.url];
      
      chrome.storage.local.set({ notes }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open for async response
  }
});

// Handle tab updates to potentially update note titles
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Update note title if it exists and title has changed
    chrome.storage.local.get(['notes']).then((result) => {
      const notes = result.notes || {};
      if (notes[tab.url] && notes[tab.url].title !== tab.title) {
        notes[tab.url].title = tab.title;
        notes[tab.url].updatedAt = new Date().toISOString();
        chrome.storage.local.set({ notes });
      }
    });
  }
});

// Context menu for quick note access (optional)
chrome.contextMenus.create({
  id: 'addToNote',
  title: 'Add to Note',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'addToNote' && info.selectionText) {
    // Send message to content script to add selected text
    chrome.tabs.sendMessage(tab.id, {
      action: 'addSelectedText',
      text: info.selectionText
    });
  }
});

// Handle extension icon click to directly open sidebar
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Send message to content script to toggle sidebar
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
  } catch (error) {
    console.error('Error opening sidebar:', error);
    // If content script is not loaded, inject it first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      // Try again after injecting content script
      await chrome.tabs.sendMessage(tab.id, { action: 'toggleSidebar' });
    } catch (injectionError) {
      console.error('Error injecting content script:', injectionError);
    }
  }
});