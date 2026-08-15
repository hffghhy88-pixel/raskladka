import { calcMenu } from "../domain/menuCalc";
import { MEAL_LABEL } from "../domain/labels";
import { formatNutrition } from "../domain/nutrition";
import { formatMassGrams, formatMoney } from "../domain/units";
import { validateWorkspace } from "../domain/validate";
import { useWorkspace } from "../store/context";
import { PageHead, Stat, WeightStrip } from "../components/ui";

export function TodayPage() {
  const { workspace, setRoute, selectMenu, selectDish } = useWorkspace();
  const menu = workspace.menus[0];
  const report = validateWorkspace(workspace.products, workspace.dishes, workspace.menus);
  let calc = null;
  let error = "";
  if (menu) {
    try {
      calc = calcMenu(menu, workspace.dishes, workspace.products);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }
  }
  const firstDay = calc?.days[0];

  return (
    <>
      <PageHead title="Сегодня на кухне" hint={workspace.title}>
        <button className="btn primary" onClick={() => setRoute("menus")}>
          Открыть меню
        </button>
      </PageHead>

      <div className="grid grid-4">
        <Stat label="Продукты" value={String(workspace.products.length)} hint="в справочнике" />
        <Stat label="Блюда" value={String(workspace.dishes.length)} hint="техкарт" />
        <Stat label="Меню" value={String(workspace.menus.length)} />
        <Stat
          label="Склад"
          value={formatMassGrams(workspace.inventory.reduce((s, i) => s + i.quantityG, 0))}
          hint={`${workspace.inventory.length} позиций`}
        />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>{menu ? menu.name : "Меню не выбрано"}</h3>
          {error ? <p className="warn">{error}</p> : null}
          {calc ? (
            <>
              <WeightStrip weights={calc.totals} finished={calc.finishedYieldG} />
              <p className="muted" style={{ marginTop: 10 }}>
                {calc.days.length} дн. · {calc.dishCount} блюд · {formatMoney(calc.cost)}
              </p>
            </>
          ) : (
            <p className="muted">Добавьте меню, чтобы увидеть общий вес раскладки.</p>
          )}
          {firstDay ? (
            <div style={{ marginTop: 16 }}>
              <h3>{firstDay.dateLabel}</h3>
              <table className="data">
                <thead>
                  <tr>
                    <th>Приём</th>
                    <th>Блюдо</th>
                    <th className="num">Порц.</th>
                    <th className="num">Выход</th>
                  </tr>
                </thead>
                <tbody>
                  {firstDay.slots.map((slot) => (
                    <tr key={slot.slot.id}>
                      <td>{MEAL_LABEL[slot.slot.meal]}</td>
                      <td>
                        <button
                          className="btn ghost"
                          onClick={() => {
                            selectDish(slot.slot.dishId);
                            setRoute("dishes");
                          }}
                        >
                          {slot.dishName}
                        </button>
                      </td>
                      <td className="num">{slot.slot.portions}</td>
                      <td className="num">{formatMassGrams(slot.calc.finishedYieldG)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="muted">
                На гостя: {formatMassGrams(firstDay.perGuestYieldG)} ·{" "}
                {formatNutrition(firstDay.perGuestNutrition)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h3>Проверка данных</h3>
          <p className={report.ok ? "ok" : "warn"}>
            {report.ok ? "Критических ошибок нет" : `${report.errors.length} ошибок`}
          </p>
          <ul>
            {report.errors.slice(0, 6).map((item) => (
              <li key={item} className="warn">
                {item}
              </li>
            ))}
            {report.warnings.slice(0, 6).map((item) => (
              <li key={item} className="muted">
                {item}
              </li>
            ))}
          </ul>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => setRoute("calculator")}>
              Калькулятор веса
            </button>
            <button
              className="btn"
              onClick={() => {
                if (menu) selectMenu(menu.id);
                setRoute("shopping");
              }}
            >
              Закупки
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
