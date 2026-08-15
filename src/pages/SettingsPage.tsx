import { useEffect, useState } from "react";
import { exportWorkspace } from "../store/persist";
import { probeRust, rustCommand, type RustStatus } from "../domain/rustBridge";
import { validateWorkspace } from "../domain/validate";
import { useWorkspace } from "../store/context";
import { PageHead } from "../components/ui";

export function SettingsPage() {
  const { workspace, setTitle, setCost, reset, importJson, simpleMode, setSimpleMode } = useWorkspace();
  const [rust, setRust] = useState<RustStatus>({ available: false, path: null });
  const [rustLog, setRustLog] = useState("");
  const report = validateWorkspace(workspace.products, workspace.dishes, workspace.menus);

  useEffect(() => {
    void probeRust().then(setRust);
  }, []);

  return (
    <>
      <PageHead title="Настройки" hint="Кухня, наценка, обмен файлами и проверка Rust-движка" />
      <div className="grid grid-2">
        <div className="card">
          <h3>Кухня</h3>
          <label className="field">
            <span>Название</span>
            <input value={workspace.title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="row" style={{ marginTop: 12 }}>
            <input type="checkbox" checked={simpleMode} onChange={(e) => setSimpleMode(e.target.checked)} />
            простой режим (крупные кнопки, меньше разделов)
          </label>
          <div className="form-grid" style={{ marginTop: 12 }}>
            <label className="field">
              <span>Наценка, %</span>
              <input
                type="number"
                value={workspace.cost.markupPercent}
                onChange={(e) => setCost({ ...workspace.cost, markupPercent: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>Накладные, %</span>
              <input
                type="number"
                value={workspace.cost.overheadPercent}
                onChange={(e) => setCost({ ...workspace.cost, overheadPercent: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              <span>НДС, %</span>
              <input
                type="number"
                value={workspace.cost.vatPercent}
                onChange={(e) => setCost({ ...workspace.cost, vatPercent: Number(e.target.value) })}
              />
            </label>
          </div>
          <h3 style={{ marginTop: 22 }}>Копия на флешку</h3>
          <p className="muted">Сохраните кухню файлом. Потом можно открыть на другом компьютере.</p>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn primary"
              onClick={() => {
                const json = exportWorkspace(workspace);
                if (window.raskladka) void window.raskladka.saveFile("raskladka-kopiya.json", json);
                else {
                  const blob = new Blob([json], { type: "application/json" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = "raskladka-kopiya.json";
                  a.click();
                }
              }}
            >
              Сохранить на флешку
            </button>
            <button
              className="btn"
              onClick={async () => {
                if (window.raskladka) {
                  const file = await window.raskladka.openFile();
                  if (file.ok && file.contents) importJson(file.contents);
                  return;
                }
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".json,application/json";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  void file.text().then((raw) => importJson(raw));
                };
                input.click();
              }}
            >
              Открыть с флешки
            </button>
            <button className="btn danger" onClick={reset}>
              Сбросить к демо
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Rust-движок</h3>
          <p className={rust.available ? "ok" : "warn"}>
            {rust.available ? `доступен ${rust.version ?? ""}` : rust.error ?? "не найден"}
          </p>
          <p className="muted mono">{rust.path ?? "—"}</p>
          <p className="muted">
            Интерфейс считает на TypeScript мгновенно. Rust — эталонный движок техкарт: соберите его командой
            `npm run rust:build` и нажмите проверку.
          </p>
          <button
            className="btn primary"
            onClick={async () => {
              try {
                const result = await rustCommand(workspace, { cmd: "validate" });
                setRustLog(JSON.stringify(result, null, 2));
              } catch (err) {
                setRustLog(err instanceof Error ? err.message : String(err));
              }
            }}
          >
            Проверить workspace в Rust
          </button>
          {rustLog ? <pre className="mono">{rustLog}</pre> : null}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Валидация</h3>
        <p className={report.ok ? "ok" : "warn"}>{report.ok ? "ошибок нет" : `${report.errors.length} ошибок`}</p>
        {report.errors.map((e) => (
          <p key={e} className="warn">
            {e}
          </p>
        ))}
        {report.warnings.slice(0, 8).map((w) => (
          <p key={w} className="muted">
            {w}
          </p>
        ))}
      </div>
    </>
  );
}
