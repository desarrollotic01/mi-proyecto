import { useEffect, useRef, useState } from "react";
import { Package } from "lucide-react";
import { itemService } from "../services/itemService";
import ModalBusquedaUniversal from "../../../components/inputs/ModalBusquedaUniversal";
import { cachedGet } from "../../../utils/dataCache";

/**
 * Modal para seleccionar un ítem del catálogo.
 * Carga los items una sola vez (caché de módulo).
 *
 * Props:
 *   isOpen   : boolean
 *   onClose  : () => void
 *   onSelect : (item: { id, sapCode, nombre }) => void
 */
export default function ModalSeleccionItem({ isOpen, onClose, onSelect }) {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true);
    cachedGet("items", () => itemService.getAll())
      .then((data) => { if (!cancelled) setItems(Array.isArray(data) ? data : []); })
      .catch((err) => console.error("Error cargando items:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen]);

  return (
    <ModalBusquedaUniversal
      isOpen={isOpen}
      onClose={onClose}
      title="Seleccionar Ítem"
      icon={<Package />}
      colorAccent="slate"
      data={items}
      loading={loading}
      columns={[
        { key: "sapCode", label: "Código SAP", mono: true },
        { key: "nombre",  label: "Nombre",     flex: true },
      ]}
      searchKeys={["sapCode", "nombre"]}
      getRowId={(item) => item.id}
      multiSelect={false}
      onSelect={(item) => { onSelect(item); onClose(); }}
    />
  );
}
