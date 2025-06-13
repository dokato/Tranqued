# Tranqueditor 

A simple Electron app to help you find tranquility and focus when you write.

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the app from src/ directory:
   ```sh
   npx electron .
   ```

## Testing

Running tests:
   ```sh
   cd src/
   npm test
   ```

## Building a standalone app

To build a standalone macOS application (DMG or .app) using Electron:

1. Make sure you have all dependencies installed:
   ```sh
   cd src/
   npm install
   ```

2. Build the app using electron-builder:
   ```sh
   npm run dist
   ```

   This will create a `dist/` directory in `src/`.

3. Distribute the `.dmg` or `.app` file to other macOS users.

> **Note:**
> - Building for macOS requires Xcode command line tools to be installed.

## Features
- Pomodoro-style timer
- Simple, clean text editor
- Desktop app for macOS (Electron)
