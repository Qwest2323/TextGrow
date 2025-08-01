// TextGrow Chrome Extension - Background Script
console.log('TextGrow background script loaded');

// Configuration
const API_BASE_URL = 'https://33b05a3b-9bfa-4997-839a-18d5ce3a17bd.preview.emergentagent.com/api';
const SUPABASE_URL = 'https://lkpdmllkksgybuwipkjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcGRtbGxra3NneWJ1d2lwa2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MDk4NjcsImV4cCI6MjA2MzE4NTg2N30.1mny2GnXzwSKmLm_LLP7-7Gnq16UYhl5ayTugULhLKs';

// Storage keys
const STORAGE_KEYS = {
  SHORTCUTS: 'textgrow_shortcuts',
  USER_TOKEN: 'textgrow_user_token',
  LAST_SYNC: 'textgrow_last_sync',
  SETTINGS: 'textgrow_settings'
};

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  syncInterval: 5, // minutes
  showDropdown: true,
  autoExpand: true,
  triggerDelay: 500 // ms
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('TextGrow extension installed');
  
  // Initialize storage
  await initializeStorage();
  
  // Set up periodic sync
  setupPeriodicSync();
  
  if (details.reason === 'install') {
    // Open welcome page on first install
    chrome.tabs.create({
      url: 'https://33b05a3b-9bfa-4997-839a-18d5ce3a17bd.preview.emergentagent.com'
    });
  }
});

// Initialize storage with default values
async function initializeStorage() {
  const result = await chrome.storage.local.get([
    STORAGE_KEYS.SHORTCUTS,
    STORAGE_KEYS.SETTINGS
  ]);
  
  if (!result[STORAGE_KEYS.SHORTCUTS]) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SHORTCUTS]: []
    });
  }
  
  if (!result[STORAGE_KEYS.SETTINGS]) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
    });
  }
}

// Set up periodic sync with server
function setupPeriodicSync() {
  // Initial sync
  syncShortcuts();
  
  // Set up alarm for periodic sync
  chrome.alarms.create('textgrow-sync', {
    delayInMinutes: 1,
    periodInMinutes: 5
  });
}

// Handle alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'textgrow-sync') {
    syncShortcuts();
  }
});

// Sync shortcuts with server
async function syncShortcuts() {
  try {
    console.log('Syncing shortcuts with server...');
    
    const { [STORAGE_KEYS.USER_TOKEN]: userToken } = await chrome.storage.local.get(STORAGE_KEYS.USER_TOKEN);
    
    if (!userToken) {
      console.log('No user token found, skipping sync');
      return;
    }
    
    // Fetch shortcuts from server
    const response = await fetch(`${API_BASE_URL}/shortcuts`, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const shortcuts = await response.json();
      
      // Store shortcuts locally
      await chrome.storage.local.set({
        [STORAGE_KEYS.SHORTCUTS]: shortcuts,
        [STORAGE_KEYS.LAST_SYNC]: Date.now()
      });
      
      console.log(`Synced ${shortcuts.length} shortcuts`);
      
      // Notify content scripts about update
      notifyContentScripts('shortcuts-updated', shortcuts);
    } else {
      console.error('Failed to sync shortcuts:', response.status);
    }
  } catch (error) {
    console.error('Error syncing shortcuts:', error);
  }
}

// Notify all content scripts
async function notifyContentScripts(type, data) {
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type, data });
      } catch (error) {
        // Ignore errors for tabs that don't have content script
      }
    }
  } catch (error) {
    console.error('Error notifying content scripts:', error);
  }
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'get-shortcuts':
      getShortcuts().then(sendResponse);
      return true;
      
    case 'search-shortcuts':
      searchShortcuts(message.query).then(sendResponse);
      return true;
      
    case 'sync-now':
      syncShortcuts().then(() => sendResponse({ success: true }));
      return true;
      
    case 'save-user-token':
      saveUserToken(message.token).then(() => sendResponse({ success: true }));
      return true;
      
    case 'get-settings':
      getSettings().then(sendResponse);
      return true;
      
    case 'update-settings':
      updateSettings(message.settings).then(() => sendResponse({ success: true }));
      return true;
      
    default:
      console.warn('Unknown message type:', message.type);
  }
});

// Get shortcuts from storage
async function getShortcuts() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SHORTCUTS);
  return result[STORAGE_KEYS.SHORTCUTS] || [];
}

// Search shortcuts by trigger or content
async function searchShortcuts(query) {
  const shortcuts = await getShortcuts();
  if (!query) return shortcuts;
  
  const lowerQuery = query.toLowerCase();
  return shortcuts.filter(shortcut => 
    shortcut.trigger.toLowerCase().includes(lowerQuery) ||
    shortcut.content.toLowerCase().includes(lowerQuery)
  );
}

// Save user authentication token
async function saveUserToken(token) {
  await chrome.storage.local.set({
    [STORAGE_KEYS.USER_TOKEN]: token
  });
  
  // Trigger immediate sync
  syncShortcuts();
}

// Get settings
async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

// Update settings
async function updateSettings(newSettings) {
  const currentSettings = await getSettings();
  const updatedSettings = { ...currentSettings, ...newSettings };
  
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: updatedSettings
  });
  
  // Notify content scripts about settings change
  notifyContentScripts('settings-updated', updatedSettings);
}

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  // This will open the popup automatically due to default_popup in manifest
});

console.log('TextGrow background script initialized');