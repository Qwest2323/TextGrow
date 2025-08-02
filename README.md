# TextGrow

A comprehensive text expansion tool that works seamlessly across Chrome extensions and Android devices, enabling users to define and use text shortcuts to streamline repetitive typing.

## Features

- **Chrome Extension**: Inline autocomplete dropdown for instant text expansion
- **Web Dashboard**: PWA for managing shortcuts, folders, and tags  
- **Android PWA**: Mobile access for browsing and copying shortcuts
- **Collaboration**: Share folders and sync across devices
- **Organization**: Folders, tags, and powerful search functionality

## Project Structure

This is a monorepo containing:

- **`chrome-extension/`** - Chrome extension code (Manifest v3 + React)
- **`frontend/`** - Web dashboard PWA (React)
- **`backend/`** - Supabase helpers and serverless functions
- **`tests/`** - Unit and integration tests
- **`docs/`** - Project documentation

## Documentation

- **[Product Requirements Document](docs/text_grow-PRD.md)** - Complete feature specifications and technical architecture
- **[Project Structure](docs/structure.md)** - Detailed breakdown of the codebase organization

## Quick Start

Each component has its own README with specific setup instructions:

- [Chrome Extension Setup](chrome-extension/README.md)
- [Frontend Setup](frontend/README.md)
- [Backend Setup](backend/README.md)

## Tech Stack

- **Frontend**: React, TailwindCSS, Supabase Auth
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Chrome Extension**: Manifest v3, React
- **Mobile**: Progressive Web App (PWA)

## Development

This project uses a monorepo structure. See individual component READMEs for detailed development instructions.