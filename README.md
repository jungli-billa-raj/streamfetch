# StreamFetch

Fast Windows desktop downloader for YouTube and other platforms, powered by Electron, React, and `yt-dlp`.

## Why StreamFetch

StreamFetch focuses on reliability over flashy one-off downloads:
- Queue-based downloads with live per-item progress
- Pause, resume, cancel, and retry controls
- Smart fallback logic when a selected format fails
- Built-in `yt-dlp` updater from inside the app
- Optional FFmpeg merging for best quality output

## Key Features

- URL parsing for single videos and playlists
- Advanced format picker from extracted format IDs
- Playlist range controls (`start`, `end`, include, exclude)
- Per-download and global speed limits (`500K`, `2M`, `1.5M`)
- Download history and runtime logs
- Frameless desktop UI with custom window controls

## Tech Stack

- Electron 34
- React 18 + Vite 6
- Tailwind CSS 3
- `yt-dlp` + optional `ffmpeg`

## Project Structure

```text
streamfetch/
  electron/        # Main process + preload bridge
  src/             # React renderer
  bin/             # yt-dlp.exe and optional ffmpeg.exe
  release/         # Build outputs (ignored in git)
```

## Quick Start (Development)

```bash
npm install
npm run dev
```

## Run Built Renderer + Electron

```bash
npm run build:renderer
npm start
```

## Build Windows Installer + Portable

```bash
npm run build:win
```

Artifacts are created in `release/`:
- `StreamFetch Setup 1.0.0.exe` (installer)
- `StreamFetch 1.0.0.exe` (portable)

## Security Model

- `nodeIntegration: false`
- `contextIsolation: true`
- Strict preload bridge for allowed IPC channels only
- Download execution uses validated `spawn` arguments

## Required Local Binaries

For source-based development, place these files in `bin/`:
- `yt-dlp.exe` (required)
- `ffmpeg.exe` (optional, enables merged best-quality outputs)

These binaries are not committed to git to keep the repository lightweight.

## Releases

Install from GitHub Releases to avoid manual setup. Each release includes:
- Windows installer (`Setup .exe`)
- Portable executable (`.exe`)

## License

MIT
