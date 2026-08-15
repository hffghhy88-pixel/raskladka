import { useEffect, useMemo, useState } from "react";
import { calcDish, emptyDish } from "../domain/calc";
import { createId } from "../domain/ids";
import {
  COLD_LABEL,
  COLD_PROCESSES,
  DISH_CATEGORIES,
  DISH_CATEGORY_LABEL,
  HOT_LABEL,
  HOT_PROCESSES,
} from "../domain/labels";
import { formatNutrition } from "../domain/nutrition";
import { ALL_UNITS, formatMassGrams, formatMoney, unitCode } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, WeightStrip } from "../components/ui";
import type { ColdProcess, Dish, DishCategory, DishLine, HotProcess, Unit } from "../types/models";

export function DishesPage() {
  const { workspace, selectedDishId, selectDish, upsertDish, removeDish } = useWorkspace();
  const [query, setQuery] = useState("");
  const selected = workspace.dishes.find((d) => d.id === selectedDishId) ?? workspace.dishes[0];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspace.dishes.filter((d) => !d.archived && (!q || d.name.toLowerCase().includes(q)));
  }, [workspace.dishes, query]);

  return (
    <>
      <PageHead title="Блюда" hint="Закладка, брутто / нетто / выход, шаги приготовления">
        <input className="search" placeholder="Найти блюдо" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          className="btn primary"
          onClick={() => {
            const next = { ...emptyDish(), id: createId("dsh") };
            upsertDish(next);
            selectDish(next.id);
          }}
        >
          Новое блюдо
        </button>
      </PageHead>
      <div className="split">
        <div className="card padless">
          <div className="list">
            {list.map((d) => (
              <button key={d.id} className={d.id === selected?.id ? "active" : ""} onClick={() => selectDish(d.id)}>
                {d.name}
                <div className="meta">
                  {DISH_CATEGORY_LABEL[d.category]} · {d.basePortions} порц. · план {d.targetPortionG} г
                </div>
              </button>
            ))}
          </div>
        </div>
        {selected ? (
          <DishEditor
            dish={selected}
            products={workspace.products}
            onSave={upsertDish}
            onDelete={() => removeDish(selected.id)}
          />
        ) : (
          <div className="card">Нет блюд</div>
        )}
      </div>
    </>
  );
}

function DishEditor({
  dish,
  products,
  onSave,
  onDelete,
}: {
  dish: Dish;
  products: ReturnType<typeof useWorkspace>["workspace"]["products"];
  onSave: (dish: Dish) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(dish);
  useEffect(() => setDraft(dish), [dish]);

  let calc = null;
  let error = "";
  try {
    calc = calcDish(draft, products, draft.basePortions);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const setLine = (id: string, patch: Partial<DishLine>) => {
    setDraft({
      ...draft,
      lines: draft.lines.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    });
  };

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{draft.name}</h3>
        <div className="row">
          <button className="btn danger" onClick={onDelete}>
            Удалить
          </button>
          <button className="btn primary" onClick={() => onSave(draft)}>
            Сохранить
          </button>
        </div>
      </div>
      <div className="form-grid" style={{ marginTop: 12 }}>
        <label className="field wide">
          <span>Название</span>
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Категория</span>
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as DishCategory })}
          >
            {DISH_CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {DISH_CATEGORY_LABEL[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>База порций</span>
          <input
            type="number"
            value={draft.basePortions}
            onChange={(e) => setDraft({ ...draft, basePortions: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>План порции, г</span>
          <input
            type="number"
            value={draft.targetPortionG}
            onChange={(e) => setDraft({ ...draft, targetPortionG: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Потери на подачу, %</span>
          <input
            type="number"
            value={draft.finishingLossPercent}
            onChange={(e) => setDraft({ ...draft, finishingLossPercent: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Выкипание, г</span>
          <input
            type="number"
            value={draft.evaporationG}
            onChange={(e) => setDraft({ ...draft, evaporationG: Number(e.target.value) })}
          />
        </label>
        <label className="field wide">
          <span>Описание</span>
          <textarea value={draft.description ?? ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
      </div>

      {calc ? <WeightStrip weights={calc.totals} finished={calc.finishedYieldG} /> : null}
      {calc ? (
        <p className="muted">
          Порция {formatMassGrams(calc.portionYieldG)} · {formatNutrition(calc.nutritionPerPortion)} ·{" "}
          {formatMoney(calc.costPerPortion)}
        </p>
      ) : null}
      {error ? <p className="warn">{error}</p> : null}
      {calc?.warnings.map((w) => (
        <p key={w} className="warn">
          {w}
        </p>
      ))}

      <div className="row" style={{ margin: "14px 0 8px", justifyContent: "space-between" }}>
        <h3>Закладка</h3>
        <button
          className="btn"
          onClick={() =>
            setDraft({
              ...draft,
              lines: [
                ...draft.lines,
                {
                  id: createId("ln"),
                  productId: products[0]?.id ?? "",
                  quantity: 100,
                  unit: "gram",
                  cold: "none",
                  hot: "none",
                  group: "main",
                  optional: false,
                  excludeFromYield: false,
                  excludeFromShopping: false,
                },
              ],
            })
          }
        >
          Добавить продукт
        </button>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Продукт</th>
            <th>Кол-во</th>
            <th>Ед.</th>
            <th>Холод.</th>
            <th>Тепл.</th>
            <th className="num">Брутто</th>
            <th className="num">Нетто</th>
            <th className="num">Выход</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {draft.lines.map((line) => {
            const calcLine = calc?.lines.find((l) => l.lineId === line.id);
            return (
              <tr key={line.id}>
                <td>
                  <select value={line.productId} onChange={(e) => setLine(line.id, { productId: e.target.value })}>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    style={{ width: 80 }}
                    value={line.quantity}
                    onChange={(e) => setLine(line.id, { quantity: Number(e.target.value) })}
                  />
                </td>
                <td>
                  <select value={line.unit} onChange={(e) => setLine(line.id, { unit: e.target.value as Unit })}>
                    {ALL_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {unitCode(u)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={line.cold} onChange={(e) => setLine(line.id, { cold: e.target.value as ColdProcess })}>
                    {COLD_PROCESSES.map((c) => (
                      <option key={c} value={c}>
                        {COLD_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select value={line.hot} onChange={(e) => setLine(line.id, { hot: e.target.value as HotProcess })}>
                    {HOT_PROCESSES.map((h) => (
                      <option key={h} value={h}>
                        {HOT_LABEL[h]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="num">{calcLine ? formatMassGrams(calcLine.weights.grossG) : "—"}</td>
                <td className="num">{calcLine ? formatMassGrams(calcLine.weights.netG) : "—"}</td>
                <td className="num">{calcLine ? formatMassGrams(calcLine.weights.yieldG) : "—"}</td>
                <td>
                  <button
                    className="btn ghost"
                    onClick={() => setDraft({ ...draft, lines: draft.lines.filter((l) => l.id !== line.id) })}
                  >
                    ×
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <label className="field" style={{ marginTop: 14 }}>
        <span>Технология, каждая строка — шаг</span>
        <textarea
          value={draft.steps.join("\n")}
          onChange={(e) => setDraft({ ...draft, steps: e.target.value.split("\n") })}
        />
      </label>
    </div>
  );
}
