import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const isDev = !app.isPackaged;

function rustBinaryPath(): string | null {
  const exe = process.platform === "win32" ? "raskladka-engine.exe" : "raskladka-engine";
  const candidates = [
    path.join(process.resourcesPath, "bin", exe),
    path.join(app.getAppPath(), "rust", "target", "release", exe),
    path.join(__dirname, "..", "rust", "target", "release", exe),
    path.join(process.cwd(), "rust", "target", "release", exe),
    path.join(process.cwd(), "rust", "target", "debug", exe),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f4efe4",
    title: "Раскладка",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else if (isDev) {
    void win.loadURL("http://127.0.0.1:5173");
  } else {
    void win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}

function runRust(bundleJson: string): Promise<string> {
  const bin = rustBinaryPath();
  if (!bin) {
    return Promise.reject(new Error("Rust-движок не собран. Выполните npm run rust:build"));
  }
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ["--stdin"], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || stdout.trim() || `код ${code}`));
    });
    child.stdin.write(bundleJson, "utf8");
    child.stdin.end();
  });
}

app.whenReady().then(() => {
  ipcMain.handle("rust:available", () => Boolean(rustBinaryPath()));
  ipcMain.handle("rust:path", () => rustBinaryPath());
  ipcMain.handle("rust:exec", async (_event, bundleJson: string) => runRust(bundleJson));

  ipcMain.handle("file:save", async (_event, suggested: string, contents: string) => {
    const win = BrowserWindow.getFocusedWindow();
    const saveOpts = {
      defaultPath: suggested,
      filters: [
        { name: "Все файлы", extensions: ["json", "csv", "md", "html"] },
        { name: "JSON", extensions: ["json"] },
        { name: "Excel CSV", extensions: ["csv"] },
        { name: "Markdown", extensions: ["md"] },
      ],
    };
    const result = win ? await dialog.showSaveDialog(win, saveOpts) : await dialog.showSaveDialog(saveOpts);
    if (result.canceled || !result.filePath) return { ok: false };
    fs.writeFileSync(result.filePath, contents, "utf8");
    return { ok: true, path: result.filePath };
  });

  ipcMain.handle("file:open", async () => {
    const win = BrowserWindow.getFocusedWindow();
    const openOpts = {
      filters: [{ name: "JSON", extensions: ["json"] }],
      properties: ["openFile" as const],
    };
    const result = win ? await dialog.showOpenDialog(win, openOpts) : await dialog.showOpenDialog(openOpts);
    if (result.canceled || !result.filePaths[0]) return { ok: false };
    const contents = fs.readFileSync(result.filePaths[0], "utf8");
    return { ok: true, path: result.filePaths[0], contents };
  });

  ipcMain.handle("app:print", async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;
    win.webContents.print({ silent: false, printBackground: true });
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
