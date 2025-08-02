# TextGrow Project Structure

```text
TextGrow/
├── chrome-extension/       # Emergent’s generated extension code
│   ├── background.js
│   ├── content.js
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.css
│   └── …  
│
├── backend/                # Your serverless or API code (e.g. Supabase helpers)
│   └── …
│
├── frontend/               # Your PWA / dashboard code
│   ├── pages/
│   ├── components/
│   └── …
│
├── tests/                  # Unit or integration tests
│   └── …
│
├── docs/                   # Documentation
│   ├── PRD.md              # Full Product Requirements Document
│   └── README.md           # Detailed project overview & setup instructions
│
├── .cursor/                # Cursor-specific configuration
│   ├── rules/              # (Optional) custom Cursor code-mod or lint rules
│   └── settings.json       # Workspace settings
│
├── .emergent/              # Emergent.sh metadata (can be gitignored)
│
├── .gitignore
├── package.json
├── yarn.lock               # or package-lock.json
└── README.md               # Top-level intro & pointers to docs/
