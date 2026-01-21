import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/context/AuthContext";

const pages = [
  { name: "Mantenimiento", path: "/mantenimiento" },
  { name: "Orden de Trabajo", path: "/orden-trabajo" },
];

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  const currentPage =
    pages.find((p) => p.path === location.pathname)?.name || "";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-52 bg-white shadow-xl flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b">
          Administración
        </h2>

        <nav className="flex flex-col p-4 space-y-2">
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
        </nav>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="bg-white p-4 shadow-md border-b flex justify-between items-center">
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

        {/* PAGE CONTENT */}
        <div className="p-6 flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
