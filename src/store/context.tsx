import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Dish, Menu, Product, RouteId, StockItem, Workspace } from "../types/models";
import { createId } from "../domain/ids";
import { importWorkspace, loadWorkspace, resetWorkspace, saveWorkspace } from "./persist";

interface WorkspaceApi {
  workspace: Workspace;
  route: RouteId;
  selectedProductId?: string;
  selectedDishId?: string;
  selectedMenuId?: string;
  setRoute: (route: RouteId) => void;
  selectProduct: (id?: string) => void;
  selectDish: (id?: string) => void;
  selectMenu: (id?: string) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  upsertDish: (dish: Dish) => void;
  removeDish: (id: string) => void;
  upsertMenu: (menu: Menu) => void;
  removeMenu: (id: string) => void;
  upsertStock: (item: StockItem) => void;
  removeStock: (productId: string) => void;
  setTitle: (title: string) => void;
  setCost: (cost: Workspace["cost"]) => void;
  reset: () => void;
  replace: (next: Workspace) => void;
  importJson: (raw: string) => void;
}

const Ctx = createContext<WorkspaceApi | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace());
  const [route, setRoute] = useState<RouteId>("today");
  const [selectedProductId, selectProduct] = useState<string | undefined>();
  const [selectedDishId, selectDish] = useState<string | undefined>();
  const [selectedMenuId, selectMenu] = useState<string | undefined>();

  useEffect(() => {
    saveWorkspace(workspace);
  }, [workspace]);

  const replace = useCallback((next: Workspace) => {
    setWorkspace({ ...next, updatedAt: new Date().toISOString() });
  }, []);

  const upsertProduct = useCallback((product: Product) => {
    setWorkspace((prev) => {
      const next = product.id ? product : { ...product, id: createId("prd") };
      const exists = prev.products.some((p) => p.id === next.id);
      return {
        ...prev,
        products: exists
          ? prev.products.map((p) => (p.id === next.id ? next : p))
          : [...prev.products, next],
      };
    });
    selectProduct(product.id || undefined);
  }, []);

  const removeProduct = useCallback((id: string) => {
    setWorkspace((prev) => ({ ...prev, products: prev.products.filter((p) => p.id !== id) }));
    selectProduct(undefined);
  }, []);

  const upsertDish = useCallback((dish: Dish) => {
    setWorkspace((prev) => {
      const next = dish.id ? dish : { ...dish, id: createId("dsh") };
      const exists = prev.dishes.some((d) => d.id === next.id);
      return {
        ...prev,
        dishes: exists ? prev.dishes.map((d) => (d.id === next.id ? next : d)) : [...prev.dishes, next],
      };
    });
    selectDish(dish.id || undefined);
  }, []);

  const removeDish = useCallback((id: string) => {
    setWorkspace((prev) => ({ ...prev, dishes: prev.dishes.filter((d) => d.id !== id) }));
    selectDish(undefined);
  }, []);

  const upsertMenu = useCallback((menu: Menu) => {
    setWorkspace((prev) => {
      const next = menu.id ? menu : { ...menu, id: createId("mnu") };
      const exists = prev.menus.some((m) => m.id === next.id);
      return {
        ...prev,
        menus: exists ? prev.menus.map((m) => (m.id === next.id ? next : m)) : [...prev.menus, next],
      };
    });
    selectMenu(menu.id || undefined);
  }, []);

  const removeMenu = useCallback((id: string) => {
    setWorkspace((prev) => ({ ...prev, menus: prev.menus.filter((m) => m.id !== id) }));
    selectMenu(undefined);
  }, []);

  const upsertStock = useCallback((item: StockItem) => {
    setWorkspace((prev) => {
      const exists = prev.inventory.some((s) => s.productId === item.productId);
      return {
        ...prev,
        inventory: exists
          ? prev.inventory.map((s) => (s.productId === item.productId ? item : s))
          : [...prev.inventory, item],
      };
    });
  }, []);

  const removeStock = useCallback((productId: string) => {
    setWorkspace((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((s) => s.productId !== productId),
    }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setWorkspace((prev) => ({ ...prev, title }));
  }, []);

  const setCost = useCallback((cost: Workspace["cost"]) => {
    setWorkspace((prev) => ({ ...prev, cost }));
  }, []);

  const reset = useCallback(() => {
    const seed = resetWorkspace();
    setWorkspace(seed);
    selectProduct(undefined);
    selectDish(undefined);
    selectMenu(undefined);
  }, []);

  const importJson = useCallback((raw: string) => {
    replace(importWorkspace(raw));
  }, [replace]);

  const api = useMemo<WorkspaceApi>(
    () => ({
      workspace,
      route,
      selectedProductId,
      selectedDishId,
      selectedMenuId,
      setRoute,
      selectProduct,
      selectDish,
      selectMenu,
      upsertProduct,
      removeProduct,
      upsertDish,
      removeDish,
      upsertMenu,
      removeMenu,
      upsertStock,
      removeStock,
      setTitle,
      setCost,
      reset,
      replace,
      importJson,
    }),
    [
      workspace,
      route,
      selectedProductId,
      selectedDishId,
      selectedMenuId,
      upsertProduct,
      removeProduct,
      upsertDish,
      removeDish,
      upsertMenu,
      removeMenu,
      upsertStock,
      removeStock,
      setTitle,
      setCost,
      reset,
      replace,
      importJson,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("WorkspaceProvider не подключён");
  return ctx;
}
