import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "./auth/pages/Login";
import ProtectedRoute from "./auth/Components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Mantenimiento from "./features/mantenimiento/pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";
import EquiposPage from "../src/features/Equipo/Equipo";
import UbicacionesTecnicasPage from "./features/UbicacionTecnica/Pages/UbicacionesTecnicasPage";
import ClientesPage from "./features/Cliente/Pages/ClientesPage";
import PlanesMantenimiento from "./features/PlanMantenimiento/pages/planesMantenimiento";
import TrabajadoresPage from "./features/Trabajores/pages/TrabajadorPage";
import MaintenanceGuides from "./features/GuiaMantenimiento/GuiaMantenimiento";
import GuiasKanban from "./pages/GuiaMantenimientoKanban";
import ListaLink from "./features/Equipo/ListaLink";
import ItemsPage from "./pages/itemPage";
import AdminPage from "./features/Admin/pages/AdminPage";
import SolicitudesPage from "./features/Solicitudes/pages/SolicitudesPage";
import AlertasGuiaPage from "./pages/AlertasGuia";

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
      <Route path="/login" element={<Login />} />

      {/* RUTAS PÚBLICAS */}
      <Route path="/portal/cliente/:token" element={<ListaLink />} />
      <Route path="/visor-cliente/:token" element={<ListaLink />} />
      

      {/* RUTAS PRIVADAS */}
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
        <Route path="GuiasKanban" element={<GuiasKanban />} />
        <Route path="alertas-guia" element={<AlertasGuiaPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="solicitudes" element={<SolicitudesPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}