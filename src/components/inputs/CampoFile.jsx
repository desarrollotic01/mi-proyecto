export default function CampoFile({
  label,
  name,
  handleInputChange,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-1">{label}</label>
      <input
        type="file"
        name={name}
        onChange={handleInputChange}
        className="border rounded px-3 py-2"
      />
    </div>
  );
}
