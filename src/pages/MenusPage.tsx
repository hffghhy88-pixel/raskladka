import { useEffect, useState } from "react";
import { createId } from "../domain/ids";
import { MEAL_KINDS, MEAL_LABEL } from "../domain/labels";
import { calcMenu, emptyMenu } from "../domain/menuCalc";
import { formatMassGrams, formatMoney } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, WeightStrip } from "../components/ui";
import type { MealKind, Menu, MenuDay, MenuSlot } from "../types/models";

export function MenusPage() {
  const { workspace, selectedMenuId, selectMenu, upsertMenu, removeMenu } = useWorkspace();
  const selected = workspace.menus.find((m) => m.id === selectedMenuId) ?? workspace.menus[0];

  return (
    <>
      <PageHead title="Меню" hint="Соберите дни и приёмы пищи — вес продуктов посчитается сам">
        <button
          className="btn primary"
          onClick={() => {
            const next = { ...emptyMenu(), id: createId("mnu"), days: [emptyDay("День 1")] };
            upsertMenu(next);
            selectMenu(next.id);
          }}
        >
          Новое меню
        </button>
      </PageHead>
      <div className="split">
        <div className="card padless">
          <div className="list">
            {workspace.menus.map((menu) => (
              <button
                key={menu.id}
                className={menu.id === selected?.id ? "active" : ""}
                onClick={() => selectMenu(menu.id)}
              >
                {menu.name}
                <div className="meta">
                  {menu.days.length} дн. · {menu.guests} гостей
                </div>
              </button>
            ))}
          </div>
        </div>
        {selected ? (
          <MenuEditor
            menu={selected}
            dishes={workspace.dishes}
            products={workspace.products}
            onSave={upsertMenu}
            onDelete={() => removeMenu(selected.id)}
          />
        ) : (
          <div className="card">Создайте первое меню</div>
        )}
      </div>
    </>
  );
}

function emptyDay(label: string): MenuDay {
  return { id: createId("day"), dateLabel: label, slots: [] };
}

function MenuEditor({
  menu,
  dishes,
  products,
  onSave,
  onDelete,
}: {
  menu: Menu;
  dishes: ReturnType<typeof useWorkspace>["workspace"]["dishes"];
  products: ReturnType<typeof useWorkspace>["workspace"]["products"];
  onSave: (menu: Menu) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(menu);
  useEffect(() => setDraft(menu), [menu]);

  let calc = null;
  let error = "";
  try {
    calc = calcMenu(draft, dishes, products);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const setDay = (id: string, patch: Partial<MenuDay>) => {
    setDraft({ ...draft, days: draft.days.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  const setSlot = (dayId: string, slotId: string, patch: Partial<MenuSlot>) => {
    setDay(dayId, {
      slots: (draft.days.find((d) => d.id === dayId)?.slots ?? []).map((s) =>
        s.id === slotId ? { ...s, ...patch } : s,
      ),
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
          <span>Гостей</span>
          <input type="number" value={draft.guests} onChange={(e) => setDraft({ ...draft, guests: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>Площадка</span>
          <input value={draft.venue ?? ""} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} />
        </label>
      </div>
      {calc ? (
        <div style={{ margin: "12px 0" }}>
          <WeightStrip weights={calc.totals} finished={calc.finishedYieldG} />
          <p className="muted">
            {calc.slotCount} позиций · {formatMoney(calc.cost)}
          </p>
        </div>
      ) : null}
      {error ? <p className="warn">{error}</p> : null}

      {draft.days.map((day, index) => (
        <div key={day.id} className="menu-day">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <input
              value={day.dateLabel}
              onChange={(e) => setDay(day.id, { dateLabel: e.target.value })}
              style={{ fontFamily: "var(--display)", fontSize: 20, border: 0, background: "transparent" }}
            />
            <button
              className="btn"
              onClick={() =>
                setDay(day.id, {
                  slots: [
                    ...day.slots,
                    {
                      id: createId("slot"),
                      dishId: dishes[0]?.id ?? "",
                      portions: draft.guests,
                      meal: "lunch",
                    },
                  ],
                })
              }
            >
              + блюдо
            </button>
          </div>
          {day.slots.map((slot) => (
            <div key={slot.id} className="slot">
              <select value={slot.meal} onChange={(e) => setSlot(day.id, slot.id, { meal: e.target.value as MealKind })}>
                {MEAL_KINDS.map((m) => (
                  <option key={m} value={m}>
                    {MEAL_LABEL[m]}
                  </option>
                ))}
              </select>
              <select value={slot.dishId} onChange={(e) => setSlot(day.id, slot.id, { dishId: e.target.value })}>
                {dishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={slot.portions}
                onChange={(e) => setSlot(day.id, slot.id, { portions: Number(e.target.value) })}
              />
              <button
                className="btn ghost"
                onClick={() => setDay(day.id, { slots: day.slots.filter((s) => s.id !== slot.id) })}
              >
                ×
              </button>
            </div>
          ))}
          {calc?.days[index] ? (
            <p className="muted">
              день: {formatMassGrams(calc.days[index]!.finishedYieldG)} · на гостя{" "}
              {formatMassGrams(calc.days[index]!.perGuestYieldG)}
            </p>
          ) : null}
        </div>
      ))}
      <button
        className="btn"
        onClick={() => setDraft({ ...draft, days: [...draft.days, emptyDay(`День ${draft.days.length + 1}`)] })}
      >
        Добавить день
      </button>
    </div>
  );
}
