// helpers/solicitudAlmacenAdapter.js

const ensureId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const emptyLinea = () => ({
  id: ensureId(),
  itemId: "",
  itemCode: "",
  description: "",
  quantity: 1,
  warehouseCode: "01",
  costCenter: "",
  projectCode: "",
  rubroId: null,
  paqueteTrabajoId: null,
});

const emptyForm = () => ({
  department: "",
  email: "",
  requiredDate: "",
  comments: "",
  lineas: [emptyLinea()],
});

const normalizeForm = (form) => {
  const f = form || emptyForm();
  const lineas = Array.isArray(f.lineas) ? f.lineas : [];

  return {
    ...emptyForm(),
    ...f,
    lineas:
      lineas.length > 0
        ? lineas.map((l) => ({
            ...emptyLinea(),
            ...l,
            id: l.id || ensureId(),
            quantity:
              Number.isFinite(Number(l.quantity)) && Number(l.quantity) > 0
                ? Number(l.quantity)
                : 1,
          }))
        : [emptyLinea()],
  };
};

export const mapSolicitudesAlmacenToModalValue = (solicitudes = []) => {
  const arr = Array.isArray(solicitudes) ? solicitudes : [];

  const solicitudGeneralDb = arr.find((s) => s?.esGeneral === true) || null;

  const solicitudesPorEquipo = {};

  for (const s of arr.filter((x) => !x?.esGeneral)) {
    const key = String(s.equipo_id || s.ubicacion_tecnica_id || "");
    if (!key) continue;

    solicitudesPorEquipo[key] = normalizeForm({
      id: s.id,
      department: s.department || "",
      email: s.requester || "",
      requiredDate: s.requiredDate ? String(s.requiredDate).slice(0, 10) : "",
      comments: s.comments || "",
      lineas: Array.isArray(s.lineas)
        ? s.lineas.map((l) => ({
            id: l.id || ensureId(),
            itemId: l.itemId || "",
            itemCode: l.itemCode || "",
            description: l.description || "",
            quantity:
              Number.isFinite(Number(l.quantity)) && Number(l.quantity) > 0
                ? Number(l.quantity)
                : 1,
            warehouseCode: l.warehouseCode || "01",
            costCenter: l.costingCode || "",
            projectCode: l.projectCode || "",
            rubroId: l.rubroId || null,
            paqueteTrabajoId: l.paqueteTrabajoId || null,
          }))
        : [emptyLinea()],
    });
  }

  return {
    solicitudGeneral: solicitudGeneralDb
      ? normalizeForm({
          id: solicitudGeneralDb.id,
          department: solicitudGeneralDb.department || "",
          email: solicitudGeneralDb.requester || "",
          requiredDate: solicitudGeneralDb.requiredDate
            ? String(solicitudGeneralDb.requiredDate).slice(0, 10)
            : "",
          comments: solicitudGeneralDb.comments || "",
          lineas: Array.isArray(solicitudGeneralDb.lineas)
            ? solicitudGeneralDb.lineas.map((l) => ({
                id: l.id || ensureId(),
                itemId: l.itemId || "",
                itemCode: l.itemCode || "",
                description: l.description || "",
                quantity:
                  Number.isFinite(Number(l.quantity)) && Number(l.quantity) > 0
                    ? Number(l.quantity)
                    : 1,
                warehouseCode: l.warehouseCode || "01",
                costCenter: l.costingCode || "",
                projectCode: l.projectCode || "",
                rubroId: l.rubroId || null,
                paqueteTrabajoId: l.paqueteTrabajoId || null,
              }))
            : [emptyLinea()],
        })
      : normalizeForm(emptyForm()),
    solicitudesPorEquipo,
  };
};

export const isSolicitudVacia = (s) => {
  if (!s) return true;

  const hasHeader = Boolean(
    s.department?.trim() ||
      s.email?.trim() ||
      s.requiredDate ||
      s.comments?.trim()
  );

  const hasLineas =
    Array.isArray(s.lineas) &&
    s.lineas.some((l) => {
      return (
        (l.itemCode?.trim() || l.description?.trim()) &&
        Number(l.quantity) > 0
      );
    });

  return !(hasHeader || hasLineas);
};

export const buildSolicitudAlmacenUpdatePayload = (form) => ({
  department: form.department || "",
  email: form.email || "",
  requester: form.email || "",
  requiredDate: form.requiredDate || "",
  comments: form.comments || "",
  lineas: (form.lineas || []).map((l) => ({
    itemId: l.itemId || null,
    itemCode: l.itemCode || "",
    description: l.description || "",
    quantity: Number(l.quantity) || 0,
    warehouseCode: l.warehouseCode || "",
    costingCode: l.costCenter || "",
    projectCode: l.projectCode || "",
    rubroId: l.rubroId || null,
    paqueteTrabajoId: l.paqueteTrabajoId || null,
  })),
});


export const buildSolicitudAlmacenCreatePayload = (form, extra = {}) => ({
  tratamiento_id: extra.tratamiento_id || null,
  ordenTrabajoId: extra.ordenTrabajoId || null,
  equipo_id: extra.equipo_id ?? null,
  ubicacion_tecnica_id: extra.ubicacion_tecnica_id ?? null,
  esGeneral: !!extra.esGeneral,
  department: form.department || "",
  requester: form.email?.trim() || "",
  requiredDate: form.requiredDate || "",
  comments: form.comments || "",
  lineas: Array.isArray(form.lineas)
    ? form.lineas.map((l) => ({
        itemId: l.itemId || null,
        itemCode: l.itemCode || "",
        description: l.description || "",
        quantity: Number(l.quantity) || 1,
        warehouseCode: l.warehouseCode || "",
        costingCode: l.costCenter || l.costingCode || "",
        projectCode: l.projectCode || "",
        rubroId: l.rubroId || null,
        paqueteTrabajoId: l.paqueteTrabajoId || null,
      }))
    : [],
});