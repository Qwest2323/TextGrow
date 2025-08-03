// TextGrow Chrome Extension - Popup Script
console.log('TextGrow popup script loaded');

class TextGrowPopup {
  constructor() {
    this.shortcuts = [];
    this.filteredShortcuts = [];
    this.settings = {};
    this.isAuthenticated = false;
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.setupStorageListener();
    this.updateUI();
  }
  
  setupStorageListener() {
    // Listen for storage changes (shortcuts updates)
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        if (changes.textgrow_shortcuts || changes.force_popup_refresh) {
          console.log('Shortcuts updated, refreshing popup');
          this.loadData().then(() => {
            this.updateUI();
          });
        }
      }
    });
  }
  
  async loadData() {
    try {
      // Load shortcuts and settings
      this.shortcuts = await this.sendMessage('get-shortcuts') || [];
      this.settings = await this.sendMessage('get-settings') || {};
      this.filteredShortcuts = [...this.shortcuts];
      
      // Check authentication status
      const result = await chrome.storage.local.get('textgrow_user_token');
      this.isAuthenticated = !!result.textgrow_user_token;
      
      console.log(`Loaded ${this.shortcuts.length} shortcuts`);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }
  
  setupEventListeners() {
    // Authentication
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');
    const pasteTokenBtn = document.getElementById('pasteTokenBtn');
    
    if (signInBtn) {
      signInBtn.addEventListener('click', this.handleSignIn.bind(this));
    }
    if (signOutBtn) {
      signOutBtn.addEventListener('click', this.handleSignOut.bind(this));
    }
    if (pasteTokenBtn) {
      pasteTokenBtn.addEventListener('click', this.handlePasteToken.bind(this));
      console.log('Token paste button listener added');
    }
    
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearch.bind(this));
    }
    
    // Quick actions
    const syncBtn = document.getElementById('syncBtn');
    const addBtn = document.getElementById('addBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    
    if (syncBtn) syncBtn.addEventListener('click', this.handleSync.bind(this));
    if (addBtn) addBtn.addEventListener('click', this.handleAdd.bind(this));
    if (settingsBtn) settingsBtn.addEventListener('click', this.showSettings.bind(this));
    
    // Settings panel
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', this.hideSettings.bind(this));
    }
    
    // Footer links
    const openDashboardBtn = document.getElementById('openDashboardBtn');
    const helpBtn = document.getElementById('helpBtn');
    const createFirstBtn = document.getElementById('createFirstBtn');
    
    if (openDashboardBtn) openDashboardBtn.addEventListener('click', this.openDashboard.bind(this));
    if (helpBtn) helpBtn.addEventListener('click', this.openHelp.bind(this));
    if (createFirstBtn) createFirstBtn.addEventListener('click', this.handleAdd.bind(this));
  }
  
  updateUI() {
    this.updateAuthenticationState();
    this.updateShortcutsList();
    this.updateSettings();
    this.updateStatus();
  }
  
  updateAuthenticationState() {
    const notAuthState = document.getElementById('notAuthenticatedState');
    const authState = document.getElementById('authenticatedState');
    
    if (this.isAuthenticated) {
      if (notAuthState) notAuthState.style.display = 'none';
      if (authState) authState.style.display = 'flex';
    } else {
      if (notAuthState) notAuthState.style.display = 'flex';
      if (authState) authState.style.display = 'none';
    }
  }
  
  updateShortcutsList() {
    const shortcutsList = document.getElementById('shortcutsList');
    const noShortcuts = document.getElementById('noShortcuts');
    const shortcutCount = document.getElementById('shortcutCount');
    
    if (!shortcutsList) return;
    
    // Update count
    if (shortcutCount) {
      shortcutCount.textContent = this.filteredShortcuts.length;
    }
    
    if (this.filteredShortcuts.length === 0) {
      shortcutsList.style.display = 'none';
      if (noShortcuts) noShortcuts.style.display = 'flex';
      return;
    }
    
    shortcutsList.style.display = 'block';
    if (noShortcuts) noShortcuts.style.display = 'none';
    
    // Generate shortcuts HTML
    shortcutsList.innerHTML = this.filteredShortcuts
      .slice(0, 10) // Show only first 10 shortcuts
      .map(shortcut => this.generateShortcutHTML(shortcut))
      .join('');
    
    // Add event listeners
    this.addShortcutListeners();
  }
  
  generateShortcutHTML(shortcut) {
    return `
      <div class="shortcut-item" data-id="${shortcut.id}">
        <div class="shortcut-trigger">${shortcut.trigger}</div>
        <div class="shortcut-content">${this.truncateText(shortcut.content, 100)}</div>
        <div class="shortcut-actions">
          <button class="shortcut-action copy-btn" data-content="${this.escapeHtml(shortcut.content)}">
            Copy
          </button>
          <button class="shortcut-action edit-btn" data-id="${shortcut.id}">
            Edit
          </button>
        </div>
      </div>
    `;
  }
  
  addShortcutListeners() {
    // Copy buttons
    document.querySelectorAll('.copy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.copyToClipboard(btn.dataset.content);
      });
    });
    
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editShortcut(btn.dataset.id);
      });
    });
    
    // Shortcut items (copy on click)
    document.querySelectorAll('.shortcut-item').forEach(item => {
      item.addEventListener('click', () => {
        const copyBtn = item.querySelector('.copy-btn');
        if (copyBtn) {
          this.copyToClipboard(copyBtn.dataset.content);
        }
      });
    });
  }
  
  updateSettings() {
    const enabledToggle = document.getElementById('enabledToggle');
    const showDropdownToggle = document.getElementById('showDropdownToggle');
    const autoExpandToggle = document.getElementById('autoExpandToggle');
    const triggerDelaySlider = document.getElementById('triggerDelaySlider');
    const triggerDelayValue = document.getElementById('triggerDelayValue');
    
    if (enabledToggle) enabledToggle.checked = this.settings.enabled !== false;
    if (showDropdownToggle) showDropdownToggle.checked = this.settings.showDropdown !== false;
    if (autoExpandToggle) autoExpandToggle.checked = this.settings.autoExpand !== false;
    
    if (triggerDelaySlider) {
      triggerDelaySlider.value = this.settings.triggerDelay || 500;
    }
    if (triggerDelayValue) {
      triggerDelayValue.textContent = `${this.settings.triggerDelay || 500}ms`;
    }
  }
  
  updateStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (!statusDot || !statusText) return;
    
    if (this.isAuthenticated) {
      statusDot.className = 'status-dot';
      statusText.textContent = `${this.shortcuts.length} shortcuts`;
    } else {
      statusDot.className = 'status-dot error';
      statusText.textContent = 'Not signed in';
    }
  }
  
  handleSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    
    if (!query) {
      this.filteredShortcuts = [...this.shortcuts];
    } else {
      this.filteredShortcuts = this.shortcuts.filter(shortcut => 
        shortcut.trigger.toLowerCase().includes(query) ||
        shortcut.content.toLowerCase().includes(query)
      );
    }
    
    this.updateShortcutsList();
  }
  
  async handleSignIn() {
    try {
      // Open setup page first, then dashboard
      const setupUrl = 'http://localhost:3000/extension-setup.html?auto=true';
      chrome.tabs.create({ url: setupUrl });
      
      this.showTemporaryStatus('Opening setup page...');
    } catch (error) {
      console.error('Error opening setup:', error);
      this.showTemporaryStatus('Error opening setup page', 'error');
    }
  }
  
  async handlePasteToken() {
    console.log('handlePasteToken called');
    
    try {
      const tokenInput = document.getElementById('tokenInput');
      console.log('Token input element:', tokenInput);
      
      if (!tokenInput) {
        console.error('Token input not found');
        this.showTemporaryStatus('Token input not found', 'error');
        return;
      }
      
      const token = tokenInput.value.trim();
      console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'empty');
      
      if (!token) {
        this.showTemporaryStatus('Please enter a token', 'error');
        return;
      }
      
      // Basic token validation
      if (token.length < 20) {
        this.showTemporaryStatus('Token seems too short', 'error');
        return;
      }
      
      this.showTemporaryStatus('Connecting...');
      
      // Store token
      await chrome.storage.local.set({ 'textgrow_user_token': token });
      console.log('Token stored in local storage');
      
      // Update authentication state
      this.isAuthenticated = true;
      
      // Try to sync with backend
      try {
        const syncResult = await this.sendMessage('save-user-token', { token: token });
        console.log('Sync result:', syncResult);
      } catch (syncError) {
        console.warn('Sync failed, but token stored locally:', syncError);
      }
      
      // Reload data
      await this.loadData();
      this.updateUI();
      
      // Clear the input
      tokenInput.value = '';
      
      this.showTemporaryStatus('Connected successfully!');
      
    } catch (error) {
      console.error('Error in handlePasteToken:', error);
      this.showTemporaryStatus('Connection failed: ' + error.message, 'error');
      
      // Reset authentication state on failure
      this.isAuthenticated = false;
      try {
        await chrome.storage.local.remove('textgrow_user_token');
      } catch (removeError) {
        console.error('Error removing token:', removeError);
      }
      this.updateUI();
    }
  }

  async handleSignOut() {
    try {
      await chrome.storage.local.remove(['textgrow_user_token', 'textgrow_shortcuts']);
      this.isAuthenticated = false;
      this.shortcuts = [];
      this.filteredShortcuts = [];
      this.updateUI();
      this.showTemporaryStatus('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
  
  async handleSync() {
    try {
      const statusDot = document.querySelector('.status-dot');
      const statusText = document.querySelector('.status-text');
      
      if (statusDot) statusDot.className = 'status-dot syncing';
      if (statusText) statusText.textContent = 'Syncing...';
      
      console.log('Manual sync triggered');
      
      // Clear local cache first
      await chrome.storage.local.remove('textgrow_shortcuts');
      console.log('Cleared local shortcuts cache');
      
      // Trigger background sync
      await this.sendMessage('sync-now');
      console.log('Background sync triggered');
      
      // Wait a moment for sync to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload data
      await this.loadData();
      this.updateUI();
      
      console.log('Sync completed, shortcuts updated:', this.shortcuts.length);
      this.showTemporaryStatus('Shortcuts synced successfully');
    } catch (error) {
      console.error('Error syncing:', error);
      this.showTemporaryStatus('Sync failed', 'error');
    }
  }
  
  handleAdd() {
    const dashboardUrl = 'http://localhost:3000';
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  editShortcut(shortcutId) {
    const dashboardUrl = `http://localhost:3000?edit=${shortcutId}`;
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  showSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.style.display = 'flex';
    }
  }
  
  hideSettings() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel) {
      settingsPanel.style.display = 'none';
    }
  }
  
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showTemporaryStatus('Copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.showTemporaryStatus('Copied to clipboard');
    }
  }
  
  openDashboard() {
    const dashboardUrl = 'http://localhost:3000';
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  openHelp() {
    const helpUrl = 'http://localhost:3000/help';
    chrome.tabs.create({ url: helpUrl });
  }
  
  showTemporaryStatus(message, type = 'success') {
    const statusText = document.querySelector('.status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (statusText) {
      const originalText = statusText.textContent;
      statusText.textContent = message;
      
      if (statusDot) {
        statusDot.className = `status-dot ${type === 'error' ? 'error' : ''}`;
      }
      
      setTimeout(() => {
        statusText.textContent = originalText;
        if (statusDot) {
          statusDot.className = 'status-dot';
        }
      }, 3000);
    }
  }
  
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  sendMessage(type, data = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...data }, resolve);
    });
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing TextGrowPopup');
  new TextGrowPopup();
});