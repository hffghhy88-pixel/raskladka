import { useMemo, useState } from "react";
import { calcDish, portionsFromStock } from "../domain/calc";
import { formatNutrition } from "../domain/nutrition";
import { convert, formatMassGrams, formatMoney, formatRu, parseUnit, toGrams, UNIT_META } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, Stat, WeightStrip } from "../components/ui";
import type { Unit } from "../types/models";

export function CalculatorPage() {
  const { workspace } = useWorkspace();
  const [dishId, setDishId] = useState(workspace.dishes[0]?.id ?? "");
  const [portions, setPortions] = useState(20);
  const [stockProduct, setStockProduct] = useState(workspace.products[0]?.id ?? "");
  const [stockG, setStockG] = useState(2000);
  const [fromUnit, setFromUnit] = useState<Unit>("tablespoon");
  const [toUnit, setToUnit] = useState<Unit>("gram");
  const [convValue, setConvValue] = useState(2);
  const [density, setDensity] = useState(0.91);

  const dish = workspace.dishes.find((d) => d.id === dishId);
  const calc = useMemo(() => {
    if (!dish) return null;
    try {
      return calcDish(dish, workspace.products, portions);
    } catch {
      return null;
    }
  }, [dish, workspace.products, portions]);

  let fromStock = "";
  try {
    if (dish) {
      const n = portionsFromStock(dish, workspace.products, stockProduct, stockG);
      fromStock = `${formatRu(n, 1, "порц.")} «${dish.name}»`;
    }
  } catch (err) {
    fromStock = err instanceof Error ? err.message : String(err);
  }

  let converted = "—";
  try {
    const value = convert(convValue, fromUnit, toUnit, { densityGPerMl: density, pieceWeightG: 100 });
    const grams = toGrams(convValue, fromUnit, { densityGPerMl: density, pieceWeightG: 100 });
    converted = `${formatRu(value, 3, UNIT_META[toUnit].code)}  ·  ${formatMassGrams(grams)}`;
  } catch (err) {
    converted = err instanceof Error ? err.message : String(err);
  }

  return (
    <>
      <PageHead
        title="Калькулятор"
        hint="Масштаб порций, обратный счёт от запаса, перевод ложек и стаканов в граммы"
      />
      <div className="grid grid-2">
        <div className="card">
          <h3>Вес блюда на порции</h3>
          <div className="form-grid">
            <label className="field wide">
              <span>Блюдо</span>
              <select value={dishId} onChange={(e) => setDishId(e.target.value)}>
                {workspace.dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Порций</span>
              <input type="number" value={portions} onChange={(e) => setPortions(Number(e.target.value))} />
            </label>
          </div>
          {calc ? (
            <>
              <div style={{ margin: "14px 0" }}>
                <WeightStrip weights={calc.totals} finished={calc.finishedYieldG} />
              </div>
              <div className="grid grid-3">
                <Stat label="Порция" value={formatMassGrams(calc.portionYieldG)} />
                <Stat label="Себест. порции" value={formatMoney(calc.costPerPortion)} />
                <Stat label="КБЖУ порции" value={`${Math.round(calc.nutritionPerPortion.kcal)}`} hint={formatNutrition(calc.nutritionPerPortion)} />
              </div>
              <table className="data" style={{ marginTop: 14 }}>
                <thead>
                  <tr>
                    <th>Продукт</th>
                    <th className="num">Брутто</th>
                    <th className="num">Нетто</th>
                    <th className="num">Выход</th>
                    <th className="num">₽</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.lines.map((line) => (
                    <tr key={line.lineId}>
                      <td>{line.productName}</td>
                      <td className="num">{formatMassGrams(line.weights.grossG)}</td>
                      <td className="num">{formatMassGrams(line.weights.netG)}</td>
                      <td className="num">{formatMassGrams(line.weights.yieldG)}</td>
                      <td className="num">{formatMoney(line.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p className="warn">Не удалось посчитать блюдо. Проверьте единицы и плотность.</p>
          )}
        </div>

        <div>
          <div className="card">
            <h3>Сколько порций из запаса</h3>
            <div className="form-grid">
              <label className="field wide">
                <span>Продукт на складе</span>
                <select value={stockProduct} onChange={(e) => setStockProduct(e.target.value)}>
                  {workspace.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Есть, г</span>
                <input type="number" value={stockG} onChange={(e) => setStockG(Number(e.target.value))} />
              </label>
            </div>
            <p style={{ marginTop: 12 }}>{fromStock}</p>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <h3>Перевод единиц</h3>
            <div className="form-grid">
              <label className="field">
                <span>Количество</span>
                <input type="number" value={convValue} onChange={(e) => setConvValue(Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Плотность г/мл</span>
                <input type="number" value={density} onChange={(e) => setDensity(Number(e.target.value))} />
              </label>
              <label className="field">
                <span>Из</span>
                <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value as Unit)}>
                  {Object.entries(UNIT_META).map(([id, meta]) => (
                    <option key={id} value={id}>
                      {meta.code}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>В</span>
                <select value={toUnit} onChange={(e) => setToUnit(e.target.value as Unit)}>
                  {Object.entries(UNIT_META).map(([id, meta]) => (
                    <option key={id} value={id}>
                      {meta.code}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mono" style={{ marginTop: 12 }}>
              {converted}
            </p>
            <p className="muted">Например, 2 ст.л. масла 0,91 г/мл ≈ 27 г. Можно ввести «ст.л.» через парсер: {safeParse("ст.л.")}</p>
          </div>
        </div>
      </div>
    </>
  );
}

function safeParse(raw: string): string {
  try {
    return parseUnit(raw);
  } catch {
    return "—";
  }
}
