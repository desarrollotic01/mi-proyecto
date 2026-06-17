import ModalBusquedaUniversal from "./ModalBusquedaUniversal";

/**
 * ModalLookup — wrapper ligero sobre ModalBusquedaUniversal.
 * Mantiene la misma API que antes para no romper importadores existentes.
 *
 * Props:
 *   isOpen   boolean
 *   onClose  () => void
 *   title    string
 *   data     Array<{ codigo, nombre, tipo?, ... }>
 *   onSelect (item) => void
 */
export default function ModalLookup({ isOpen, onClose, title, data, onSelect }) {
  const hasType = data.some((i) => i.tipo);

  const columns = [
    { key: "codigo", label: "Código", mono: true },
    { key: "nombre", label: "Nombre", flex: true },
    ...(hasType ? [{ key: "tipo", label: "Tipo" }] : []),
  ];

  return (
    <ModalBusquedaUniversal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      data={data}
      columns={columns}
      searchKeys={["codigo", "nombre"]}
      multiSelect={false}
      onSelect={(item) => { onSelect(item); onClose(); }}
      colorAccent="blue"
    />
  );
}
