import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "./auth/pages/Login";
import ProtectedRoute from "./auth/Components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Mantenimiento from "./features/mantenimiento/pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";
import EquiposPage from "../src/features/Equipo/Equipo";
import UbicacionesTecnicasPage from "./features/UbicacionTecnica/Pages/UbicacionesTecnicasPage";
import ClientesPage from "./pages/ClientesPage";
import PlanesMantenimiento from "./features/PlanMantenimiento/pages/planesMantenimiento";
import TrabajadoresPage from "./features/Trabajores/pages/TrabajadorPage";
import MaintenanceGuides from "./features/GuiaMantenimiento/GuiaMantenimiento";
import GuiasKanban from "./pages/GuiaMantenimientoKanban";
// 1. Importa tu nuevo componente (ajusta la ruta según donde crees el archivo)


//Lista de link de e
import ListaLink from "./features/Equipo/ListaLink";
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
      {/* --- RUTAS PÚBLICAS --- */}
      <Route path="/login" element={<Login />} />

      {/* CORRECCIÓN: Se agrega la barra '/' antes de los ':' */}
      <Route path="/visor-cliente/:token" element={<ListaLink />} />

      {/* --- RUTAS PRIVADAS --- */}
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
        <Route path="GuiasKanban" element={<GuiasKanban/>} />
      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}