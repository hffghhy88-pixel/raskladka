import { useMemo, useState } from "react";
import { shoppingFromMenu } from "../domain/shopping";
import { formatMassGrams, formatMoney } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, Stat } from "../components/ui";

export function ShoppingPage() {
  const { workspace, selectedMenuId, selectMenu } = useWorkspace();
  const [onlyBuy, setOnlyBuy] = useState(false);
  const menu = workspace.menus.find((m) => m.id === selectedMenuId) ?? workspace.menus[0];
  const list = useMemo(() => {
    if (!menu) return null;
    try {
      return shoppingFromMenu(menu, workspace.dishes, workspace.products, workspace.inventory);
    } catch {
      return null;
    }
  }, [menu, workspace]);

  const items = (list?.items ?? []).filter((i) => !onlyBuy || i.toBuyG > 0);

  return (
    <>
      <PageHead title="Закупки" hint="Сводка сырья по всему меню: сколько весит и чего не хватает на складе">
        <select
          value={menu?.id ?? ""}
          onChange={(e) => selectMenu(e.target.value)}
        >
          {workspace.menus.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="row">
          <input type="checkbox" checked={onlyBuy} onChange={(e) => setOnlyBuy(e.target.checked)} />
          только докупить
        </label>
        <button
          className="btn"
          onClick={() => {
            if (!list) return;
            const text = list.items
              .map((i) => `${i.productName}\t${i.displayLabel}\t${formatMoney(i.cost)}`)
              .join("\n");
            void navigator.clipboard.writeText(text);
          }}
        >
          Копировать
        </button>
      </PageHead>
      {list ? (
        <>
          <div className="grid grid-4">
            <Stat label="Сырьё брутто" value={formatMassGrams(list.totalGrossG)} />
            <Stat label="Позиций" value={String(list.items.length)} />
            <Stat label="Сумма" value={formatMoney(list.totalCost)} />
            <Stat
              label="Докупить"
              value={formatMassGrams(list.items.reduce((s, i) => s + i.toBuyG, 0))}
            />
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <table className="data">
              <thead>
                <tr>
                  <th>Продукт</th>
                  <th>Нужно</th>
                  <th className="num">На складе</th>
                  <th className="num">Докупить</th>
                  <th className="num">Сумма</th>
                  <th>Куда идёт</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId}>
                    <td>
                      {item.productName}
                      <div className="meta muted">{item.category}</div>
                    </td>
                    <td>{item.displayLabel}</td>
                    <td className="num">{formatMassGrams(item.inStockG)}</td>
                    <td className="num">{formatMassGrams(item.toBuyG)}</td>
                    <td className="num">{formatMoney(item.cost)}</td>
                    <td className="muted">{item.usedIn.slice(0, 3).join("; ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="card">Не удалось собрать закупку. Проверьте меню и единицы.</div>
      )}
    </>
  );
}
