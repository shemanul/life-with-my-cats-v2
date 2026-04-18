import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { CatDashboard } from "./pages/CatDashboard";
import { FoodRecord } from "./pages/FoodRecord";
import { VitalityRecord } from "./pages/VitalityRecord";
import { MedicationRecord } from "./pages/MedicationRecord";
import { ToothBrushRecord } from "./pages/ToothBrushRecord";
import { PoopRecord } from "./pages/PoopRecord";
import { VomitRecord } from "./pages/VomitRecord";
import { History } from "./pages/History";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/:catId",
    Component: CatDashboard,
  },
  {
    path: "/:catId/food",
    Component: FoodRecord,
  },
  {
    path: "/:catId/vitality",
    Component: VitalityRecord,
  },
  {
    path: "/:catId/medication",
    Component: MedicationRecord,
  },
  {
    path: "/:catId/toothbrush",
    Component: ToothBrushRecord,
  },
  {
    path: "/:catId/poop",
    Component: PoopRecord,
  },
  {
    path: "/:catId/vomit",
    Component: VomitRecord,
  },
  {
    path: "/:catId/history",
    Component: History,
  },
]);
