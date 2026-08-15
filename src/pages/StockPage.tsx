import { useState } from "react";
import { formatMassGrams } from "../domain/units";
import { useWorkspace } from "../store/context";
import { PageHead, Stat } from "../components/ui";

export function StockPage() {
  const { workspace, upsertStock, removeStock } = useWorkspace();
  const [productId, setProductId] = useState(workspace.products[0]?.id ?? "");
  const [qty, setQty] = useState(1000);
  const [min, setMin] = useState(0);
  const [location, setLocation] = useState("склад");

  const alerts = workspace.inventory.filter((i) => i.quantityG <= 0 || (i.minG > 0 && i.quantityG < i.minG));

  return (
    <>
      <PageHead title="Склад" hint="Остатки в граммах. Закупка вычитает их из потребности меню.">
        <Stat label="Позиций" value={String(workspace.inventory.length)} />
        <Stat
          label="Масса"
          value={formatMassGrams(workspace.inventory.reduce((s, i) => s + i.quantityG, 0))}
        />
      </PageHead>
      <div className="card">
        <div className="row">
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            {workspace.products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} title="минимум" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} />
          <button
            className="btn primary"
            onClick={() =>
              upsertStock({
                productId,
                quantityG: qty,
                reservedG: 0,
                minG: min,
                location,
              })
            }
          >
            Записать
          </button>
        </div>
      </div>
      {alerts.length ? (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Сигналы</h3>
          {alerts.map((a) => (
            <p key={a.productId} className="warn">
              {workspace.products.find((p) => p.id === a.productId)?.name ?? a.productId}:{" "}
              {formatMassGrams(a.quantityG)} при минимуме {formatMassGrams(a.minG)}
            </p>
          ))}
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 12 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Продукт</th>
              <th>Место</th>
              <th className="num">Остаток</th>
              <th className="num">Мин.</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {workspace.inventory.map((item) => (
              <tr key={item.productId}>
                <td>{workspace.products.find((p) => p.id === item.productId)?.name ?? item.productId}</td>
                <td>{item.location}</td>
                <td className="num">{formatMassGrams(item.quantityG)}</td>
                <td className="num">{formatMassGrams(item.minG)}</td>
                <td>
                  <button className="btn ghost" onClick={() => removeStock(item.productId)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
