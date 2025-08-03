@ -1,134 +0,0 @@
# TextGrow Project Structure

```text
TextGrow/
├── chrome-extension/       # Manifest v3 Chrome Extension
│   ├── background.js       # Service worker with Supabase integration & sync
│   ├── content.js          # Text expansion logic and DOM interaction
│   ├── manifest.json       # Extension config with localhost permissions
│   ├── popup.html          # Extension popup interface
│   ├── popup.js            # Popup logic with modern UI handlers
│   ├── popup.css           # Modern button styling with animations
│   └── styles.css          # Content script styling
│
├── backend/                # Supabase helpers and utilities
│   ├── server.py           # FastAPI supplementary server
│   └── requirements.txt    # Python dependencies
│
├── frontend/               # React PWA Dashboard
│   ├── public/             # Static assets and PWA manifest
│   │   ├── index.html      # Main HTML (TextGrow branded)
│   │   └── manifest.json   # PWA manifest
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js         # Main dashboard with search
│   │   │   ├── ShortcutList.js      # Shortcut display and management
│   │   │   ├── SimpleShortcutForm.js # Form with auto-sync
│   │   │   ├── FolderManager.js     # Folder CRUD (Supabase)
│   │   │   ├── TagManager.js        # Tag CRUD (Supabase)
│   │   │   ├── ShareManager.js      # Sharing functionality
│   │   │   └── Auth.js              # Authentication components
│   │   ├── supabaseClient.js        # Configured for text_grow schema
│   │   ├── App.js                   # Main app router
│   │   └── index.js                 # React entry point
│   ├── craco.config.js     # Custom React build configuration
│   ├── tailwind.config.js  # TailwindCSS configuration
│   └── package.json        # Frontend dependencies
│
├── tests/                  # Test files
│   ├── backend_test.py     # Backend API tests
│   └── test_result.md      # Test documentation
│
├── docs/                   # Project documentation
│   ├── images/             # UI mockups and screenshots
│   │   ├── desktop_view.png
│   │   ├── mobile_view.png
│   │   └── tablet_view.png
│   ├── text_grow-PRD.md    # Product Requirements Document
│   ├── structure.md        # This file - project structure
│   └── project-log.md      # Development history and changes
│
├── .cursor/                # Cursor IDE configuration
│   ├── rules/              # Custom development rules
│   └── settings.json       # Workspace settings and preferences
│
├── .emergent/              # Emergent.sh metadata
│
├── CLAUDE.md               # Instructions for Claude Code assistant
├── .gitignore              # Git ignore patterns
├── package.json            # Monorepo workspace configuration
├── yarn.lock               # Dependency lock file
└── README.md               # Project overview and quick start

## Key Architecture Details

### Database Schema
- **Schema**: `text_grow` (not public)
- **Tables**: shortcuts, folders, tags with proper user_id filtering
- **Authentication**: Supabase Auth with JWT tokens
- **RLS**: Row Level Security enabled for user data isolation

### Chrome Extension (Manifest v3)
- **Background Script**: Service worker with periodic sync (2-minute intervals)
- **Content Script**: Text expansion with dropdown selection preference
- **Popup**: Modern UI for shortcut management and settings
- **Permissions**: localhost:3000 and Supabase endpoints
- **Storage**: Local caching with chrome.storage.local

### Frontend (React PWA)
- **Framework**: React 19 with Create React App + CRACO
- **Styling**: TailwindCSS with custom component styles
- **Routing**: React Router v7 for navigation
- **State**: Local component state with Supabase real-time
- **Icons**: Lucide React, Notifications: React Hot Toast

### Data Flow
1. Dashboard creates/edits shortcuts → Supabase
2. Extension syncs periodically from Supabase → Local cache
3. Content script reads from local cache for expansion
4. Auto-sync triggers after dashboard changes

### Security Features
- User data isolation via JWT token parsing
- Proper schema access configuration
- RLS policies in Supabase
- Input validation and sanitization

### Development Commands

#### Frontend Development
```bash
npm run dev:frontend        # Start React development server (localhost:3000)
cd frontend && npm start    # Alternative direct command
npm run build:frontend      # Build for production
```

#### Chrome Extension Development  
```bash
npm run dev:extension       # Development build with watch mode
npm run build:extension     # Production build for Chrome Web Store
```

#### Combined Operations
```bash
npm run build:all          # Build both frontend and extension
npm run test               # Run frontend tests (via craco test)
npm run lint               # Lint both frontend and extension code
npm run format            # Format code using Prettier
```

### Key Integration Points
- **Authentication State**: Shared between web dashboard and Chrome extension via Supabase session
- **Data Synchronization**: Real-time updates using Supabase subscriptions and periodic sync
- **Shortcut Storage**: PostgreSQL with folders, tags, and sharing capabilities
- **Cross-origin Communication**: Extension communicates with Supabase backend via host permissions

### Current Implementation Status (2025-08-02)
- ✅ Chrome extension fully functional with proper sync
- ✅ Security vulnerability resolved (user data isolation)
- ✅ Search functionality working
- ✅ Folders and Tags pages functional  
- ✅ Modern UI styling implemented
- ✅ Auto-sync after shortcut creation
- ✅ Proper database schema configuration
- ✅ Branding cleanup completed