import type { Menu, ShoppingList, TechCard } from "../types/models";
import { MEAL_LABEL } from "./labels";
import { formatMassGrams, formatMoney } from "./units";

export function toExcelCsv(headers: string[], rows: string[][]): string {
  const esc = (cell: string) => `"${cell.replaceAll('"', '""')}"`;
  const lines = [headers, ...rows].map((row) => row.map(esc).join(";"));
  return `\uFEFF${lines.join("\r\n")}`;
}

export function shoppingToCsv(list: ShoppingList): string {
  return toExcelCsv(
    ["Продукт", "Нужно", "На складе", "Докупить", "Сумма, ₽", "Куда идёт"],
    list.items.map((item) => [
      item.productName,
      item.displayLabel,
      formatMassGrams(item.inStockG),
      formatMassGrams(item.toBuyG),
      item.cost.toFixed(2).replace(".", ","),
      item.usedIn.join("; "),
    ]),
  );
}

export function menuToCsv(menu: Menu, dishName: (id: string) => string): string {
  const rows: string[][] = [];
  for (const day of menu.days) {
    for (const slot of day.slots) {
      rows.push([day.dateLabel, MEAL_LABEL[slot.meal], dishName(slot.dishId), String(slot.portions), slot.note ?? ""]);
    }
  }
  return toExcelCsv(["День", "Приём", "Блюдо", "Порций", "Заметка"], rows);
}

export async function saveTextFile(filename: string, contents: string): Promise<{ ok: boolean; path?: string }> {
  if (window.raskladka) return window.raskladka.saveFile(filename, contents);
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return { ok: true };
}

const PRINT_CSS = `
  body { font-family: "Segoe UI", sans-serif; color: #1c1914; margin: 24px; }
  h1 { font-size: 22px; margin: 0 0 8px; }
  p { color: #5a5348; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #d9d0c0; padding: 6px 8px; text-align: left; }
  th { color: #5a5348; font-weight: 500; }
  td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
  .muted { color: #5a5348; font-size: 12px; }
`;

export function printHtml(title: string, body: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(
    `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`,
  );
  doc.close();
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(cleanup, 4000);
  }, 250);
}

export function shoppingPrintHtml(list: ShoppingList, menuName: string): string {
  const rows = list.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.productName)}</td><td class="num">${escapeHtml(item.displayLabel)}</td><td class="num">${escapeHtml(formatMassGrams(item.toBuyG))}</td><td class="num">${escapeHtml(formatMoney(item.cost))}</td></tr>`,
    )
    .join("");
  return `<h1>Список покупок</h1><p>${escapeHtml(menuName)} · ${list.items.length} позиций · ${escapeHtml(formatMoney(list.totalCost))}</p><table><thead><tr><th>Продукт</th><th class="num">Нужно</th><th class="num">Докупить</th><th class="num">Сумма</th></tr></thead><tbody>${rows}</tbody></table>`;
}

export function menuPrintHtml(menu: Menu, dishName: (id: string) => string): string {
  const blocks = menu.days
    .map((day) => {
      const rows = day.slots
        .map(
          (slot) =>
            `<tr><td>${escapeHtml(MEAL_LABEL[slot.meal])}</td><td>${escapeHtml(dishName(slot.dishId))}</td><td class="num">${slot.portions}</td></tr>`,
        )
        .join("");
      return `<h2>${escapeHtml(day.dateLabel)}</h2><table><thead><tr><th>Приём</th><th>Блюдо</th><th class="num">Порций</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join("");
  return `<h1>${escapeHtml(menu.name)}</h1><p>${menu.guests} гостей</p>${blocks}`;
}

export function techCardPrintHtml(card: TechCard): string {
  const rows = card.lines
    .map(
      (line) =>
        `<tr><td>${line.index}</td><td>${escapeHtml(line.productName)}</td><td class="num">${escapeHtml(line.quantity)}</td><td class="num">${escapeHtml(line.grossG)}</td><td class="num">${escapeHtml(line.netG)}</td><td class="num">${escapeHtml(line.yieldG)}</td></tr>`,
    )
    .join("");
  return `<h1>${escapeHtml(card.title)}</h1><p>${escapeHtml(card.category)} · ${card.portions} порц. · порция ${escapeHtml(card.portionYield)}</p><table><thead><tr><th>№</th><th>Продукт</th><th class="num">Кол-во</th><th class="num">Брутто</th><th class="num">Нетто</th><th class="num">Выход</th></tr></thead><tbody>${rows}</tbody></table><p>${escapeHtml(card.nutritionPerPortion)} · ${escapeHtml(card.costPerPortion)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
