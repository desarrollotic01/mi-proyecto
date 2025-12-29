import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Inicio from "./pages/Inicio";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Mantenimiento from "./pages/Mantenimiento";
import OrdenTrabajo from "./pages/OrdenTrabajo";

export default function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
        
          <Route path="/mantenimiento" element={<Mantenimiento />} />
          <Route path="/orden-trabajo" element={<OrdenTrabajo />} />  
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}
