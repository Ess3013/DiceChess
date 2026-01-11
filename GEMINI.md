# DiceChess Project Context

## Project Overview
This is a software project for a game titled "DiceChess", built using the **Phaser 3** game framework and **Vite** for bundling. The project structure is based on the official Phaser Vite template.

**Key Technologies:**
*   **Phaser 3:** The core game engine (`phaser` dependency).
*   **Vite:** Build tool and development server (`vite` dependency).
*   **Node.js:** Runtime environment for development tools.

## Building and Running

### Prerequisites
*   Node.js must be installed.

### Commands
*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Start Development Server:**
    ```bash
    npm run dev
    ```
    This launches a local web server (typically at `http://localhost:8080`) with hot-reloading enabled.
*   **Build for Production:**
    ```bash
    npm run build
    ```
    This compiles the code and assets into the `dist/` directory, ready for deployment.

## Project Structure

*   **`src/`**: Contains the source code.
    *   `main.js`: Application bootstrap file.
    *   `game/`: Contains game-specific logic.
        *   `main.js`: Game configuration and entry point.
        *   `scenes/`: Directory for Phaser Scenes (e.g., `Game.js`).
*   **`public/`**: Static assets served directly.
    *   `assets/`: Game assets (images, audio).
    *   `style.css`: Global styles.
*   **`vite/`**: Vite configuration files.
    *   `config.dev.mjs`: Configuration for the development server.
    *   `config.prod.mjs`: Configuration for the production build.
*   **`index.html`**: The main HTML entry point.

## Development Conventions

*   **Asset Loading:**
    *   Assets can be imported directly in JavaScript files (e.g., `import logo from './assets/logo.png'`).
    *   Alternatively, static assets in `public/assets/` can be loaded via Phaser's loader using the string path (e.g., `this.load.image('bg', 'assets/bg.png')`).
*   **Module System:** The project uses ES Modules (`type: "module"` in `package.json`).
*   **Configuration:** Build settings are managed in the `vite/` directory, distinct from the standard `vite.config.js` location.
