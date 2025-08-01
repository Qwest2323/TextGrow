# TextGrow Chrome Extension

## Overview
TextGrow Chrome Extension provides instant text expansion across all websites. Type your shortcuts and watch them expand into full text snippets automatically.

## Features
- **Instant Text Expansion**: Type shortcuts like `@email` and they expand to full content
- **Autocomplete Dropdown**: See suggestions as you type
- **Cross-Website Compatibility**: Works on all websites and text inputs
- **Real-time Sync**: Syncs with your TextGrow web dashboard
- **Customizable Settings**: Control expansion behavior and triggers

## Installation Instructions

### Method 1: Load Unpacked Extension (Development)
1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions/`
   - Or click Chrome menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder from your TextGrow project
   - The extension should appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in the Chrome toolbar
   - Find "TextGrow" and click the pin icon to keep it visible

### Method 2: Chrome Web Store (Future)
Once published, you'll be able to install directly from the Chrome Web Store.

## Setup & Authentication

1. **Click the TextGrow Icon**
   - Click the TextGrow icon in your Chrome toolbar
   - The popup will open

2. **Sign In**
   - Click "Sign In to TextGrow" 
   - You'll be taken to the TextGrow web dashboard
   - Sign in with your Google account or email/password

3. **Return to Extension**
   - After signing in, return to the extension popup
   - Your shortcuts should automatically sync

## How to Use

### Creating Shortcuts
1. Use the web dashboard to create shortcuts with triggers like:
   - `@email` → `john.doe@example.com`
   - `:signature` → `Best regards, John Doe`
   - `/address` → `123 Main St, City, State 12345`

### Using Shortcuts
1. **Type in any text field** on any website
2. **Start typing your trigger** (e.g., `@em`)
3. **See the dropdown** with matching shortcuts
4. **Press Tab or Enter** to expand
5. **Or continue typing** for exact match auto-expansion

### Keyboard Shortcuts
- **Arrow Keys**: Navigate dropdown suggestions
- **Tab/Enter**: Accept selected suggestion
- **Escape**: Close dropdown

## Settings

Access settings by clicking the gear icon in the extension popup:

- **Enable/Disable**: Turn TextGrow on/off
- **Show Dropdown**: Control autocomplete dropdown display
- **Auto-expand**: Automatically expand exact matches
- **Trigger Delay**: Adjust typing delay before showing suggestions

## Troubleshooting

### Extension Not Working
1. **Check if extension is enabled** in `chrome://extensions/`
2. **Refresh the webpage** you're trying to use it on
3. **Check authentication** - click extension icon to verify you're signed in

### Shortcuts Not Syncing
1. **Click sync button** in extension popup
2. **Check internet connection**
3. **Verify you're signed in** to the web dashboard

### Dropdown Not Appearing
1. **Check settings** - ensure "Show dropdown" is enabled
2. **Try typing slower** - adjust trigger delay in settings
3. **Check text input type** - works with standard text inputs and textareas

## Development

### File Structure
```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── content.js            # Content script (runs on web pages)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── styles.css            # Content script styles
├── icons/                # Extension icons
└── README.md             # This file
```

### Key Components
- **Background Script**: Handles API communication and data sync
- **Content Script**: Detects typing and handles text expansion
- **Popup**: Provides quick access to shortcuts and settings

## Privacy & Security
- **Local Storage**: Shortcuts cached locally for performance
- **Secure Communication**: All API calls use HTTPS
- **No Data Collection**: Extension only accesses what you explicitly create
- **Permission Scope**: Only requests necessary permissions

## Support
- **Web Dashboard**: https://91a36058-c40b-4267-a78a-bbae73b49e3d.preview.emergentagent.com
- **Create Shortcuts**: Use the web dashboard to manage your shortcuts
- **Report Issues**: Contact support through the web dashboard

## Version History
- **v1.0.0**: Initial release with core text expansion functionality

---

**TextGrow** - Expand your productivity, one shortcut at a time! 🚀