import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import Login from "./auth/pages/Login";
import ProtectedRoute from "./auth/Components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";

import Mantenimiento from "./features/mantenimiento/pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";

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
        <Route path="mantenimiento" element={<Mantenimiento />} />
        <Route path="orden-trabajo" element={<OrdenTrabajo />} />
      </Route>

      {/* DEFAULT */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
