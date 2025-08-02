## Product Requirements Document (PRD)

### 1. Introduction & Background
**Product Name**: TextGrow (working title)

**Purpose**: Enable users to define and use text shortcuts across Chrome and Android (and optionally iOS/Safari), streamlining repetitive typing by expanding abbreviations into longer text or prompts instantly.

**Target Users & Use Cases**:
- Professionals, writers, support agents who frequently insert templated text.  
- Teams sharing standardized responses or prompts across members.

---

### 2. Goals & Success Metrics
- **MVP Goal**: Deliver core text-expanding functionality on Chrome and Android with robust sync and organization.  
- **Metrics**:
  - Time saved per user (measured via expansion count).  
  - User retention (>70% weekly active usage).  
  - Number of shared-folder subscriptions.

---

### 3. Scope & MVP Features

**In-Scope (Phase 1 MVP)**:
1. **Core Expansion**  
   - **Chrome Extension**: inline autocomplete dropdown expansion.  
2. **Web Dashboard**  
   - Folder & tag management.  
   - Free-text search.  
   - Shortcut cards with “Copy to Clipboard.”  
3. **Android PWA**  
   - Installable web app.  
   - Browse/search shortcuts, tap to copy, toast confirmation.  
4. **User Accounts & Authentication**  
   - Supabase backend.  
   - OAuth sign-in: Google, Microsoft, Apple.  
   - Basic user profile (name, avatar, preferences).  
5. **Shortcut Management**  
   - Create, edit, delete shortcuts.  
   - Organize by **folders** and **tags**.  
   - Personal library capped at **500 shortcuts**.  
6. **Sharing & Collaboration**  
   - Share folders via public/export link (snapshot).  
   - Recipients can import into their own library.  

**Out-of-Scope (Post-MVP / Phase 2+)**:
- Native Android IME or accessibility-service inline expansion with undo snackbar.  
- Offline-first caching & background sync beyond browser defaults.  
- Real-time listeners for shared-folder propagation.  
- iOS/Safari extension.  
- Advanced analytics dashboard.  

---

### 4. User Stories
1. **As a user**, I want to type a predefined shortcut in Chrome and see my full text insert automatically, so I save typing time.  
2. **As a user**, I want a “Copy to Clipboard” button on the web dashboard for quick pasting on any device.  
3. **As a user**, I want an Android PWA I can install and use to copy shortcuts on my phone.  
4. **As an admin**, I want to organize shortcuts into folders and tag them for easy management.  
5. **As an admin**, I want to share a folder via link and allow teammates to import it.  
6. **As a user**, I want a search bar that filters my shortcuts by keyword, tag, or folder.

---

### 5. Functional Requirements

| ID    | Requirement                                                         | Priority |
|-------|---------------------------------------------------------------------|----------|
| FR-1  | Chrome extension autocomplete dropdown                              | High     |
| FR-2  | Web dashboard: CRUD shortcuts, folders, tags                        | High     |
| FR-3  | Web dashboard: free-text search and filter                          | High     |
| FR-4  | Web dashboard: “Copy to Clipboard” action                           | High     |
| FR-5  | Android PWA: installable, browse/search, tap-to-copy                | High     |
| FR-6  | OAuth sign-in (Google, Microsoft, Apple)                            | High     |
| FR-7  | Folder & tag management                                             | High     |
| FR-8  | Share folder export/import via link                                 | High     |
| FR-9  | Enforce personal shortcut cap (500)                                 | Medium   |

---

### 6. UX & UI Design
- **Dashboard Layout**:  
  - Left panel: folders & tag filters.  
  - Main grid: rounded-edge cards showing trigger (top-left), tags, and truncated content (first ~300 characters) with “Expand” toggle.  
- **Chrome UI**:  
  - Light, modern dropdown styling matching AI-app aesthetic; easy-to-read fonts.  
- **Android PWA UI**:  
  - Minimal “home screen” look.  
  - List/search of shortcuts with “Copy” button and “Copied!” toast.

---

### 7. Data Model & Architecture

All TextGrow data lives in a dedicated PostgreSQL schema called `text_grow` in Supabase.

#### Key Entities & Tables

| Table                                | Columns                                                                                                                                       |
|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| **text_grow.users**                  | `id` (UUID PK) <br> `email` (text, unique, not null) <br> `name` (text) <br> `avatar_url` (text) <br> `preferences` (jsonb) <br> `created_at`, `updated_at` (timestamps) |
| **text_grow.shortcuts**              | `id` (UUID PK) <br> `user_id` (UUID FK → text_grow.users.id) <br> `trigger` (text, not null) <br> `content` (text, not null) <br> `created_at`, `updated_at` (timestamps) |
| **text_grow.folders**                | `id` (UUID PK) <br> `user_id` (UUID FK → text_grow.users.id) <br> `name` (text, not null) <br> `created_at`, `updated_at` (timestamps)                                |
| **text_grow.tags**                   | `id` (UUID PK) <br> `name` (text, unique, not null) <br> `created_at`, `updated_at` (timestamps)                                                              |
| **text_grow.shortcut_tag_assignments** | `shortcut_id` (UUID FK → text_grow.shortcuts.id, PK) <br> `tag_id` (UUID FK → text_grow.tags.id, PK)                                                                                  |
| **text_grow.folder_shortcuts**       | `folder_id` (UUID FK → text_grow.folders.id, PK) <br> `shortcut_id` (UUID FK → text_grow.shortcuts.id, PK)                                                                       |
| **text_grow.shared_folders**         | `id` (UUID PK) <br> `folder_id` (UUID FK → text_grow.folders.id) <br> `share_link` (text, unique, not null) <br> `created_at` (timestamp) <br> `expires_at` (timestamp nullable) |
| **text_grow.shared_folder_users**    | `shared_folder_id` (UUID FK → text_grow.shared_folders.id, PK) <br> `user_id` (UUID FK → text_grow.users.id, PK)                                                               |

---

### 8. Technical Architecture
- **Frontend**  
  - **Web Dashboard**: React (Emergent.sh / Lovable)  
  - **Chrome Extension**: manifest v3 + React  
  - **Android PWA**: installable, service-worker–enabled

- **Backend**  
  - **Supabase**: Auth (OAuth), Database (`text_grow` schema)  
  - **Data Sync**: fetch on load or interval; no real-time sockets Phase 1

- **Search Path**  
  - Set `search_path` to `text_grow, public` so unqualified queries target TextGrow tables first.

---

### 9. Non-Functional Requirements
- **Performance**: Copy latency <50 ms for dashboard; autocomplete dropdown <100 ms.  
- **Security**: TLS in transit; row-level security as needed; encrypted storage.  
- **Scalability**: Support 10,000 users and 100,000 shortcuts.  
- **Reliability**: 99.5% uptime for auth and data services.

---

### 10. Roadmap & Timeline

| Phase            | Duration | Deliverables                                                 |
|------------------|----------|--------------------------------------------------------------|
| **Phase 1 (MVP)**| 4–6 weeks| Web Dashboard, Chrome Extension, Android PWA, Supabase setup|
| **Phase 2**      | 4–6 weeks| Native Android IME with inline expansion & undo snackbar     |
| **Phase 3**      | TBD      | iOS/Safari support; offline-first caching; real-time shares  |
