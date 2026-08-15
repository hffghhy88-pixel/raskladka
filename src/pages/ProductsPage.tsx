import { useEffect, useMemo, useState } from "react";
import { emptyProduct } from "../domain/calc";
import { createId } from "../domain/ids";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABEL } from "../domain/labels";
import { ALL_UNITS, formatMoney, unitCode } from "../domain/units";
import { cloneYield, YIELD_PRESETS } from "../domain/yield";
import { useWorkspace } from "../store/context";
import { PageHead } from "../components/ui";
import type { Product, ProductCategory, Unit, YieldKind } from "../types/models";

export function ProductsPage() {
  const { workspace, selectedProductId, selectProduct, upsertProduct, removeProduct } = useWorkspace();
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<ProductCategory | "all">("all");
  const selected =
    workspace.products.find((p) => p.id === selectedProductId) ??
    workspace.products[0] ??
    emptyProduct();

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workspace.products.filter((p) => {
      if (p.archived) return false;
      if (cat !== "all" && p.category !== cat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [workspace.products, query, cat]);

  return (
    <>
      <PageHead title="Продукты" hint="Справочник сырья: плотность, потери, цена, КБЖУ">
        <input className="search" placeholder="Найти продукт" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={cat} onChange={(e) => setCat(e.target.value as ProductCategory | "all")}>
          <option value="all">Все категории</option>
          {PRODUCT_CATEGORIES.map((id) => (
            <option key={id} value={id}>
              {PRODUCT_CATEGORY_LABEL[id]}
            </option>
          ))}
        </select>
        <button
          className="btn primary"
          onClick={() => {
            const next = { ...emptyProduct(), id: createId("prd"), name: "Новый продукт" };
            upsertProduct(next);
            selectProduct(next.id);
          }}
        >
          Добавить
        </button>
      </PageHead>
      <div className="split">
        <div className="card padless">
          <div className="list">
            {list.map((p) => (
              <button key={p.id} className={p.id === selected.id ? "active" : ""} onClick={() => selectProduct(p.id)}>
                {p.name}
                <div className="meta">
                  {PRODUCT_CATEGORY_LABEL[p.category]} · {formatMoney(p.pricePerKg)}/кг
                </div>
              </button>
            ))}
          </div>
        </div>
        <ProductEditor product={selected} onSave={upsertProduct} onDelete={() => removeProduct(selected.id)} />
      </div>
    </>
  );
}

function ProductEditor({
  product,
  onSave,
  onDelete,
}: {
  product: Product;
  onSave: (p: Product) => void;
  onDelete: () => void;
}) {
  const [draft, setDraft] = useState(product);
  const [preset, setPreset] = useState<YieldKind>("none");
  useEffect(() => setDraft(product), [product]);

  const set = <K extends keyof Product>(key: K, value: Product[K]) => setDraft({ ...draft, [key]: value });

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{draft.name || "Продукт"}</h3>
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
          <input value={draft.name} onChange={(e) => set("name", e.target.value)} />
        </label>
        <label className="field">
          <span>Категория</span>
          <select value={draft.category} onChange={(e) => set("category", e.target.value as ProductCategory)}>
            {PRODUCT_CATEGORIES.map((id) => (
              <option key={id} value={id}>
                {PRODUCT_CATEGORY_LABEL[id]}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Единица</span>
          <select value={draft.defaultUnit} onChange={(e) => set("defaultUnit", e.target.value as Unit)}>
            {ALL_UNITS.map((u) => (
              <option key={u} value={u}>
                {unitCode(u)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Цена, ₽/кг</span>
          <input type="number" value={draft.pricePerKg} onChange={(e) => set("pricePerKg", Number(e.target.value))} />
        </label>
        <label className="field">
          <span>Плотность, г/мл</span>
          <input
            type="number"
            value={draft.densityGPerMl ?? ""}
            onChange={(e) => set("densityGPerMl", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
        <label className="field">
          <span>Вес штуки, г</span>
          <input
            type="number"
            value={draft.pieceWeightG ?? ""}
            onChange={(e) => set("pieceWeightG", e.target.value ? Number(e.target.value) : undefined)}
          />
        </label>
        <label className="field">
          <span>Ккал / 100 г</span>
          <input
            type="number"
            value={draft.nutritionPer100g.kcal}
            onChange={(e) => set("nutritionPer100g", { ...draft.nutritionPer100g, kcal: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Белки</span>
          <input
            type="number"
            value={draft.nutritionPer100g.proteinG}
            onChange={(e) => set("nutritionPer100g", { ...draft.nutritionPer100g, proteinG: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Жиры</span>
          <input
            type="number"
            value={draft.nutritionPer100g.fatG}
            onChange={(e) => set("nutritionPer100g", { ...draft.nutritionPer100g, fatG: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Углеводы</span>
          <input
            type="number"
            value={draft.nutritionPer100g.carbsG}
            onChange={(e) => set("nutritionPer100g", { ...draft.nutritionPer100g, carbsG: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Профиль потерь</span>
          <select
            value={preset}
            onChange={(e) => {
              const kind = e.target.value as YieldKind;
              setPreset(kind);
              set("yieldProfile", cloneYield(YIELD_PRESETS[kind]));
            }}
          >
            <option value="none">без потерь</option>
            <option value="root">корнеплоды</option>
            <option value="onion">лук</option>
            <option value="cabbage">капуста</option>
            <option value="greens">зелень</option>
            <option value="meat">мясо</option>
            <option value="poultry">птица</option>
            <option value="fish">рыба</option>
            <option value="groats">крупы</option>
            <option value="pasta">макароны</option>
            <option value="dairy">молочка</option>
          </select>
        </label>
        <label className="field">
          <span>Очистка, %</span>
          <input
            type="number"
            value={draft.yieldProfile.coldLoss.peel}
            onChange={(e) =>
              set("yieldProfile", {
                ...draft.yieldProfile,
                coldLoss: { ...draft.yieldProfile.coldLoss, peel: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="field">
          <span>Выход варки, %</span>
          <input
            type="number"
            value={draft.yieldProfile.hotYield.boil}
            onChange={(e) =>
              set("yieldProfile", {
                ...draft.yieldProfile,
                hotYield: { ...draft.yieldProfile.hotYield, boil: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="field">
          <span>Выход жарки, %</span>
          <input
            type="number"
            value={draft.yieldProfile.hotYield.fry}
            onChange={(e) =>
              set("yieldProfile", {
                ...draft.yieldProfile,
                hotYield: { ...draft.yieldProfile.hotYield, fry: Number(e.target.value) },
              })
            }
          />
        </label>
        <label className="field wide">
          <span>Аллергены через запятую</span>
          <input
            value={draft.allergens.join(", ")}
            onChange={(e) =>
              set(
                "allergens",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
      </div>
    </div>
  );
}
