import { Link, useLocation, Outlet } from "react-router-dom";

const pages = [
  { name: "Mantenimiento", path: "/mantenimiento" },
  { name: "Orden de Trabajo", path: "/orden-trabajo" },
];

export default function MainLayout() {
  const location = useLocation();

  const currentPage =
    pages.find((p) => p.path === location.pathname)?.name || "";

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-50 bg-white shadow-xl flex flex-col">
        <h2 className="text-xl font-bold p-4 border-b">
          Administracion
        </h2>

        {/* Links */}
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

      {/* Content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white p-4 shadow-md border-b">
          <span className="font-semibold ml-2">
            {currentPage}
          </span>
        </header>

        {/* 🚨 AQUÍ VA EL CONTENIDO DE LAS RUTAS */}
        <div className="p-6 flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
