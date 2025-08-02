// TextGrow Chrome Extension - Content Script
console.log('🚀 TextGrow content script loaded on:', window.location.hostname);
console.log('🚀 TextGrow version: 1.0.0 - Debug Mode');

class TextGrowExpander {
  constructor() {
    this.shortcuts = [];
    this.settings = {};
    this.isEnabled = true;
    this.currentElement = null;
    this.dropdownElement = null;
    this.matchedShortcuts = [];
    this.selectedIndex = -1;
    this.typingTimer = null;
    
    this.init();
  }
  
  async init() {
    await this.loadShortcuts();
    await this.loadSettings();
    this.setupEventListeners();
    this.setupMessageListener();
    console.log(`TextGrow initialized with ${this.shortcuts.length} shortcuts`);
  }
  
  async loadShortcuts() {
    try {
      const shortcuts = await this.sendMessage('get-shortcuts');
      this.shortcuts = shortcuts || [];
      console.log('Content script loaded shortcuts:', this.shortcuts);
    } catch (error) {
      console.error('Error loading shortcuts:', error);
    }
  }
  
  async loadSettings() {
    try {
      const settings = await this.sendMessage('get-settings');
      this.settings = settings || {};
      this.isEnabled = this.settings.enabled !== false;
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }
  
  setupEventListeners() {
    document.addEventListener('input', this.handleInput.bind(this), true);
    document.addEventListener('keydown', this.handleKeyDown.bind(this), true);
    document.addEventListener('click', this.handleClick.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);
  }
  
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'shortcuts-updated':
          this.shortcuts = message.data || [];
          console.log(`Shortcuts updated: ${this.shortcuts.length} shortcuts`);
          break;
          
        case 'settings-updated':
          this.settings = message.data || {};
          this.isEnabled = this.settings.enabled !== false;
          if (!this.isEnabled) {
            this.hideDropdown();
          }
          break;
      }
    });
  }
  
  handleInput(event) {
    if (!this.isEnabled || !this.isTextInput(event.target)) {
      return;
    }
    
    this.currentElement = event.target;
    
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    this.typingTimer = setTimeout(() => {
      this.checkForShortcuts();
    }, this.settings.triggerDelay || 500);
  }
  
  handleKeyDown(event) {
    if (!this.isEnabled || !this.dropdownElement) {
      return;
    }
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectNext();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.selectPrevious();
        break;
        
      case 'Enter':
      case 'Tab':
        if (this.selectedIndex >= 0) {
          event.preventDefault();
          this.expandShortcut(this.matchedShortcuts[this.selectedIndex]);
        }
        break;
        
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }
  
  handleClick(event) {
    if (this.dropdownElement && !this.dropdownElement.contains(event.target)) {
      this.hideDropdown();
    }
  }
  
  handleBlur(event) {
    setTimeout(() => {
      if (event.target === this.currentElement) {
        this.hideDropdown();
      }
    }, 200);
  }
  
  isTextInput(element) {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    const type = element.type?.toLowerCase();
    
    if (tagName === 'input' && ['text', 'email', 'search', 'url', 'tel'].includes(type)) {
      return true;
    }
    
    if (tagName === 'textarea') {
      return true;
    }
    
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }
  
  checkForShortcuts() {
    if (!this.currentElement || !this.shortcuts.length) {
      console.log('No element or shortcuts:', this.currentElement, this.shortcuts.length);
      return;
    }
    
    const text = this.getInputText();
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1];
    
    console.log('Checking shortcuts for:', lastWord, 'Available shortcuts:', this.shortcuts.map(s => s.trigger));
    
    if (!lastWord) {
      this.hideDropdown();
      return;
    }
    
    this.matchedShortcuts = this.shortcuts.filter(shortcut => 
      shortcut.trigger.toLowerCase().startsWith(lastWord.toLowerCase())
    );
    
    console.log('Matched shortcuts:', this.matchedShortcuts);
    
    if (this.matchedShortcuts.length > 0) {
      const exactMatch = this.matchedShortcuts.find(shortcut => 
        shortcut.trigger.toLowerCase() === lastWord.toLowerCase()
      );
      
      if (exactMatch && this.settings.autoExpand) {
        console.log('Auto-expanding:', exactMatch);
        this.expandShortcut(exactMatch);
      } else if (this.settings.showDropdown) {
        console.log('Showing dropdown for:', this.matchedShortcuts);
        this.showDropdown();
      }
    } else {
      this.hideDropdown();
    }
  }
  
  getInputText() {
    if (!this.currentElement) return '';
    
    if (this.currentElement.contentEditable === 'true') {
      return this.currentElement.textContent || '';
    } else {
      return this.currentElement.value || '';
    }
  }
  
  setInputText(text) {
    if (!this.currentElement) return;
    
    if (this.currentElement.contentEditable === 'true') {
      this.currentElement.textContent = text;
    } else {
      this.currentElement.value = text;
    }
    
    const event = new Event('input', { bubbles: true });
    this.currentElement.dispatchEvent(event);
  }
  
  expandShortcut(shortcut) {
    if (!this.currentElement || !shortcut) return;
    
    const currentText = this.getInputText();
    const words = currentText.split(/\s+/);
    
    words[words.length - 1] = shortcut.content;
    const newText = words.join(' ');
    
    this.setInputText(newText);
    this.hideDropdown();
    
    this.currentElement.focus();
    if (this.currentElement.setSelectionRange) {
      const length = newText.length;
      this.currentElement.setSelectionRange(length, length);
    }
    
    console.log(`Expanded "${shortcut.trigger}" to "${shortcut.content}"`);
  }
  
  showDropdown() {
    if (!this.matchedShortcuts.length || !this.currentElement) return;
    
    this.hideDropdown();
    
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.className = 'textgrow-dropdown';
    this.dropdownElement.innerHTML = this.generateDropdownHTML();
    
    this.positionDropdown();
    document.body.appendChild(this.dropdownElement);
    this.addDropdownListeners();
    
    this.selectedIndex = 0;
    this.updateSelection();
  }
  
  hideDropdown() {
    if (this.dropdownElement) {
      this.dropdownElement.remove();
      this.dropdownElement = null;
      this.selectedIndex = -1;
    }
  }
  
  generateDropdownHTML() {
    return `
      <div class="textgrow-dropdown-content">
        ${this.matchedShortcuts.map((shortcut, index) => `
          <div class="textgrow-dropdown-item" data-index="${index}">
            <div class="textgrow-trigger">${shortcut.trigger}</div>
            <div class="textgrow-content">${this.truncateText(shortcut.content, 50)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  positionDropdown() {
    if (!this.dropdownElement || !this.currentElement) return;
    
    const rect = this.currentElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    this.dropdownElement.style.cssText = `
      position: absolute;
      top: ${rect.bottom + scrollTop + 5}px;
      left: ${rect.left + scrollLeft}px;
      min-width: ${Math.max(rect.width, 200)}px;
      z-index: 10000;
    `;
  }
  
  addDropdownListeners() {
    if (!this.dropdownElement) return;
    
    const items = this.dropdownElement.querySelectorAll('.textgrow-dropdown-item');
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        this.expandShortcut(this.matchedShortcuts[index]);
      });
      
      item.addEventListener('mouseenter', () => {
        this.selectedIndex = index;
        this.updateSelection();
      });
    });
  }
  
  selectNext() {
    if (this.selectedIndex < this.matchedShortcuts.length - 1) {
      this.selectedIndex++;
      this.updateSelection();
    }
  }
  
  selectPrevious() {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateSelection();
    }
  }
  
  updateSelection() {
    if (!this.dropdownElement) return;
    
    const items = this.dropdownElement.querySelectorAll('.textgrow-dropdown-item');
    items.forEach((item, index) => {
      if (index === this.selectedIndex) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
  
  sendMessage(type, data = null) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...data }, resolve);
    });
  }
}

// Initialize TextGrow
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new TextGrowExpander();
  });
} else {
  new TextGrowExpander();
}