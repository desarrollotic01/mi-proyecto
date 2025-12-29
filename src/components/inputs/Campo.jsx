export default function Campo({
  label,
  name,
  tipo = "text",
  type = "text",
  opciones = [],
  disabled = false,
  formData,
  handleInputChange,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-1">{label}</label>

      {tipo === "select" ? (
        <select
          name={name}
          value={formData[name] || ""}
          disabled={disabled}
          onChange={handleInputChange}
          className="border rounded px-3 py-2"
        >
          <option value="">Seleccione...</option>
          {opciones.map((op, i) => (
            <option key={i} value={op}>
              {op}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          disabled={disabled}
          onChange={handleInputChange}
          className="border rounded px-3 py-2"
        />
      )}
    </div>
  );
}
