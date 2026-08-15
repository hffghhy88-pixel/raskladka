import { useMemo, useState } from "react";
import { calcMenu } from "../domain/menuCalc";
import { ADULT_NORM, SCHOOL_NORM, coverage, formatNutrition } from "../domain/nutrition";
import { formatMassGrams, formatMoney } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, Stat } from "../components/ui";

export function ReportsPage() {
  const { workspace, selectedMenuId, selectMenu } = useWorkspace();
  const [school, setSchool] = useState(false);
  const menu = workspace.menus.find((m) => m.id === selectedMenuId) ?? workspace.menus[0];
  const calc = useMemo(() => {
    if (!menu) return null;
    try {
      return calcMenu(menu, workspace.dishes, workspace.products);
    } catch {
      return null;
    }
  }, [menu, workspace]);
  const norm = school ? SCHOOL_NORM : ADULT_NORM;

  const waste = calc
    ? {
        cold: calc.days.reduce(
          (s, d) => s + d.slots.reduce((ss, sl) => ss + sl.calc.totals.grossG - sl.calc.totals.netG, 0),
          0,
        ),
        hot: calc.days.reduce(
          (s, d) => s + d.slots.reduce((ss, sl) => ss + sl.calc.totals.netG - sl.calc.totals.yieldG, 0),
          0,
        ),
        finish: calc.days.reduce((s, d) => s + d.slots.reduce((ss, sl) => ss + sl.calc.finishingLossG, 0), 0),
      }
    : null;

  return (
    <>
      <PageHead title="Отчёты" hint="КБЖУ на гостя, покрытие нормы, потери на очистке и жарке">
        <select value={menu?.id ?? ""} onChange={(e) => selectMenu(e.target.value)}>
          {workspace.menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="row">
          <input type="checkbox" checked={school} onChange={(e) => setSchool(e.target.checked)} />
          школьная норма
        </label>
      </PageHead>
      {calc && waste ? (
        <>
          <div className="grid grid-4">
            <Stat label="Брутто" value={formatMassGrams(calc.totals.grossG)} />
            <Stat label="Выход" value={formatMassGrams(calc.finishedYieldG)} />
            <Stat label="Холод. потери" value={formatMassGrams(waste.cold)} />
            <Stat label="Тепл. потери" value={formatMassGrams(Math.max(0, waste.hot))} />
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>День</th>
                  <th className="num">На гостя</th>
                  <th>КБЖУ</th>
                  <th className="num">ккал %</th>
                  <th className="num">₽ / гость</th>
                </tr>
              </thead>
              <tbody>
                {calc.days.map((day) => {
                  const cov = coverage(day.perGuestNutrition, norm);
                  return (
                    <tr key={day.dayId}>
                      <td>{day.dateLabel}</td>
                      <td className="num">{formatMassGrams(day.perGuestYieldG)}</td>
                      <td>{formatNutrition(day.perGuestNutrition)}</td>
                      <td className="num">{cov.kcalPct.toFixed(0)}%</td>
                      <td className="num">{formatMoney(day.perGuestCost)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="muted">
              Норма: {norm.kcal} ккал · Б {norm.proteinG} · Ж {norm.fatG} · У {norm.carbsG}. Потери на подачу{" "}
              {formatMassGrams(waste.finish)}.
            </p>
          </div>
        </>
      ) : (
        <div className="card">Нет данных для отчёта.</div>
      )}
    </>
  );
}
