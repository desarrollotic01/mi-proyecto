export default function CampoLookup({
  label,
  name,
  value,
  onOpen,
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold mb-1">{label}</label>

      <div className="flex gap-2">
        <input
          value={value || ""}
          disabled
          className="border rounded px-3 py-2 w-full bg-gray-100"
        />

        <button
          type="button"
          onClick={onOpen}
          className="px-3 py-2 border rounded bg-gray-200 hover:bg-gray-300 font-bold"
        >
          ...
        </button>
      </div>
    </div>
  );
}
