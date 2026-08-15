import { useMemo, useState } from "react";
import { makeCostCard } from "../domain/cost";
import { makeTechCard, techCardMarkdown } from "../domain/techCard";
import { useWorkspace } from "../store/context";
import { PageHead } from "../components/ui";

export function TechCardsPage() {
  const { workspace, selectedDishId, selectDish } = useWorkspace();
  const [portions, setPortions] = useState(10);
  const dish = workspace.dishes.find((d) => d.id === selectedDishId) ?? workspace.dishes[0];

  const card = useMemo(() => {
    if (!dish) return null;
    try {
      return makeTechCard(dish, workspace.products, portions);
    } catch {
      return null;
    }
  }, [dish, workspace.products, portions]);

  const cost = useMemo(() => {
    if (!dish) return null;
    try {
      return makeCostCard(dish, workspace.products, portions, workspace.cost);
    } catch {
      return null;
    }
  }, [dish, workspace.products, portions, workspace.cost]);

  return (
    <>
      <PageHead title="Техкарты" hint="Технологическая и калькуляционная карта для печати">
        <select value={dish?.id ?? ""} onChange={(e) => selectDish(e.target.value)}>
          {workspace.dishes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="field" style={{ width: 120 }}>
          <span>Порций</span>
          <input type="number" value={portions} onChange={(e) => setPortions(Number(e.target.value))} />
        </label>
        <button className="btn" onClick={() => window.print()}>
          Печать
        </button>
        <button
          className="btn"
          onClick={() => {
            if (!card) return;
            const md = techCardMarkdown(card);
            if (window.raskladka) void window.raskladka.saveFile(`${card.title}.md`, md);
            else void navigator.clipboard.writeText(md);
          }}
        >
          Экспорт
        </button>
      </PageHead>

      {card && dish ? (
        <div className="card print-card">
          <div className="tech-head">
            <div>
              <h2>{card.title}</h2>
              <p className="muted">
                {card.category} · {card.portions} порц. · подготовка {card.prepTimeMin} мин · варка {card.cookTimeMin} мин
              </p>
              <p>{card.description}</p>
            </div>
            <div>
              <div className="pill">порция {card.portionYield}</div>
              <p className="muted">{card.nutritionPerPortion}</p>
              <p>{card.costPerPortion}</p>
            </div>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>№</th>
                <th>Продукт</th>
                <th className="num">Кол-во</th>
                <th className="num">Брутто</th>
                <th className="num">Нетто</th>
                <th className="num">Выход</th>
                <th>Обработка</th>
              </tr>
            </thead>
            <tbody>
              {card.lines.map((line) => (
                <tr key={line.index}>
                  <td>{line.index}</td>
                  <td>{line.productName}</td>
                  <td className="num">{line.quantity}</td>
                  <td className="num">{line.grossG}</td>
                  <td className="num">{line.netG}</td>
                  <td className="num">{line.yieldG}</td>
                  <td className="muted">
                    {line.cold} / {line.hot}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Итого брутто {card.grossTotal} · нетто {card.netTotal} · выход сырья {card.yieldTotal} · блюдо{" "}
            {card.finishedYield} · план порции {card.targetPortion}
          </p>
          {card.steps.length ? (
            <ol className="steps">
              {card.steps.filter(Boolean).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : null}
          <p className="muted">Аллергены: {card.allergens.join(", ") || "не указаны"}</p>
          {cost ? (
            <p>
              Food cost порции {cost.foodCostPerPortion.toFixed(2)} ₽ · цена с наценкой {cost.priceExVat.toFixed(2)} ₽ ·
              доля сырья {cost.foodCostRatio.toFixed(0)}%
            </p>
          ) : null}
        </div>
      ) : (
        <div className="card">Не удалось построить карту.</div>
      )}
    </>
  );
}
