# 🎵 Human Music Player

A premium, modern audio streaming application for authentic human music. This project features a high-performance frontend built with React, Vite, and PWA integration, backed by a lightweight ASP.NET Core host that serves the application and facilitates standalone desktop integration.

---

## 🚀 Tech Stack

- **Frontend**: React (v19), Vite (v8), and `vite-plugin-pwa` for offline capabilities and PWA functionality.
- **Backend Host**: ASP.NET Core (net10.0) Minimal API, serving compiled static assets from the `wwwroot` directory with fallback routing for React Router.
- **Desktop App Shell**: Automatic app-mode launch capability utilizing Microsoft Edge (`msedge --app=...`) or the default system browser.

---

## 📁 Repository Structure

```
Music App/
├── src/                  # React Frontend source code (components, styles, hooks)
├── public/               # Static public assets (icons, manifest resources)
├── Program.cs            # ASP.NET Core host setup & browser launcher
├── MusicApp.csproj       # .NET Web Project definition with auto-SPA-compilation
├── vite.config.js        # Vite build configuration (targets wwwroot)
├── eslint.config.js      # Linting configuration
├── package.json          # Node dependencies and scripts
└── .gitignore            # Git exclusions for both Node and .NET
```

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [.NET SDK 10.0](https://dotnet.microsoft.com/download)

### Run the App (Full Stack)

To run the entire app using the ASP.NET Core host (which automatically builds the React SPA and launches the desktop app window):

1. Open your terminal in the root directory.
2. Run:
   ```bash
   dotnet run
   ```
3. The server will start on `http://localhost:5000` and automatically dispatch a standalone desktop browser window.

### Run the Frontend Developer Server (HMR)

If you are developing the frontend and want fast Hot Module Replacement (HMR):

1. Install frontend dependencies:
   ```bash
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
