import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/context/AuthContext";

const pages = [
  { name: "Avisos", path: "/Avisos" },
  { name: "Orden de Trabajo", path: "/orden-trabajo" },
  { name: "Planes de Mantenimiento", path: "/planes-mantenimiento" },
  { name: "Guia de Mantenimiento", path: "/guiaMantenimiento" },
  { name: "Alertas", path: "/GuiasKanban" }
];

const catalogos = [
  { name: "Equipos", path: "/equipos" },
  { name: "Ubicaciones Técnicas", path: "/ubicaciones-tecnicas" },
  { name: "Clientes", path: "/clientes" },
  { name: "Trabajadores", path: "/trabajadores" },
  { name: "Items", path: "/items" }
];

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Estados para controlar los menús
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const currentPage =
    pages.find((p) => p.path === location.pathname)?.name || 
    catalogos.find((c) => c.path === location.pathname)?.name || 
    "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-[100dvh] bg-gray-100 overflow-hidden relative">
      
      {/* OVERLAY PARA MÓVIL */}
      {/* Este div oscuro aparece en pantallas pequeñas cuando el sidebar está abierto. Al tocarlo, se cierra. */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      {/* En móvil: posición fija, oculto a la izquierda. En PC (md): posición relativa, siempre visible. */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-52 bg-white shadow-xl flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-xl font-bold p-4 border-b flex-shrink-0 text-blue-900">
          Administración
        </h2>

        <nav className="flex flex-col p-4 space-y-4 flex-1 overflow-y-auto">
          {/* PROCESOS */}
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">
              Procesos
            </p>

            <div className="flex flex-col space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  to={page.path}
                  onClick={() => setSidebarOpen(false)} // Cierra el menú en móvil al navegar
                  className={`p-2 rounded-md font-medium transition-colors hover:bg-blue-100 ${
                    location.pathname === page.path
                      ? "bg-blue-200 text-blue-900"
                      : "text-gray-700"
                  }`}
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CATÁLOGOS */}
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2 font-semibold">
              Catálogos
            </p>

            <div className="flex flex-col space-y-2">
              {catalogos.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)} // Cierra el menú en móvil al navegar
                  className={`p-2 rounded-md font-medium transition-colors hover:bg-blue-100 ${
                    location.pathname === item.path
                      ? "bg-blue-200 text-blue-900"
                      : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* TOP BAR */}
        <header className="bg-white p-4 shadow-md border-b flex justify-between items-center flex-shrink-0 z-10">
          <div className="flex items-center">
            {/* BOTÓN HAMBURGUESA (Solo visible en móvil) */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="mr-3 p-2 text-gray-600 rounded-md hover:bg-gray-100 focus:outline-none md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-800 truncate">
              {currentPage}
            </span>
          </div>

          {/* USER MENU */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              {user?.alias?.charAt(0).toUpperCase() || "U"}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-semibold text-gray-800">
                    {user?.alias}
                  </p>
                  <p className="text-xs text-gray-500">
                    Sesión activa
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 font-medium transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT - CON SCROLL */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50">
          {children}
        </div>
      </main>
    </div>
  );
}