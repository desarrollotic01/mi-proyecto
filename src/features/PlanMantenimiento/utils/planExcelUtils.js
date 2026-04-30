import * as XLSX from "xlsx";

const TIPO_TRABAJO_MAP = {
  T: "TORQUEO_REGULACION",
  A: "APLICACION",
  R: "REVISION",
  I: "INSPECCION",
  C: "CAMBIO",
  L: "LIMPIEZA",
};

const TIPO_TRABAJO_ABBR = {
  TORQUEO_REGULACION: "T",
  APLICACION: "A",
  REVISION: "R",
  INSPECCION: "I",
  CAMBIO: "C",
  LIMPIEZA: "L",
};

// Columnas de frecuencia en formato 1 (cabecera en fila 6)
const FRECUENCIA_COLS_F1 = [
  { col: 13, freq: "DIARIA",      label: "1D" },
  { col: 14, freq: "SEMANAL",     label: "1S" },
  { col: 15, freq: "QUINCENAL",   label: "2S" },
  { col: 16, freq: "MENSUAL",     label: "1M" },
  // col 17 = 2M (BIMESTRAL) no está en el modelo, se omite
  { col: 18, freq: "TRIMESTRAL",  label: "3M" },
  { col: 19, freq: "SEMESTRAL",   label: "6M" },
  { col: 20, freq: "ANUAL",       label: "1A" },
  { col: 21, freq: "BIENAL",      label: "2A" },
  { col: 22, freq: "QUINQUENAL",  label: "5A" },
];

// Columnas de frecuencia en formato 2 (cabecera en fila 0)
const FRECUENCIA_COLS_F2 = [
  { col: 16, freq: "SEMANAL",     label: "1S" },
  { col: 17, freq: "QUINCENAL",   label: "2S" },
  { col: 18, freq: "MENSUAL",     label: "1M" },
  { col: 19, freq: "BIMESTRAL",   label: "2M" }, // ignorado si no hay modelo
  { col: 20, freq: "TRIMESTRAL",  label: "3M" },
  { col: 21, freq: "SEMESTRAL",   label: "6M" },
  { col: 22, freq: "ANUAL",       label: "1A" },
  { col: 23, freq: "BIENAL",      label: "2A" },
  { col: 24, freq: "QUINQUENAL",  label: "5A" },
];

const FRECUENCIAS_VALIDAS = new Set([
  "POR_HORA","DIARIA","SEMANAL","QUINCENAL","MENSUAL",
  "TRIMESTRAL","SEMESTRAL","ANUAL","BIENAL","QUINQUENAL",
]);

function durToMin(duracion, unidad) {
  if (!duracion || !Number.isFinite(Number(duracion))) return null;
  const v = Number(duracion);
  return (unidad || "").toUpperCase() === "H" ? Math.round(v * 60) : Math.round(v);
}

function parseSheetF1(rows, sheetName) {
  const planes = [];
  const actsByFreq = {};
  FRECUENCIA_COLS_F1.forEach((f) => { actsByFreq[f.freq] = []; });

  let familiaStr = null;
  let modeloStr = null;

  for (let i = 8; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[7]) continue;

    if (row[0]) familiaStr = String(row[0]).trim();
    if (row[1]) modeloStr = String(row[1]).trim();

    const tarea = String(row[7]).trim();
    if (!tarea) continue;

    const op        = row[3]  ? String(row[3]).trim()  : null;
    const sistema   = row[4]  ? String(row[4]).trim()  : null;
    const subsistema= row[5]  ? String(row[5]).trim()  : null;
    const componente= row[6]  ? String(row[6]).trim()  : null;
    const cantTec   = row[8]  ? Number(row[8])         : 1;
    const duracion  = row[9]  ? Number(row[9])         : null;
    const unidad    = row[10] ? String(row[10]).trim()  : "H";

    for (const { col, freq } of FRECUENCIA_COLS_F1) {
      const val = row[col];
      if (!val) continue;
      const tipoCode = String(val).trim().toUpperCase();
      const tipoTrabajo = TIPO_TRABAJO_MAP[tipoCode] || "REVISION";

      actsByFreq[freq].push({
        codigoActividad: op || `ACT-${String(actsByFreq[freq].length + 1).padStart(2, "0")}`,
        sistema,
        subsistema,
        componente,
        tarea,
        tipoTrabajo,
        cantidadTecnicos: Number.isFinite(cantTec) ? cantTec : 1,
        duracionMinutos: durToMin(duracion, unidad),
        unidadDuracion: unidad.toUpperCase() === "H" ? "h" : "min",
        orden: actsByFreq[freq].length + 1,
        items: [],
      });
    }
  }

  for (const { freq, label } of FRECUENCIA_COLS_F1) {
    const actividades = actsByFreq[freq];
    if (!actividades.length) continue;
    planes.push({
      sheetName,
      nombre: `${sheetName} - ${label}`,
      tipoEquipo: familiaStr || "",
      modeloEquipo: modeloStr || "",
      frecuencia: freq,
      tipo: "PREVENTIVO",
      contextoObjetivo: "EQUIPO",
      esEspecifico: false,
      actividades,
    });
  }

  return planes;
}

function parseSheetF2(rows, sheetName) {
  const planes = [];
  const actsByFreq = {};
  FRECUENCIA_COLS_F2.filter((f) => FRECUENCIAS_VALIDAS.has(f.freq))
    .forEach((f) => { actsByFreq[f.freq] = []; });

  let familiaStr = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[6]) continue;

    if (row[1] && !familiaStr) familiaStr = String(row[1]).trim();

    const tarea = row[7] ? String(row[7]).trim() : String(row[6]).trim();
    if (!tarea) continue;

    const op      = row[2]  ? String(row[2]).trim() : null;
    const sistema = row[6]  ? String(row[6]).trim() : null;
    const cantTec = row[8]  ? Number(row[8])        : 1;
    const duracion= row[9]  ? Number(row[9])        : null;
    const unidad  = row[10] ? String(row[10]).trim() : "H";

    for (const { col, freq } of FRECUENCIA_COLS_F2) {
      if (!FRECUENCIAS_VALIDAS.has(freq)) continue;
      const val = row[col];
      if (!val) continue;
      const tipoCode = String(val).trim().toUpperCase();
      const tipoTrabajo = TIPO_TRABAJO_MAP[tipoCode] || "REVISION";

      actsByFreq[freq].push({
        codigoActividad: op || `ACT-${String(actsByFreq[freq].length + 1).padStart(2, "0")}`,
        sistema,
        subsistema: null,
        componente: null,
        tarea,
        tipoTrabajo,
        cantidadTecnicos: Number.isFinite(cantTec) ? cantTec : 1,
        duracionMinutos: durToMin(duracion, unidad),
        unidadDuracion: unidad.toUpperCase() === "H" ? "h" : "min",
        orden: actsByFreq[freq].length + 1,
        items: [],
      });
    }
  }

  for (const { freq, label } of FRECUENCIA_COLS_F2) {
    if (!FRECUENCIAS_VALIDAS.has(freq)) continue;
    const actividades = actsByFreq[freq];
    if (!actividades.length) continue;
    planes.push({
      sheetName,
      nombre: `${sheetName} - ${label}`,
      tipoEquipo: familiaStr || "",
      modeloEquipo: "",
      frecuencia: freq,
      tipo: "PREVENTIVO",
      contextoObjetivo: "EQUIPO",
      esEspecifico: false,
      actividades,
    });
  }

  return planes;
}

export function parseExcelPlanMantenimiento(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const todosLosPlanes = [];

        for (const sheetName of wb.SheetNames) {
          if (sheetName.toLowerCase().includes("procedimiento")) continue;

          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
          if (!rows.length) continue;

          const fila6 = rows[6] || [];
          const fila0 = rows[0] || [];

          if (String(fila6[0] || "").toUpperCase() === "FAMILIA") {
            todosLosPlanes.push(...parseSheetF1(rows, sheetName));
          } else if (String(fila0[0] || "").toUpperCase().includes("CODIGO")) {
            todosLosPlanes.push(...parseSheetF2(rows, sheetName));
          }
        }

        resolve(todosLosPlanes);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Columnas de frecuencia para exportación (igual que F1 + BIMESTRAL en col 17)
const FREQ_EXPORT = [
  { col: 13, freq: "DIARIA",      label: "1D" },
  { col: 14, freq: "SEMANAL",     label: "1S" },
  { col: 15, freq: "QUINCENAL",   label: "2S" },
  { col: 16, freq: "MENSUAL",     label: "1M" },
  { col: 17, freq: "BIMESTRAL",   label: "2M" },
  { col: 18, freq: "TRIMESTRAL",  label: "3M" },
  { col: 19, freq: "SEMESTRAL",   label: "6M" },
  { col: 20, freq: "ANUAL",       label: "1A" },
  { col: 21, freq: "BIENAL",      label: "2A" },
  { col: 22, freq: "QUINQUENAL",  label: "5A" },
];

const FREQ_LABEL_MAP = {
  DIARIA: "1D", SEMANAL: "1S", QUINCENAL: "2S", MENSUAL: "1M",
  BIMESTRAL: "2M", TRIMESTRAL: "3M", SEMESTRAL: "6M",
  ANUAL: "1A", BIENAL: "2A", QUINQUENAL: "5A", POR_HORA: "PH",
};

const COL_WIDTHS = [
  { wch: 25 }, // 0  FAMILIA
  { wch: 25 }, // 1  MODELO
  { wch: 6  }, // 2  Num.
  { wch: 12 }, // 3  Op.
  { wch: 22 }, // 4  SISTEMA
  { wch: 18 }, // 5  SUBSISTEMA
  { wch: 18 }, // 6  COMPONENTE
  { wch: 50 }, // 7  TAREA
  { wch: 12 }, // 8  Cant. Técnicos
  { wch: 10 }, // 9  Duración
  { wch: 6  }, // 10 Un.
  { wch: 20 }, // 11 Rol Técnico
  { wch: 4  }, // 12 (vacío)
  ...FREQ_EXPORT.map(() => ({ wch: 5 })),
];

/* ----------------------------------------------------------------
   Estilos para el Excel exportado
---------------------------------------------------------------- */
const S_INFO_LABEL = {
  fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
  font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "92400E" } },
};

const S_INFO_VALUE = {
  fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
  font: { sz: 11, name: "Calibri" },
};

const S_INFO_EMPTY = {
  fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
};

const S_COL_HEADER = {
  fill: { patternType: "solid", fgColor: { rgb: "F59E0B" } },
  font: { bold: true, sz: 10, name: "Calibri", color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "B45309" } },
    bottom: { style: "thin", color: { rgb: "B45309" } },
    left: { style: "thin", color: { rgb: "B45309" } },
    right: { style: "thin", color: { rgb: "B45309" } },
  },
};

const S_FREQ_HEADER = {
  fill: { patternType: "solid", fgColor: { rgb: "B45309" } },
  font: { bold: true, sz: 9, name: "Calibri", color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "center" },
  border: {
    top: { style: "thin", color: { rgb: "92400E" } },
    bottom: { style: "thin", color: { rgb: "92400E" } },
    left: { style: "thin", color: { rgb: "92400E" } },
    right: { style: "thin", color: { rgb: "92400E" } },
  },
};

const S_DATA_ODD = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFBEB" } },
  font: { sz: 10, name: "Calibri" },
};

const S_DATA_EVEN = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
  font: { sz: 10, name: "Calibri" },
};

const S_DATA_FREQ = {
  fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } },
  font: { bold: true, sz: 10, name: "Calibri", color: { rgb: "78350F" } },
  alignment: { horizontal: "center" },
};

function applyRowStyle(ws, rowIdx, totalCols, styleNormal, styleColsFreq) {
  for (let c = 0; c < totalCols; c++) {
    const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
    if (!ws[ref]) ws[ref] = { t: "s", v: "" };
    const isFreqCol = styleColsFreq && FREQ_EXPORT.some((f) => f.col === c);
    ws[ref].s = isFreqCol ? styleColsFreq : styleNormal;
  }
}

function buildPlanSheet(plan) {
  const TOTAL_COLS = 23;
  const empty = () => Array(TOTAL_COLS).fill("");

  const r0 = empty(); r0[0] = "PLAN DE MANTENIMIENTO"; r0[2] = plan.nombre || "";
  const r1 = empty(); r1[0] = "CÓDIGO";                r1[2] = plan.codigoPlan || "";
  const r2 = empty(); r2[0] = "TIPO";                  r2[2] = plan.tipo || "";
  const r3 = empty(); r3[0] = "FRECUENCIA";             r3[2] = FREQ_LABEL_MAP[plan.frecuencia] || plan.frecuencia || "";
  const r4 = empty(); r4[0] = "TIPO EQUIPO";            r4[2] = plan.tipoEquipo || "";
  const r5 = empty(); r5[0] = "MODELO EQUIPO";          r5[2] = plan.modeloEquipo || "";

  const r6 = empty();
  r6[0] = "FAMILIA"; r6[1] = "MODELO"; r6[2] = "Num."; r6[3] = "Op.";
  r6[4] = "SISTEMA"; r6[5] = "SUBSISTEMA"; r6[6] = "COMPONENTE"; r6[7] = "TAREA";
  r6[8] = "Cant. Técnicos"; r6[9] = "Duración"; r6[10] = "Un."; r6[11] = "Rol Técnico";
  FREQ_EXPORT.forEach(({ col, label }) => { r6[col] = label; });

  const filas = [r0, r1, r2, r3, r4, r5, r6, empty()];

  const freqEntry = FREQ_EXPORT.find((f) => f.freq === plan.frecuencia);

  (plan.actividades || []).forEach((act, i) => {
    const row = empty();
    const durVal =
      act.unidadDuracion === "h"
        ? (act.duracionEstimadaValor ?? (act.duracionMinutos != null ? act.duracionMinutos / 60 : ""))
        : (act.duracionEstimadaValor ?? act.duracionMinutos ?? "");
    const tipoAbr = TIPO_TRABAJO_ABBR[act.tipoTrabajo] || "";

    row[0]  = plan.tipoEquipo      || "";
    row[1]  = plan.modeloEquipo    || "";
    row[2]  = i + 1;
    row[3]  = act.codigoActividad  || "";
    row[4]  = act.sistema          || "";
    row[5]  = act.subsistema       || "";
    row[6]  = act.componente       || "";
    row[7]  = act.tarea            || "";
    row[8]  = act.cantidadTecnicos ?? 1;
    row[9]  = durVal !== "" ? durVal : "";
    row[10] = act.unidadDuracion === "h" ? "H" : "min";
    row[11] = act.rolTecnico       || "";
    if (freqEntry && tipoAbr) row[freqEntry.col] = tipoAbr;

    filas.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws["!cols"] = COL_WIDTHS;

  // Expande !ref para que abarque todas las columnas (los estilos de fondo necesitan que la celda exista)
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: filas.length - 1, c: TOTAL_COLS - 1 },
  });

  // ── Estilos filas info (0-5) ──────────────────────────────
  for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
    for (let c = 0; c < TOTAL_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) ws[ref] = { t: "z", v: undefined };
      ws[ref].s = c === 0 ? S_INFO_LABEL : c === 2 ? S_INFO_VALUE : S_INFO_EMPTY;
    }
  }

  // ── Fila 0: título principal con fuente grande ────────────
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleRef].s = {
    fill: { patternType: "solid", fgColor: { rgb: "D97706" } },
    font: { bold: true, sz: 14, name: "Calibri", color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "center" },
  };

  // ── Estilos fila cabecera (6) ─────────────────────────────
  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][6] = { hpt: 36 };
  for (let c = 0; c < TOTAL_COLS; c++) {
    const ref = XLSX.utils.encode_cell({ r: 6, c });
    if (!ws[ref]) ws[ref] = { t: "z", v: undefined };
    const isFreq = FREQ_EXPORT.some((f) => f.col === c);
    ws[ref].s = isFreq ? S_FREQ_HEADER : S_COL_HEADER;
  }

  // ── Estilos fila vacía (7) ────────────────────────────────
  applyRowStyle(ws, 7, TOTAL_COLS, { fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } } }, null);

  // ── Estilos filas de datos ────────────────────────────────
  const dataStart = 8;
  const dataEnd = filas.length;
  for (let rowIdx = dataStart; rowIdx < dataEnd; rowIdx++) {
    const baseStyle = (rowIdx - dataStart) % 2 === 0 ? S_DATA_ODD : S_DATA_EVEN;
    for (let c = 0; c < TOTAL_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) continue;
      const isFreq = FREQ_EXPORT.some((f) => f.col === c);
      ws[ref].s = isFreq && ws[ref].v ? S_DATA_FREQ : baseStyle;
    }
  }

  return ws;
}

// Exporta un solo plan (botón por fila)
export function exportarPlanExcel(plan) {
  const wb = XLSX.utils.book_new();
  const sheetName = (plan.nombre || plan.codigoPlan || "Plan").slice(0, 31);
  XLSX.utils.book_append_sheet(wb, buildPlanSheet(plan), sheetName);

  const filename = `${plan.codigoPlan || "plan"}_${(plan.nombre || "").slice(0, 40)}.xlsx`
    .replace(/[/\\?%*:|"<>]/g, "_");
  XLSX.writeFile(wb, filename, { cellStyles: true });
}

// Exporta todos los planes (botón de arriba), uno por hoja
export function exportarListaPlanes(planes) {
  if (!planes || !planes.length) return;
  const wb = XLSX.utils.book_new();
  const usedNames = new Set();

  planes.forEach((plan) => {
    const base = (plan.nombre || plan.codigoPlan || "Plan").slice(0, 31);
    let sheetName = base;
    let n = 2;
    while (usedNames.has(sheetName)) {
      sheetName = base.slice(0, 28) + ` ${n++}`;
    }
    usedNames.add(sheetName);
    XLSX.utils.book_append_sheet(wb, buildPlanSheet(plan), sheetName);
  });

  const filename = `Planes_Mantenimiento_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename, { cellStyles: true });
}

/* ================================================================
   PLANTILLA DE IMPORTACIÓN
   Genera un .xlsx con hoja de instrucciones + hoja plantilla lista
   para ser importada usando el formato F1.
================================================================ */

const S_T_TITULO = {
  fill: { patternType: "solid", fgColor: { rgb: "1E3A5F" } },
  font: { bold: true, sz: 16, name: "Calibri", color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "left", vertical: "center" },
};
const S_T_SECCION = {
  fill: { patternType: "solid", fgColor: { rgb: "F59E0B" } },
  font: { bold: true, sz: 12, name: "Calibri", color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "left", vertical: "center" },
};
const S_T_SUBTITULO = {
  fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
  font: { bold: true, sz: 11, name: "Calibri", color: { rgb: "92400E" } },
};
const S_T_CUERPO = {
  fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
  font: { sz: 10, name: "Calibri", color: { rgb: "374151" } },
  alignment: { wrapText: true, vertical: "top" },
};
const S_T_CODIGO = {
  fill: { patternType: "solid", fgColor: { rgb: "F3F4F6" } },
  font: { bold: true, sz: 10, name: "Courier New", color: { rgb: "1E3A5F" } },
  alignment: { horizontal: "center" },
};
const S_T_OK = {
  fill: { patternType: "solid", fgColor: { rgb: "D1FAE5" } },
  font: { bold: true, sz: 10, name: "Calibri", color: { rgb: "065F46" } },
  alignment: { horizontal: "center" },
};
const S_T_WARN = {
  fill: { patternType: "solid", fgColor: { rgb: "FEF3C7" } },
  font: { sz: 10, name: "Calibri", color: { rgb: "92400E" } },
  alignment: { wrapText: true, vertical: "top" },
};

function setCelda(ws, r, c, value, style, totalCols) {
  const ref = XLSX.utils.encode_cell({ r, c });
  ws[ref] = { t: typeof value === "number" ? "n" : "s", v: value ?? "" };
  if (style) ws[ref].s = style;
  if (totalCols) {
    const cur = XLSX.utils.decode_range(ws["!ref"] || "A1");
    if (r > cur.e.r) cur.e.r = r;
    if (c > cur.e.c) cur.e.c = c;
    ws["!ref"] = XLSX.utils.encode_range(cur);
  }
}

function buildInstruccionesSheet() {
  const ws = {};
  ws["!ref"] = "A1:H1";
  ws["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 40 },
  ];
  ws["!rows"] = [{ hpt: 40 }, {}, { hpt: 28 }, {}, { hpt: 28 }, { hpt: 28 }];

  let r = 0;

  // Título principal
  setCelda(ws, r, 0, "INSTRUCCIONES — IMPORTACIÓN DE PLANES DE MANTENIMIENTO", S_T_TITULO, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_TITULO, 8);
  r++;

  setCelda(ws, r, 0, "", S_T_CUERPO, 8); r++;

  // Sección 1
  setCelda(ws, r, 0, "1. ESTRUCTURA GENERAL DEL ARCHIVO", S_T_SECCION, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_SECCION, 8);
  r++;

  const instrGeneral = [
    ["• La hoja debe llamarse como el equipo/modelo (ej: CHILLER, BOMBA CENTRIFUGA, etc.)"],
    ["• La fila 7 (fila de cabecera) debe contener exactamente: FAMILIA en columna A"],
    ["• Los datos de actividades comienzan en la fila 9 en adelante"],
    ["• Se pueden tener múltiples hojas, una por tipo de equipo"],
    ["• Las hojas llamadas 'PROCEDIMIENTO' son ignoradas automáticamente"],
  ];
  instrGeneral.forEach(([txt]) => {
    setCelda(ws, r, 0, txt, S_T_CUERPO, 8);
    for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_CUERPO, 8);
    r++;
  });
  r++;

  // Sección 2 - columnas
  setCelda(ws, r, 0, "2. COLUMNAS DE LA PLANTILLA (fila de datos)", S_T_SECCION, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_SECCION, 8);
  r++;

  const colHeaders = ["Columna", "Letra Excel", "Campo", "Obligatorio", "Ejemplo", "", "", "Descripción"];
  colHeaders.forEach((h, c) => setCelda(ws, r, c, h, S_T_SUBTITULO, 8));
  r++;

  const columnas = [
    ["Col A", "A", "FAMILIA", "No *", "CHILLER", "", "", "Tipo de equipo. Solo en la 1ra fila del grupo."],
    ["Col B", "B", "MODELO", "No", "30XA-200", "", "", "Modelo del equipo. Solo en la 1ra fila."],
    ["Col C", "C", "Num.", "No", "1", "", "", "Número de orden de la actividad (auto)."],
    ["Col D", "D", "Op. / Código", "No", "PM-001", "", "", "Código de la operación o actividad."],
    ["Col E", "E", "SISTEMA", "No", "REFRIGERACIÓN", "", "", "Sistema al que pertenece la tarea."],
    ["Col F", "F", "SUBSISTEMA", "No", "COMPRESORES", "", "", "Subsistema (opcional)."],
    ["Col G", "G", "COMPONENTE", "No", "COMPRESOR 1", "", "", "Componente específico (opcional)."],
    ["Col H", "H", "TAREA", "SÍ ✓", "Verificar presión de aceite", "", "", "Descripción de la tarea. OBLIGATORIO."],
    ["Col I", "I", "Cant. Técnicos", "No", "2", "", "", "Número de técnicos requeridos. Default: 1."],
    ["Col J", "J", "Duración", "No", "1.5", "", "", "Duración de la tarea (en horas o minutos)."],
    ["Col K", "K", "Unidad", "No", "H", "", "", "H = horas, M o min = minutos. Default: H."],
    ["Col L", "L", "Rol Técnico", "No", "TECNICO_MECANICO", "", "", "Rol del técnico responsable."],
  ];
  columnas.forEach(([col, letra, campo, oblig, ej, , , desc], i) => {
    const base = i % 2 === 0 ? S_T_CUERPO : { ...S_T_CUERPO, fill: { patternType: "solid", fgColor: { rgb: "F9FAFB" } } };
    setCelda(ws, r, 0, col, S_T_CODIGO, 8);
    setCelda(ws, r, 1, letra, S_T_CODIGO, 8);
    setCelda(ws, r, 2, campo, { ...base, font: { bold: true, sz: 10, name: "Calibri" } }, 8);
    setCelda(ws, r, 3, oblig, oblig.includes("SÍ") ? S_T_OK : base, 8);
    setCelda(ws, r, 4, ej, base, 8);
    setCelda(ws, r, 5, "", base, 8);
    setCelda(ws, r, 6, "", base, 8);
    setCelda(ws, r, 7, desc, base, 8);
    r++;
  });
  r++;

  // Sección 3 - frecuencias
  setCelda(ws, r, 0, "3. COLUMNAS DE FRECUENCIA (marcar con código de tipo de trabajo)", S_T_SECCION, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_SECCION, 8);
  r++;

  const freqHeaders = ["Columna Excel", "Código", "Frecuencia", "", "", "", "", "Notas"];
  freqHeaders.forEach((h, c) => setCelda(ws, r, c, h, S_T_SUBTITULO, 8));
  r++;

  const freqData = [
    ["Col N (13)", "1D", "DIARIA"],
    ["Col O (14)", "1S", "SEMANAL"],
    ["Col P (15)", "2S", "QUINCENAL"],
    ["Col Q (16)", "1M", "MENSUAL"],
    ["Col R (17)", "2M", "BIMESTRAL (ignorado si no existe en el modelo)"],
    ["Col S (18)", "3M", "TRIMESTRAL"],
    ["Col T (19)", "6M", "SEMESTRAL"],
    ["Col U (20)", "1A", "ANUAL"],
    ["Col V (21)", "2A", "BIENAL"],
    ["Col W (22)", "5A", "QUINQUENAL"],
  ];
  freqData.forEach(([col, cod, freq], i) => {
    const base = i % 2 === 0 ? S_T_CUERPO : { ...S_T_CUERPO, fill: { patternType: "solid", fgColor: { rgb: "F9FAFB" } } };
    setCelda(ws, r, 0, col, S_T_CODIGO, 8);
    setCelda(ws, r, 1, cod, { ...S_T_CODIGO, fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } } }, 8);
    setCelda(ws, r, 2, freq, base, 8);
    for (let c = 3; c < 8; c++) setCelda(ws, r, c, "", base, 8);
    r++;
  });
  r++;

  // Sección 4 - códigos
  setCelda(ws, r, 0, "4. CÓDIGOS DE TIPO DE TRABAJO (valor a poner en la celda de frecuencia)", S_T_SECCION, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_SECCION, 8);
  r++;

  const tipoHeaders = ["Código", "Tipo de trabajo", "", "", "", "", "", "Ejemplo de uso"];
  tipoHeaders.forEach((h, c) => setCelda(ws, r, c, h, S_T_SUBTITULO, 8));
  r++;

  const tipos = [
    ["T", "TORQUEO / REGULACIÓN", "Poner T en columna 1M para tarea trimestral de torqueo"],
    ["A", "APLICACIÓN", "Poner A en columna 6M para aplicar lubricante cada 6 meses"],
    ["R", "REVISIÓN", "Poner R en columna 1S para revisión semanal"],
    ["I", "INSPECCIÓN", "Poner I en columna 1M para inspección mensual"],
    ["C", "CAMBIO", "Poner C en columna 1A para cambio anual de filtro"],
    ["L", "LIMPIEZA", "Poner L en columna 3M para limpieza trimestral"],
  ];
  tipos.forEach(([cod, tipo, ejemplo], i) => {
    const base = i % 2 === 0 ? S_T_CUERPO : { ...S_T_CUERPO, fill: { patternType: "solid", fgColor: { rgb: "F9FAFB" } } };
    setCelda(ws, r, 0, cod, S_T_CODIGO, 8);
    setCelda(ws, r, 1, tipo, { ...base, font: { bold: true, sz: 10, name: "Calibri" } }, 8);
    setCelda(ws, r, 2, "", base, 8);
    setCelda(ws, r, 3, "", base, 8);
    setCelda(ws, r, 4, "", base, 8);
    setCelda(ws, r, 5, "", base, 8);
    setCelda(ws, r, 6, "", base, 8);
    setCelda(ws, r, 7, ejemplo, base, 8);
    r++;
  });
  r++;

  // Sección 5 - tips
  setCelda(ws, r, 0, "5. CONSEJOS IMPORTANTES", S_T_SECCION, 8);
  for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", S_T_SECCION, 8);
  r++;

  const tips = [
    "⚠ La celda A7 de la hoja debe contener exactamente la palabra FAMILIA (en mayúsculas) para que el sistema reconozca el formato.",
    "⚠ La columna H (TAREA) es la única obligatoria. Toda fila sin tarea es ignorada.",
    "✓ Puedes dejar celdas en blanco. Los campos opcionales se omiten automáticamente.",
    "✓ Puedes tener múltiples frecuencias por tarea: pon el código en cada columna de frecuencia que aplique.",
    "✓ Si una tarea aplica a varias frecuencias, la descripción del tipo de trabajo es el mismo código (ej: R para Revisión).",
    "✓ FAMILIA y MODELO se toman de la primera fila donde aparecen y se usan para todas las actividades siguientes.",
    "⚠ No modifiques las columnas de frecuencia (N a W): el sistema las lee por posición, no por nombre.",
    "✓ Descarga la hoja PLANTILLA de este mismo archivo como base para tus datos.",
  ];
  tips.forEach((tip) => {
    const style = tip.startsWith("⚠") ? S_T_WARN : S_T_CUERPO;
    setCelda(ws, r, 0, tip, style, 8);
    for (let c = 1; c < 8; c++) setCelda(ws, r, c, "", style, 8);
    r++;
  });

  return ws;
}

function buildPlantillaSheet() {
  const TOTAL_COLS = 23;
  const empty = () => Array(TOTAL_COLS).fill("");

  // Filas info (0-5) — iguales que el export real
  const r0 = empty(); r0[0] = "PLAN DE MANTENIMIENTO"; r0[2] = "(Nombre del plan)";
  const r1 = empty(); r1[0] = "CÓDIGO";                r1[2] = "(Código automático)";
  const r2 = empty(); r2[0] = "TIPO";                  r2[2] = "PREVENTIVO";
  const r3 = empty(); r3[0] = "FRECUENCIA";             r3[2] = "(se detecta automáticamente)";
  const r4 = empty(); r4[0] = "TIPO EQUIPO";            r4[2] = "CHILLER";
  const r5 = empty(); r5[0] = "MODELO EQUIPO";          r5[2] = "30XA-200";

  // Fila 6: cabecera
  const r6 = empty();
  r6[0] = "FAMILIA"; r6[1] = "MODELO"; r6[2] = "Num."; r6[3] = "Op.";
  r6[4] = "SISTEMA"; r6[5] = "SUBSISTEMA"; r6[6] = "COMPONENTE"; r6[7] = "TAREA";
  r6[8] = "Cant. Técnicos"; r6[9] = "Duración"; r6[10] = "Un."; r6[11] = "Rol Técnico";
  FREQ_EXPORT.forEach(({ col, label }) => { r6[col] = label; });

  const filas = [r0, r1, r2, r3, r4, r5, r6, empty()];

  // Filas de ejemplo (8-10)
  const ejemplos = [
    { fam: "CHILLER", mod: "30XA-200", op: "PM-001", sis: "REFRIGERACIÓN", sub: "COMPRESORES", comp: "COMPRESOR 1", tarea: "Verificar presión de aceite del compresor", cant: 1, dur: 0.5, un: "H", rol: "TECNICO_MECANICO", freq1M: "R" },
    { fam: "", mod: "", op: "PM-002", sis: "REFRIGERACIÓN", sub: "CONDENSADOR", comp: "VENTILADORES", tarea: "Limpieza de aletas del condensador", cant: 2, dur: 2, un: "H", rol: "TECNICO_MECANICO", freq3M: "L" },
    { fam: "", mod: "", op: "PM-003", sis: "ELÉCTRICO", sub: "TABLERO", comp: "CONTACTORES", tarea: "Inspección de contactores y relés", cant: 1, dur: 1, un: "H", rol: "TECNICO_ELECTRICO", freq6M: "I" },
    { fam: "", mod: "", op: "PM-004", sis: "REFRIGERACIÓN", sub: "LUBRICACIÓN", comp: "", tarea: "Cambio de aceite del compresor", cant: 2, dur: 3, un: "H", rol: "TECNICO_MECANICO", freq1A: "C" },
  ];

  ejemplos.forEach(({ fam, mod, op, sis, sub, comp, tarea, cant, dur, un, rol, freq1D, freq1S, freq1M, freq3M, freq6M, freq1A }) => {
    const row = empty();
    row[0]  = fam;
    row[1]  = mod;
    row[3]  = op;
    row[4]  = sis;
    row[5]  = sub;
    row[6]  = comp;
    row[7]  = tarea;
    row[8]  = cant;
    row[9]  = dur;
    row[10] = un;
    row[11] = rol;
    if (freq1D) row[13] = freq1D;
    if (freq1S) row[14] = freq1S;
    if (freq1M) row[16] = freq1M;
    if (freq3M) row[18] = freq3M;
    if (freq6M) row[19] = freq6M;
    if (freq1A) row[20] = freq1A;
    filas.push(row);
  });

  // 10 filas vacías para que el usuario las llene
  for (let i = 0; i < 10; i++) filas.push(empty());

  const ws = XLSX.utils.aoa_to_sheet(filas);
  ws["!cols"] = COL_WIDTHS;
  ws["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: filas.length - 1, c: TOTAL_COLS - 1 } });
  ws["!rows"] = ws["!rows"] || [];
  ws["!rows"][6] = { hpt: 36 };

  // Estilos filas info (0-5)
  for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
    for (let c = 0; c < TOTAL_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) ws[ref] = { t: "z", v: undefined };
      ws[ref].s = c === 0 ? S_INFO_LABEL : c === 2 ? S_INFO_VALUE : S_INFO_EMPTY;
    }
  }
  // Título grande
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  ws[titleRef].s = {
    fill: { patternType: "solid", fgColor: { rgb: "D97706" } },
    font: { bold: true, sz: 14, name: "Calibri", color: { rgb: "FFFFFF" } },
    alignment: { horizontal: "left", vertical: "center" },
  };

  // Fila 6: cabecera
  for (let c = 0; c < TOTAL_COLS; c++) {
    const ref = XLSX.utils.encode_cell({ r: 6, c });
    if (!ws[ref]) ws[ref] = { t: "z", v: undefined };
    ws[ref].s = FREQ_EXPORT.some((f) => f.col === c) ? S_FREQ_HEADER : S_COL_HEADER;
  }

  // Fila 7 vacía
  applyRowStyle(ws, 7, TOTAL_COLS, { fill: { patternType: "solid", fgColor: { rgb: "FFFFFF" } } }, null);

  // Filas de ejemplo (8 en adelante): ámbar claro + frecuencias resaltadas
  const S_EJEMPLO = { fill: { patternType: "solid", fgColor: { rgb: "FFFBEB" } }, font: { sz: 10, name: "Calibri", italic: true, color: { rgb: "374151" } } };
  const S_EJEMPLO_FREQ = { fill: { patternType: "solid", fgColor: { rgb: "FDE68A" } }, font: { bold: true, sz: 10, name: "Calibri", color: { rgb: "78350F" } }, alignment: { horizontal: "center" } };
  const S_VACIA = { fill: { patternType: "solid", fgColor: { rgb: "F9FAFB" } }, font: { sz: 10, name: "Calibri" } };
  const dataCount = ejemplos.length + 10;
  for (let rowIdx = 8; rowIdx < 8 + dataCount; rowIdx++) {
    const esEjemplo = rowIdx < 8 + ejemplos.length;
    const base = esEjemplo ? S_EJEMPLO : S_VACIA;
    for (let c = 0; c < TOTAL_COLS; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) ws[ref] = { t: "z", v: undefined };
      const isFreq = FREQ_EXPORT.some((f) => f.col === c);
      ws[ref].s = isFreq && ws[ref].v ? S_EJEMPLO_FREQ : base;
    }
  }

  return ws;
}

export function descargarPlantillaImportacion() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildInstruccionesSheet(), "INSTRUCCIONES");
  XLSX.utils.book_append_sheet(wb, buildPlantillaSheet(), "PLANTILLA");
  XLSX.writeFile(wb, "Plantilla_Plan_Mantenimiento.xlsx", { cellStyles: true });
}
