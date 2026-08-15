/// <reference types="vite/client" />

import type { RaskladkaBridge } from "../electron/preload";

declare global {
  interface Window {
    raskladka?: RaskladkaBridge;
  }
}

export {};
