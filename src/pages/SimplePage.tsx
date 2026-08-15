import { useMemo, useState } from "react";
import { createId } from "../domain/ids";
import { DISH_CATEGORY_LABEL } from "../domain/labels";
import { calcDish } from "../domain/calc";
import { shoppingFromMenu } from "../domain/shopping";
import { printHtml, saveTextFile, shoppingPrintHtml, shoppingToCsv } from "../domain/exportDocs";
import { DishPhoto } from "../components/ui";
import { formatMassGrams, formatMoney } from "../domain/units";
import { useWorkspace } from "../store/context";
import type { Dish, MealKind, Menu } from "../types/models";

export function SimplePage() {
  const { workspace, upsertMenu, selectMenu, setRoute } = useWorkspace();
  const [people, setPeople] = useState(4);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const dishes = workspace.dishes.filter((d) => !d.archived);
  const selected = dishes.filter((d) => picked[d.id]);

  const previewMenu = useMemo<Menu>(
    () => ({
      id: "simple-preview",
      name: `На ${people} чел.`,
      guests: people,
      days: [
        {
          id: "d1",
          dateLabel: "Сегодня",
          slots: selected.map((dish) => ({
            id: dish.id,
            dishId: dish.id,
            portions: people,
            meal: mealFor(dish),
          })),
        },
      ],
      archived: false,
    }),
    [people, selected],
  );

  const list = useMemo(() => {
    if (selected.length === 0) return null;
    try {
      return shoppingFromMenu(previewMenu, workspace.dishes, workspace.products, workspace.inventory);
    } catch {
      return null;
    }
  }, [previewMenu, selected.length, workspace]);

  const toggle = (id: string) => setPicked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="simple">
      <div className="stage-head">
        <div>
          <h1>Просто посчитать</h1>
          <p>Сколько людей, что готовим, что купить. Без сложных слов.</p>
        </div>
      </div>

      <div className="steps-bar no-print">
        <button className={step === 1 ? "on" : ""} onClick={() => setStep(1)}>
          1. Люди
        </button>
        <button className={step === 2 ? "on" : ""} onClick={() => setStep(2)}>
          2. Блюда
        </button>
        <button className={step === 3 ? "on" : ""} disabled={selected.length === 0} onClick={() => setStep(3)}>
          3. Покупки
        </button>
      </div>

      {step === 1 && (
        <div className="card simple-hero">
          <h2>Сколько человек есть будут?</h2>
          <div className="people-row">
            <button className="btn big" onClick={() => setPeople((n) => Math.max(1, n - 1))}>
              −
            </button>
            <div className="people-num">{people}</div>
            <button className="btn big" onClick={() => setPeople((n) => n + 1)}>
              +
            </button>
          </div>
          <div className="row" style={{ justifyContent: "center", marginTop: 18 }}>
            {[2, 4, 6, 10, 20].map((n) => (
              <button key={n} className={`btn ${people === n ? "primary" : ""}`} onClick={() => setPeople(n)}>
                {n}
              </button>
            ))}
          </div>
          <button className="btn primary big-wide" style={{ marginTop: 28 }} onClick={() => setStep(2)}>
            Дальше — выбрать блюда
          </button>
        </div>
      )}

      {step === 2 && (
        <>
          <p className="muted">Нажмите на блюдо. Можно несколько. Сейчас выбрано: {selected.length}</p>
          <div className="dish-grid">
            {dishes.map((dish) => {
              const on = Boolean(picked[dish.id]);
              let portion = "";
              try {
                portion = `${Math.round(calcDish(dish, workspace.products, 1).portionYieldG)} г`;
              } catch {
                portion = "";
              }
              return (
                <button key={dish.id} className={`dish-card ${on ? "on" : ""}`} onClick={() => toggle(dish.id)}>
                  <DishPhoto dish={dish} />
                  <strong>{dish.name}</strong>
                  <span>
                    {DISH_CATEGORY_LABEL[dish.category]}
                    {portion ? ` · ${portion}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="btn" onClick={() => setStep(1)}>
              Назад
            </button>
            <button className="btn primary" disabled={selected.length === 0} onClick={() => setStep(3)}>
              Посчитать покупки
            </button>
          </div>
        </>
      )}

      {step === 3 && list && (
        <div className="card">
          <h2>Что купить на {people} чел.</h2>
          <p className="muted">
            {selected.map((d) => d.name).join(", ")} · {formatMoney(list.totalCost)}
          </p>
          <table className="data">
            <thead>
              <tr>
                <th>Продукт</th>
                <th className="num">Нужно</th>
                <th className="num">Докупить</th>
                <th className="num">≈ ₽</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((item) => (
                <tr key={item.productId}>
                  <td>{item.productName}</td>
                  <td className="num">{item.displayLabel}</td>
                  <td className="num">{formatMassGrams(item.toBuyG)}</td>
                  <td className="num">{formatMoney(item.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row no-print" style={{ marginTop: 16 }}>
            <button
              className="btn primary"
              onClick={() => printHtml("Покупки", shoppingPrintHtml(list, previewMenu.name))}
            >
              Печать / PDF
            </button>
            <button
              className="btn"
              onClick={() => void saveTextFile("pokupki.csv", shoppingToCsv(list))}
            >
              В Excel
            </button>
            <button
              className="btn"
              onClick={() => {
                const menu: Menu = { ...previewMenu, id: createId("mnu") };
                upsertMenu(menu);
                selectMenu(menu.id);
                setRoute("menus");
              }}
            >
              Сохранить как меню
            </button>
            <button className="btn" onClick={() => setStep(2)}>
              Изменить блюда
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function mealFor(dish: Dish): MealKind {
  if (dish.category === "breakfast") return "breakfast";
  if (dish.category === "drink" || dish.category === "dessert") return "snack";
  if (dish.category === "soup" || dish.category === "main" || dish.category === "side") return "lunch";
  return "dinner";
}

