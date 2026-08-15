import { contextBridge, ipcRenderer } from "electron";

export interface RaskladkaBridge {
  rustAvailable: () => Promise<boolean>;
  rustPath: () => Promise<string | null>;
  rustExec: (bundleJson: string) => Promise<string>;
  saveFile: (suggested: string, contents: string) => Promise<{ ok: boolean; path?: string }>;
  openFile: () => Promise<{ ok: boolean; path?: string; contents?: string }>;
  print: () => Promise<void>;
}

const api: RaskladkaBridge = {
  rustAvailable: () => ipcRenderer.invoke("rust:available"),
  rustPath: () => ipcRenderer.invoke("rust:path"),
  rustExec: (bundleJson) => ipcRenderer.invoke("rust:exec", bundleJson),
  saveFile: (suggested, contents) => ipcRenderer.invoke("file:save", suggested, contents),
  openFile: () => ipcRenderer.invoke("file:open"),
  print: () => ipcRenderer.invoke("app:print"),
};

contextBridge.exposeInMainWorld("raskladka", api);
