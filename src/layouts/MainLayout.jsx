import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/context/AuthContext";

const pages = [
  { name: "Avisos", path: "/Avisos" },
  { name: "Orden de Trabajo", path: "/orden-trabajo" },
  { name: "Planes de Mantenimiento", path: "/planes-mantenimiento" },
  { name: "guiaMantenimiento", path: "/guiaMantenimiento" }
];

const catalogos = [
  { name: "Equipos", path: "/equipos" },
  { name: "Ubicaciones Técnicas", path: "/ubicaciones-tecnicas" },
  { name: "Clientes", path: "/clientes" },
  { name: "Trabajadores", path: "/trabajadores" }
];

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const currentPage =
    pages.find((p) => p.path === location.pathname)?.name || 
    catalogos.find((c) => c.path === location.pathname)?.name || 
    "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-52 bg-white shadow-xl flex flex-col flex-shrink-0 overflow-y-auto">
        <h2 className="text-xl font-bold p-4 border-b flex-shrink-0">
          Administración
        </h2>

        <nav className="flex flex-col p-4 space-y-4 flex-1">
          {/* PROCESOS */}
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2">
              Procesos
            </p>

            <div className="flex flex-col space-y-2">
              {pages.map((page) => (
                <Link
                  key={page.path}
                  to={page.path}
                  className={`p-2 rounded-md font-medium hover:bg-blue-100 ${
                    location.pathname === page.path
                      ? "bg-blue-200"
                      : ""
                  }`}
                >
                  {page.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CATÁLOGOS */}
          <div>
            <p className="text-xs text-gray-400 uppercase mb-2">
              Catálogos
            </p>

            <div className="flex flex-col space-y-2">
              {catalogos.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-md font-medium hover:bg-blue-100 ${
                    location.pathname === item.path
                      ? "bg-blue-200"
                      : ""
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
          <span className="font-semibold">
            {currentPage}
          </span>

          {/* USER MENU */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold"
            >
              {user?.alias?.charAt(0).toUpperCase() || "U"}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-semibold">
                    {user?.alias}
                  </p>
                  <p className="text-xs text-gray-500">
                    Sesión activa
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT - CON SCROLL */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}