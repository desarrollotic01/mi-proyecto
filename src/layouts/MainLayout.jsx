import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/context/AuthContext";
import { Menu, X, LogOut, ShieldCheck } from "lucide-react";

const pages = [
  { name: "Avisos", path: "/Avisos" },
  { name: "Orden de Trabajo", path: "/orden-trabajo" },
  { name: "Planes de Mantenimiento", path: "/planes-mantenimiento" },
  { name: "Guia de Mantenimiento", path: "/guiaMantenimiento" },
  { name: "Alertas", path: "/alertas-guia" }
];

const catalogos = [
  { name: "Equipos", path: "/equipos" },
  { name: "Ubicaciones Técnicas", path: "/ubicaciones-tecnicas" },
  { name: "Clientes", path: "/clientes" },
  { name: "Trabajadores", path: "/trabajadores" },
  { name: "Items", path: "/items" },
  { name: "Solicitudes", path: "/solicitudes" }
];

export default function MainLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermiso } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Estado para el menú móvil

  const currentPage =
    pages.find((p) => p.path === location.pathname)?.name || 
    catalogos.find((c) => c.path === location.pathname)?.name || 
    "Dashboard";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden w-full">
      
      {/* OVERLAY PARA MÓVILES (Fondo oscuro al abrir el menú) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-[240px] bg-white border-r border-slate-200 flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between h-[72px] px-6 border-b border-slate-100 shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            Admin
          </h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* PROCESOS */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
              Procesos
            </p>
            <div className="flex flex-col space-y-1">
              {pages.map((page) => {
                const isActive = location.pathname === page.path;
                return (
                  <Link
                    key={page.path}
                    to={page.path}
                    onClick={() => setSidebarOpen(false)} // Cierra el menú al clickear en móvil
                    className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {page.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* CATÁLOGOS */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
              Catálogos
            </p>
            <div className="flex flex-col space-y-1">
              {catalogos.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* ADMINISTRACIÓN — solo para all_access */}
          {hasPermiso("all_access") && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">
                Administración
              </p>
              <Link
                to="/admin"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  location.pathname === "/admin"
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <ShieldCheck size={15} />
                Panel Admin
              </Link>
            </div>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden w-full relative">
        
        {/* TOP BAR */}
        <header className="h-[72px] bg-white border-b border-slate-200 px-4 sm:px-6 flex justify-between items-center shrink-0 z-30">
          
          <div className="flex items-center gap-4">
            {/* BOTÓN HAMBURGUESA PARA MÓVILES */}
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <span className="font-bold text-slate-800 text-[15px] sm:text-[17px] truncate max-w-[200px] sm:max-w-none">
              {currentPage}
            </span>
          </div>

          {/* USER MENU */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-100"
            >
              {user?.alias?.charAt(0).toUpperCase() || "A"}
            </button>

            {menuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setMenuOpen(false)} 
                />
                <div className="absolute right-0 mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {user?.alias || "Administrador"}
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sesión activa
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full relative">
          {children}
        </div>
      </main>
    </div>
  );
}