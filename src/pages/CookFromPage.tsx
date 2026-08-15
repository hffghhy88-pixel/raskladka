import { dishesFromStock } from "../domain/cookFrom";
import { DISH_CATEGORY_LABEL } from "../domain/labels";
import { formatMassGrams } from "../domain/units";
import { useWorkspace } from "../store/context";
import { DishPhoto, PageHead } from "../components/ui";

export function CookFromPage() {
  const { workspace, selectDish, setRoute } = useWorkspace();
  const hits = dishesFromStock(workspace.dishes, workspace.products, workspace.inventory);
  const can = hits.filter((h) => h.maxPortions >= 1);
  const cannot = hits.filter((h) => h.maxPortions < 1);

  return (
    <>
      <PageHead
        title="Что приготовить из запасов"
        hint="Смотрим склад и говорим, на сколько порций хватит каждого блюда"
      />
      {workspace.inventory.length === 0 ? (
        <div className="card">
          <p>На складе пусто. Сначала запишите, что есть дома.</p>
          <button className="btn primary" onClick={() => setRoute("stock")}>
            Открыть склад
          </button>
        </div>
      ) : null}

      <h2 style={{ margin: "8px 0 12px" }}>Хватит</h2>
      <div className="dish-grid">
        {can.map((hit) => (
          <button
            key={hit.dish.id}
            className="dish-card"
            onClick={() => {
              selectDish(hit.dish.id);
              setRoute("dishes");
            }}
          >
            <DishPhoto dish={hit.dish} />
            <strong>{hit.dish.name}</strong>
            <span>
              {DISH_CATEGORY_LABEL[hit.dish.category]} · до {hit.maxPortions} порц.
            </span>
            {hit.limiting ? (
              <span className="muted">
                упирается в {hit.limiting.productName} ({formatMassGrams(hit.limiting.haveG)})
              </span>
            ) : null}
          </button>
        ))}
      </div>
      {can.length === 0 && workspace.inventory.length > 0 ? (
        <p className="muted">Ни на одно блюдо полностью не хватает.</p>
      ) : null}

      {cannot.length > 0 ? (
        <>
          <h2 style={{ margin: "22px 0 12px" }}>Не хватает продуктов</h2>
          <div className="card">
            <table className="data">
              <thead>
                <tr>
                  <th>Блюдо</th>
                  <th>Чего нет</th>
                </tr>
              </thead>
              <tbody>
                {cannot.slice(0, 20).map((hit) => (
                  <tr key={hit.dish.id}>
                    <td>{hit.dish.name}</td>
                    <td className="muted">{hit.missing.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
