import { ROUTE_META } from "./domain/labels";
import type { RouteId } from "./types/models";
import { useWorkspace } from "./store/context";
import { SimplePage } from "./pages/SimplePage";
import { CookFromPage } from "./pages/CookFromPage";
import { TodayPage } from "./pages/TodayPage";
import { ProductsPage } from "./pages/ProductsPage";
import { DishesPage } from "./pages/DishesPage";
import { CalculatorPage } from "./pages/CalculatorPage";
import { MenusPage } from "./pages/MenusPage";
import { ShoppingPage } from "./pages/ShoppingPage";
import { TechCardsPage } from "./pages/TechCardsPage";
import { StockPage } from "./pages/StockPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";

const SIMPLE_ROUTES: RouteId[] = ["simple", "cookfrom", "shopping", "stock", "settings"];
const FULL_ROUTES: RouteId[] = [
  "simple",
  "cookfrom",
  "today",
  "products",
  "dishes",
  "calculator",
  "menus",
  "shopping",
  "techcards",
  "stock",
  "reports",
  "settings",
];

export function App() {
  const { route, setRoute, workspace, simpleMode, setSimpleMode } = useWorkspace();
  const routes = simpleMode ? SIMPLE_ROUTES : FULL_ROUTES;

  return (
    <div className={`app ${simpleMode ? "is-simple" : ""}`}>
      <aside className="rail">
        <div className="brand">
          <strong>Раскладка</strong>
          <span>{simpleMode ? "простой режим" : "вес блюд · меню · закупка"}</span>
        </div>
        <nav className="nav">
          {routes.map((id) => (
            <button key={id} className={route === id ? "active" : ""} onClick={() => setRoute(id)}>
              {ROUTE_META[id].title}
              <small>{ROUTE_META[id].hint}</small>
            </button>
          ))}
        </nav>
        <button className="btn mode-toggle" onClick={() => setSimpleMode(!simpleMode)}>
          {simpleMode ? "Все разделы" : "Простой режим"}
        </button>
        <div className="rail-foot">
          {workspace.title}
          <br />
          {workspace.products.length} продуктов · {workspace.dishes.length} блюд
        </div>
      </aside>
      <main className="stage">
        {route === "simple" && <SimplePage />}
        {route === "cookfrom" && <CookFromPage />}
        {route === "today" && <TodayPage />}
        {route === "products" && <ProductsPage />}
        {route === "dishes" && <DishesPage />}
        {route === "calculator" && <CalculatorPage />}
        {route === "menus" && <MenusPage />}
        {route === "shopping" && <ShoppingPage />}
        {route === "techcards" && <TechCardsPage />}
        {route === "stock" && <StockPage />}
        {route === "reports" && <ReportsPage />}
        {route === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
