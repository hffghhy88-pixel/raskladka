import type { Workspace } from "../types/models";
import { createSeedWorkspace } from "../data/seed";

const STORAGE_KEY = "raskladka.workspace.v1";
const SIMPLE_KEY = "raskladka.simple.v1";

export function loadSimpleMode(): boolean {
  const raw = localStorage.getItem(SIMPLE_KEY);
  if (raw === null) return true;
  return raw === "1";
}

export function saveSimpleMode(on: boolean): void {
  localStorage.setItem(SIMPLE_KEY, on ? "1" : "0");
}

export function loadWorkspace(): Workspace {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createSeedWorkspace();
    const parsed = JSON.parse(raw) as Workspace;
    if (!parsed || !Array.isArray(parsed.products) || !Array.isArray(parsed.dishes)) {
      return createSeedWorkspace();
    }
    return {
      ...createSeedWorkspace(),
      ...parsed,
      products: parsed.products,
      dishes: parsed.dishes,
      menus: parsed.menus ?? [],
      inventory: parsed.inventory ?? [],
      cost: parsed.cost ?? createSeedWorkspace().cost,
    };
  } catch {
    return createSeedWorkspace();
  }
}

export function saveWorkspace(workspace: Workspace): void {
  const next = { ...workspace, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function exportWorkspace(workspace: Workspace): string {
  return JSON.stringify({ ...workspace, updatedAt: new Date().toISOString() }, null, 2);
}

export function importWorkspace(raw: string): Workspace {
  const parsed = JSON.parse(raw) as Workspace;
  if (!parsed.products || !parsed.dishes) {
    throw new Error("в файле нет продуктов или блюд");
  }
  return {
    title: parsed.title || "Импорт",
    products: parsed.products,
    dishes: parsed.dishes,
    menus: parsed.menus ?? [],
    inventory: parsed.inventory ?? [],
    cost: parsed.cost ?? createSeedWorkspace().cost,
    updatedAt: new Date().toISOString(),
  };
}

export function resetWorkspace(): Workspace {
  const seed = createSeedWorkspace();
  saveWorkspace(seed);
  return seed;
}
