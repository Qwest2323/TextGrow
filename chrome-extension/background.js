// TextGrow Chrome Extension - Background Script
console.log('TextGrow background script loaded');

// Configuration
const API_BASE_URL = 'https://lkpdmllkksgybuwipkjf.supabase.co/rest/v1';
const SUPABASE_URL = 'https://lkpdmllkksgybuwipkjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcGRtbGxra3NneWJ1d2lwa2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2MDk4NjcsImV4cCI6MjA2MzE4NTg2N30.1mny2GnXzwSKmLm_LLP7-7Gnq16UYhl5ayTugULhLKs';

// Storage keys
const STORAGE_KEYS = {
  USER_TOKEN: 'textgrow_user_token',
  SHORTCUTS: 'textgrow_shortcuts', 
  SETTINGS: 'textgrow_settings',
  LAST_SYNC: 'textgrow_last_sync'
};

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  showDropdown: true,
  autoExpand: false,  // Prefer dropdown selection over auto-expansion
  triggerDelay: 500
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('TextGrow extension installed');
  
  // Set default settings
  const { [STORAGE_KEYS.SETTINGS]: existingSettings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  if (!existingSettings) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
    });
  }
  
  // Initial sync
  await syncShortcuts();
});

// Sync shortcuts with Supabase
async function syncShortcuts() {
  try {
    console.log('=== SYNC SHORTCUTS DEBUG ===');
    console.log('Syncing shortcuts with server...');
    
    const { [STORAGE_KEYS.USER_TOKEN]: userToken } = await chrome.storage.local.get(STORAGE_KEYS.USER_TOKEN);
    console.log('User token found:', userToken ? `${userToken.substring(0, 20)}...` : 'NONE');
    
    if (!userToken) {
      console.log('No user token found, skipping sync');
      return;
    }
    
    // Get user ID from token to filter shortcuts
    let userId = null;
    try {
      const tokenPayload = JSON.parse(atob(userToken.split('.')[1]));
      userId = tokenPayload.sub;
      console.log('User ID from token:', userId);
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    // Use Supabase REST API with text_grow schema - filter by user
    const endpoint = userId 
      ? `${API_BASE_URL}/shortcuts?select=*&user_id=eq.${userId}`
      : `${API_BASE_URL}/shortcuts?select=*`;
    console.log('Using text_grow schema with shortcuts table:', endpoint);
    console.log('Making API call to:', endpoint);
    
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Accept-Profile': 'text_grow',
        'Prefer': 'return=representation'
      }
    });
    
    console.log('API Response status:', response.status);
    console.log('API Response ok:', response.ok);
    
    if (response.ok) {
      const shortcuts = await response.json();
      console.log('Received shortcuts from API:', shortcuts);
      console.log('Number of shortcuts:', shortcuts.length);
      
      if (shortcuts.length > 0) {
        console.log('First shortcut:', shortcuts[0]);
      }
      
      // Transform Supabase data to expected format
      const formattedShortcuts = shortcuts.map(shortcut => ({
        id: shortcut.id,
        trigger: shortcut.trigger,
        content: shortcut.content,
        folder_id: shortcut.folder_id,
        created_at: shortcut.created_at,
        updated_at: shortcut.updated_at
      }));
      
      // Store shortcuts locally
      await chrome.storage.local.set({
        [STORAGE_KEYS.SHORTCUTS]: formattedShortcuts,
        [STORAGE_KEYS.LAST_SYNC]: Date.now()
      });
      
      console.log(`✅ Synced ${formattedShortcuts.length} shortcuts successfully`);
      
      // Notify content scripts about update
      notifyContentScripts('shortcuts-updated', formattedShortcuts);
    } else {
      console.error('❌ Failed to sync shortcuts. Status:', response.status);
      
      // Try to get error details
      try {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
    }
  } catch (error) {
    console.error('❌ Error syncing shortcuts:', error);
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
        // Ignore errors for tabs that can't receive messages
      }
    }
  } catch (error) {
    console.error('Error notifying content scripts:', error);
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  switch (message.type) {
    case 'get-shortcuts':
      handleGetShortcuts(sendResponse);
      return true; // Keep response channel open
      
    case 'get-settings':
      handleGetSettings(sendResponse);
      return true;
      
    case 'save-settings':
      handleSaveSettings(message.settings, sendResponse);
      return true;
      
    case 'save-user-token':
      handleSaveUserToken(message.token, sendResponse);
      return true;
      
    case 'sync-now':
      handleSyncNow(sendResponse);
      return true;
      
    default:
      console.log('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

// Message handlers
async function handleGetShortcuts(sendResponse) {
  try {
    const { [STORAGE_KEYS.SHORTCUTS]: shortcuts } = await chrome.storage.local.get(STORAGE_KEYS.SHORTCUTS);
    sendResponse(shortcuts || []);
  } catch (error) {
    console.error('Error getting shortcuts:', error);
    sendResponse([]);
  }
}

async function handleGetSettings(sendResponse) {
  try {
    const { [STORAGE_KEYS.SETTINGS]: settings } = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    sendResponse(settings || DEFAULT_SETTINGS);
  } catch (error) {
    console.error('Error getting settings:', error);
    sendResponse(DEFAULT_SETTINGS);
  }
}

async function handleSaveSettings(newSettings, sendResponse) {
  try {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS, ...newSettings }
    });
    
    // Notify content scripts about settings update
    notifyContentScripts('settings-updated', newSettings);
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    sendResponse({ error: error.message });
  }
}

async function handleSaveUserToken(token, sendResponse) {
  try {
    console.log('Saving user token:', token ? `${token.substring(0, 20)}...` : 'NONE');
    
    await chrome.storage.local.set({
      [STORAGE_KEYS.USER_TOKEN]: token
    });
    
    // Trigger immediate sync
    await syncShortcuts();
    
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving user token:', error);
    sendResponse({ error: error.message });
  }
}

async function handleSyncNow(sendResponse) {
  try {
    await syncShortcuts();
    sendResponse({ success: true });
  } catch (error) {
    console.error('Error during manual sync:', error);
    sendResponse({ error: error.message });
  }
}

// Periodic sync every 5 minutes
setInterval(async () => {
  console.log('Performing periodic sync...');
  await syncShortcuts();
}, 5 * 60 * 1000);

// Listen for extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('TextGrow extension started');
  await syncShortcuts();
});

// Handle external messages (from dashboard)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('External message received:', message);
  
  if (message.type === 'save-user-token' && message.token) {
    handleSaveUserToken(message.token, sendResponse);
    return true;
  }
});

console.log('TextGrow background script initialized');