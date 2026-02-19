import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "./auth/pages/Login";
import ProtectedRoute from "./auth/Components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Mantenimiento from "./features/mantenimiento/pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";
import EquiposPage from "../src/features/Equipo/Equipo";
import UbicacionesTecnicasPage from "./pages/UbicacionesTecnicasPage";
import ClientesPage from "./pages/ClientesPage";
import PlanesMantenimiento from "./features/PlanMantenimiento/pages/planesMantenimiento";
import TrabajadoresPage from "./features/Trabajores/pages/TrabajadorPage";
import MaintenanceGuides from "./features/GuiaMantenimiento/GuiaMantenimiento";

function AppLayout() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* PUBLICO */}
      <Route path="/login" element={<Login />} />

      {/* PRIVADO CON LAYOUT */}
      <Route path="/" element={<AppLayout />}>
  <Route index element={<Navigate to="Avisos" replace />} />

  <Route path="Avisos" element={<Mantenimiento />} />
  <Route path="orden-trabajo" element={<OrdenTrabajo />} />
  <Route path="equipos" element={<EquiposPage />} />
  <Route path="ubicaciones-tecnicas" element={<UbicacionesTecnicasPage />} />
  <Route path="clientes" element={<ClientesPage />} />
  <Route path="planes-mantenimiento" element={<PlanesMantenimiento />} />
  <Route path="trabajadores" element={<TrabajadoresPage />} />
  <Route path="guiaMantenimiento" element={<MaintenanceGuides />} />

</Route>


      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

