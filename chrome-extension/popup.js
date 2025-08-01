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
    this.updateUI();
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
    document.getElementById('signInBtn')?.addEventListener('click', this.handleSignIn.bind(this));
    document.getElementById('signOutBtn')?.addEventListener('click', this.handleSignOut.bind(this));
    document.getElementById('pasteTokenBtn')?.addEventListener('click', this.handlePasteToken.bind(this));
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', this.handleSearch.bind(this));
    
    // Quick actions
    document.getElementById('syncBtn')?.addEventListener('click', this.handleSync.bind(this));
    document.getElementById('addBtn')?.addEventListener('click', this.handleAdd.bind(this));
    document.getElementById('settingsBtn')?.addEventListener('click', this.showSettings.bind(this));
    
    // Settings panel
    document.getElementById('closeSettingsBtn')?.addEventListener('click', this.hideSettings.bind(this));
    document.getElementById('enabledToggle')?.addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('showDropdownToggle')?.addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('autoExpandToggle')?.addEventListener('change', this.handleSettingChange.bind(this));
    document.getElementById('triggerDelaySlider')?.addEventListener('input', this.handleTriggerDelayChange.bind(this));
    
    // Footer links
    document.getElementById('openDashboardBtn')?.addEventListener('click', this.openDashboard.bind(this));
    document.getElementById('helpBtn')?.addEventListener('click', this.openHelp.bind(this));
    document.getElementById('createFirstBtn')?.addEventListener('click', this.handleAdd.bind(this));
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
      notAuthState.style.display = 'none';
      authState.style.display = 'flex';
    } else {
      notAuthState.style.display = 'flex';
      authState.style.display = 'none';
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
      const setupUrl = 'https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com/extension-setup.html?auto=true';
      chrome.tabs.create({ url: setupUrl });
      
      this.showTemporaryStatus('Opening setup page...');
    } catch (error) {
      console.error('Error opening setup:', error);
      this.showTemporaryStatus('Error opening setup page', 'error');
    }
  }
  
  async handlePasteToken() {
    try {
      const tokenInput = document.getElementById('tokenInput');
      const token = tokenInput?.value?.trim();
      
      if (!token) {
        this.showTemporaryStatus('Please enter a token', 'error');
        return;
      }
      
      // Validate token format (JWT should have 3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        this.showTemporaryStatus('Invalid token format', 'error');
        return;
      }
      
      // Store token and trigger sync
      await chrome.storage.local.set({ 'textgrow_user_token': token });
      
      // Update authentication state
      this.isAuthenticated = true;
      
      // Trigger immediate sync with backend
      const syncResult = await this.sendMessage('save-user-token', { token: token });
      
      if (syncResult && syncResult.success) {
        // Reload data after successful authentication
        await this.loadData();
        this.updateUI();
        
        // Clear the input
        tokenInput.value = '';
        
        this.showTemporaryStatus('Connected successfully!');
      } else {
        throw new Error('Failed to authenticate with token');
      }
      
    } catch (error) {
      console.error('Error pasting token:', error);
      this.showTemporaryStatus('Authentication failed. Please check your token.', 'error');
      
      // Reset authentication state on failure
      this.isAuthenticated = false;
      await chrome.storage.local.remove('textgrow_user_token');
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
      
      await this.sendMessage('sync-now');
      await this.loadData();
      this.updateUI();
      
      this.showTemporaryStatus('Shortcuts synced successfully');
    } catch (error) {
      console.error('Error syncing:', error);
      this.showTemporaryStatus('Sync failed', 'error');
    }
  }
  
  handleAdd() {
    const dashboardUrl = 'https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com';
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  editShortcut(shortcutId) {
    const dashboardUrl = `https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com?edit=${shortcutId}`;
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  showSettings() {
    document.getElementById('settingsPanel').style.display = 'flex';
  }
  
  hideSettings() {
    document.getElementById('settingsPanel').style.display = 'none';
  }
  
  async handleSettingChange(event) {
    const setting = event.target.id.replace('Toggle', '');
    const value = event.target.checked;
    
    const newSettings = { ...this.settings, [setting]: value };
    await this.sendMessage('update-settings', { settings: newSettings });
    
    this.settings = newSettings;
    this.showTemporaryStatus('Settings saved');
  }
  
  async handleTriggerDelayChange(event) {
    const value = parseInt(event.target.value);
    document.getElementById('triggerDelayValue').textContent = `${value}ms`;
    
    const newSettings = { ...this.settings, triggerDelay: value };
    await this.sendMessage('update-settings', { settings: newSettings });
    
    this.settings = newSettings;
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
    const dashboardUrl = 'https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com';
    chrome.tabs.create({ url: dashboardUrl });
  }
  
  openHelp() {
    const helpUrl = 'https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com/help';
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
      }, 2000);
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
  new TextGrowPopup();
});