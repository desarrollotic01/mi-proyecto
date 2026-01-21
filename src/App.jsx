import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import Mantenimiento from "./features/mantenimiento/pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";
import Login from "./auth/pages/Login";
import ProtectedRoute from "./auth/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>

      {/* ===== RUTA PÚBLICA ===== */}
      <Route path="/login" element={<Login />} />

      {/* ===== RUTAS PROTEGIDAS ===== */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* 🔥 REDIRECCIÓN ROOT */}
        <Route path="/" element={<Navigate to="/mantenimiento" replace />} />

        <Route path="/mantenimiento" element={<Mantenimiento />} />
        <Route path="/orden-trabajo" element={<OrdenTrabajo />} />
      </Route>

    </Routes>
  );
}
