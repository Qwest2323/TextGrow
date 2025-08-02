# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TextGrow is a comprehensive text expansion tool that works across Chrome extensions and Android devices via PWA. The project enables users to define and use text shortcuts to streamline repetitive typing.

**Core Architecture**: Three-component system:
- **Chrome Extension**: Manifest v3 extension with inline autocomplete dropdown for text expansion
- **Web Dashboard**: React PWA for managing shortcuts, folders, and tags with authentication
- **Backend**: Supabase-based backend with PostgreSQL, authentication, and real-time sync

## Development Commands

This is a monorepo with workspace-based architecture. All commands should be run from the root directory (`/TextGrow/`).

### Frontend Development
```bash
npm run dev:frontend        # Start React development server (localhost:3000)
cd frontend && npm start    # Alternative direct command
npm run build:frontend      # Build for production
```

### Chrome Extension Development  
```bash
npm run dev:extension       # Development build with watch mode
npm run build:extension     # Production build for Chrome Web Store
```

### Combined Operations
```bash
npm run build:all          # Build both frontend and extension
npm run test               # Run frontend tests (via craco test)
npm run lint               # Lint both frontend and extension code
npm run format            # Format code using Prettier
```

### Backend Development
The backend uses Python with FastAPI and Supabase:
```bash
cd backend
pip install -r requirements.txt
# Backend is primarily Supabase functions and helpers
```

## Architecture Details

### Monorepo Structure
- Uses npm workspaces with `frontend` and `chrome-extension` as workspace packages
- Root `package.json` coordinates build and development scripts across components
- Each component maintains its own dependencies and can be developed independently

### Authentication & Data Flow
- **Authentication**: Supabase Auth with Google OAuth integration
- **Data Storage**: PostgreSQL via Supabase with real-time subscriptions
- **Sync Strategy**: Chrome extension syncs shortcuts from Supabase, cached locally for performance
- **Cross-platform**: Web dashboard and Chrome extension share same data source

### Chrome Extension Architecture
- **Manifest v3**: Service worker background script + content scripts
- **Content Script**: Detects typing patterns, shows autocomplete dropdown, handles expansion
- **Background Script**: Manages API communication and data synchronization with Supabase
- **Popup Interface**: Quick access to shortcuts, settings, and authentication status

### Frontend Stack
- **React 19** with Create React App (customized via CRACO)
- **TailwindCSS** for styling with PostCSS configuration
- **React Router v7** for navigation
- **Supabase Client** for authentication and data operations
- **Lucide React** for icons, **React Hot Toast** for notifications

## Key Files and Locations

### Chrome Extension Core Files
- `chrome-extension/manifest.json` - Extension configuration and permissions
- `chrome-extension/content.js` - Text expansion logic and DOM interaction
- `chrome-extension/background.js` - API communication and sync management
- `chrome-extension/popup.html/js/css` - Extension popup interface

### Frontend Core Files  
- `frontend/src/App.js` - Main application router and layout
- `frontend/src/components/` - React components (Auth, Dashboard, ShortcutList, etc.)
- `frontend/src/supabaseClient.js` - Supabase configuration and client setup
- `frontend/craco.config.js` - Custom React build configuration
- `frontend/tailwind.config.js` - TailwindCSS configuration

### Backend Files
- `backend/server.py` - FastAPI server (supplementary to Supabase)
- `backend/requirements.txt` - Python dependencies

## Development Workflow

### Setting Up Development Environment
1. Install dependencies: `npm install` (installs for all workspace packages)
2. Start frontend: `npm run dev:frontend` 
3. Load Chrome extension: Load unpacked from `chrome-extension/` directory
4. Configure Supabase connection in both frontend and extension

### Testing Chrome Extension
- Load unpacked extension in Chrome Developer Mode
- Extension works on all websites with `<all_urls>` permission
- Test text expansion in various input fields and text areas
- Verify sync between web dashboard and extension

### Key Integration Points
- **Authentication State**: Shared between web dashboard and Chrome extension via Supabase session
- **Data Synchronization**: Real-time updates using Supabase subscriptions
- **Shortcut Storage**: PostgreSQL with folders, tags, and sharing capabilities
- **Cross-origin Communication**: Extension communicates with Supabase backend via host permissions

## Production Considerations

### Chrome Extension Publishing
- Build with `npm run build:extension`
- Extension requires host permissions for Supabase endpoints
- Manifest v3 compliance for Chrome Web Store submission

### Web Dashboard Deployment
- Build with `npm run build:frontend` 
- PWA-ready with offline capabilities
- Requires HTTPS for PWA installation and service worker functionality