import { useEffect, useState } from "react";
import { itemService } from "../features/PlanMantenimiento/services/itemService";
import { Loader2, AlertCircle } from "lucide-react";

export default function ItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await itemService.getAll();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error cargando items:", err);
      setError("No se pudieron cargar los items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarItems();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[400px] text-red-500">
        <AlertCircle className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Lista de Items
      </h1>

      <div className="bg-white shadow rounded-lg overflow-hidden">

        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="text-left p-3">Código</th>
              <th className="text-left p-3">Nombre</th>
              <th className="text-left p-3">Descripción</th>
              <th className="text-left p-3">Estado</th>
            </tr>
          </thead>

          <tbody>

            {items.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center p-6 text-gray-500">
                  No hay items registrados
                </td>
              </tr>
            )}

            {items.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">

                <td className="p-3">
                  {item.codigo || item.code}
                </td>

                <td className="p-3">
                  {item.nombre || item.name}
                </td>

                <td className="p-3">
                  {item.descripcion || "-"}
                </td>

                <td className="p-3">
                  {item.state ? (
                    <span className="text-green-600 font-medium">
                      Activo
                    </span>
                  ) : (
                    <span className="text-red-500 font-medium">
                      Inactivo
                    </span>
                  )}
                </td>

              </tr>
            ))}

          </tbody>
        </table>

      </div>
    </div>
  );
}